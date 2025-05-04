// app/api/sse/route.ts

import { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Zod schema for our "search" tool
const SearchParams = z.object({
    query: z.string()
})

type Session = {
    controller: ReadableStreamDefaultController<Uint8Array>
    nextId: number
}
const sessions = new Map<string, Session>()

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const basePath = url.pathname                  // "/api/sse"
    const sessionId = crypto.randomUUID()
    const endpoint = `${basePath}?sessionId=${sessionId}`

    console.log(`[sse][GET] New session ${sessionId}, endpoint → "${endpoint}"`)

    const headers = new Headers({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            // 1) Flush a comment so the client starts parsing immediately
            controller.enqueue(encoder.encode(':\n\n'))

            // 2) Send the MCP endpoint handshake
            const handshake = `event: endpoint\ndata: ${endpoint}\n\n`
            console.log(`[sse][GET] → handshake:\n${handshake}`)
            controller.enqueue(encoder.encode(handshake))

            // 3) Register this session
            sessions.set(sessionId, { controller, nextId: 1 })

            // 4) Heartbeats every 15s
            const iv = setInterval(
                () => controller.enqueue(encoder.encode(':\n\n')),
                15_000
            )

            // 5) Cleanup on client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(iv)
                controller.close()
                sessions.delete(sessionId)
                console.log(`[sse][GET] Session ${sessionId} closed`)
            })
        },
        cancel() {
            sessions.delete(sessionId)
            console.log(`[sse][GET] Session ${sessionId} cancelled`)
        },
    })

    return new Response(stream, { headers })
}

export async function POST(req: NextRequest) {
    const url = req.nextUrl
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId || !sessions.has(sessionId)) {
        console.warn(`[sse][POST] Session not found: ${sessionId}`)
        return new Response('Session not found', { status: 404 })
    }

    // parse the incoming JSON-RPC envelope
    let rpcReq: { jsonrpc: string; id?: number; method: string; params?: any }
    try {
        rpcReq = await req.json()
        console.log(
            `[sse][POST] ← RPC on session ${sessionId}:`,
            JSON.stringify(rpcReq)
        )
    } catch {
        console.error(`[sse][POST] Invalid JSON in session ${sessionId}`)
        return new Response('Invalid JSON', { status: 400 })
    }

    // If it's a JSON-RPC notification (no id), just ACK and do nothing
    if (rpcReq.id === undefined) {
        console.log(
            `[sse][POST] ⧗ Notification "${rpcReq.method}" — no reply sent`
        )
        return new Response(null, { status: 200 })
    }

    const session = sessions.get(sessionId)!
    const encoder = new TextEncoder()

    // helper to enqueue an SSE "message" event
    const send = (payload: any) => {
        const frame = [
            `id: ${session.nextId}`,
            `event: message`,
            `data: ${JSON.stringify(payload)}`,
            ``,
        ].join('\n')
        console.log(`[sse][POST] → SSE frame to ${sessionId}:\n${frame}`)
        session.controller.enqueue(encoder.encode(frame))
        session.nextId++
    }

    // common MCP metadata
    const serverInfo = { name: 'Dummy SSE Server', version: '1.0.0' }
    const capabilities = {
        tools: { listChanged: true },
        resources: {},
        prompts: {},
        logging: {},
        roots: {},
        sampling: {},
    }

    // dispatch the JSON-RPC method
    switch (rpcReq.method) {
        case 'initialize':
            send({
                jsonrpc: '2.0',
                id: rpcReq.id,
                result: {
                    protocolVersion: '2024-11-05',
                    serverInfo,
                    capabilities,
                },
            })
            break

        case 'listOfferings':
            send({
                jsonrpc: '2.0',
                id: rpcReq.id,
                result: {
                    serverInfo,
                    capabilities,
                    offerings: [
                        { name: 'search', description: 'Dummy GitHub search' },
                    ],
                },
            })
            break

        case 'tools/list':
        case 'listTools':
            send({
                jsonrpc: '2.0',
                id: rpcReq.id,
                result: {
                    serverInfo,
                    capabilities,
                    tools: [
                        {
                            name: 'search',
                            description: 'Dummy GitHub search',
                            inputSchema: {
                                type: 'object',
                                properties: { query: { type: 'string' } },
                                required: ['query'],
                            },
                        },
                    ],
                },
            })
            break

        case 'search':
            const parsed = SearchParams.safeParse(rpcReq.params)
            if (!parsed.success) {
                send({
                    jsonrpc: '2.0',
                    id: rpcReq.id,
                    error: {
                        code: -32602,
                        message: 'Invalid params',
                        data: parsed.error.issues,
                    },
                })
            } else {
                const { query } = parsed.data
                send({
                    jsonrpc: '2.0',
                    id: rpcReq.id,
                    result: {
                        repository: {
                            name: 'dummy-repo',
                            url: `https://github.com/octocat/dummy-repo`,
                            description: `A dummy repo for query “${query}”`,
                        },
                    },
                })
            }
            break

        default:
            send({
                jsonrpc: '2.0',
                id: rpcReq.id,
                error: { code: -32601, message: `Method not found: ${rpcReq.method}` },
            })
    }

    console.log(`[sse][POST] Responded HTTP 200 to session ${sessionId}`)
    return new Response(null, { status: 200 })
}
