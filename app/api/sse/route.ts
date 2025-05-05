// app/api/sse/route.ts

import { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory sessions map
type Session = {
    controller: ReadableStreamDefaultController<Uint8Array>
    nextEventId: number
}
const sessions = new Map<string, Session>()

// Zod schema for our "search" tool
const SearchParams = z.object({
    query: z.string()
})

/**
 * Handles incoming SSE connection requests.
 */
export async function GET(req: NextRequest) {
    // Generate a new session ID
    const sessionId = crypto.randomUUID()

    // Create the ReadableStream and register the session
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const encoder = new TextEncoder()
            sessions.set(sessionId, { controller, nextEventId: 1 })

            // 1) Kick-start the parser
            controller.enqueue(encoder.encode(':\n\n'))

            // 2) MCP handshake → tell client where to POST
            const endpoint = `/api/sse?sessionId=${sessionId}`
            controller.enqueue(
                encoder.encode(`event: endpoint\ndata: ${endpoint}\n\n`)
            )

            // 3) Heartbeat every 15s
            const iv = setInterval(
                () => controller.enqueue(encoder.encode(':\n\n')),
                15_000
            )

            // 4) Cleanup on client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(iv)
                controller.close()
                sessions.delete(sessionId)
            })
        },
        cancel() {
            sessions.delete(sessionId)
        }
    })

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive'
        }
    })
}

/**
 * Handles JSON-RPC messages sent via POST.
 */
export async function POST(req: NextRequest) {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId || !sessions.has(sessionId)) {
        return new Response('Session not found', { status: 404 })
    }

    // Parse JSON-RPC envelope
    let rpc: { jsonrpc: string; id?: number; method: string; params?: any }
    try {
        rpc = await req.json()
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    // If it's a notification (no id), just ACK
    if (rpc.id === undefined) {
        return new Response(null, {
            status: 200,
            headers: { 'mcp-session-id': sessionId }
        })
    }

    const session = sessions.get(sessionId)!
    const encoder = new TextEncoder()

    // Helper to enqueue an SSE "message" event
    const send = (payload: any) => {
        const frame = [
            `id: ${session.nextEventId}`,
            `event: message`,
            `data: ${JSON.stringify(payload)}`,
            ``
        ].join('\n')
        session.controller.enqueue(encoder.encode(frame))
        session.nextEventId++
    }

    // Dispatch JSON-RPC methods
    switch (rpc.method) {
        case 'initialize':
            send({
                jsonrpc: '2.0',
                id: rpc.id,
                result: {
                    // Use a version your client supports (e.g. 2024-11-05)
                    protocolVersion: '2024-11-05',
                    serverInfo: { name: 'Dummy SSE Server', version: '1.0.0' },
                    capabilities: {
                        tools: { listChanged: true },
                        resources: {},
                        prompts: {},
                        logging: {},
                        roots: {},
                        sampling: {}
                    }
                    // instructions?: 'You can list tools with "tools/list", call search, etc.'
                }
            })
            break

        case 'tools/list':
            send({
                jsonrpc: '2.0',
                id: rpc.id,
                result: {
                    tools: [
                        {
                            name: 'search',
                            description: 'Dummy GitHub search',
                            inputSchema: {
                                type: 'object',
                                properties: { query: { type: 'string' } },
                                required: ['query']
                            }
                        }
                    ]
                }
            })
            break

        case 'search':
            const parsed = SearchParams.safeParse(rpc.params)
            if (!parsed.success) {
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    error: {
                        code: -32602,
                        message: 'Invalid params',
                        data: parsed.error.issues
                    }
                })
            } else {
                const { query } = parsed.data
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    result: {
                        repository: {
                            name: 'dummy-repo',
                            url: `https://github.com/octocat/dummy-repo`,
                            description: `Results for “${query}”`
                        }
                    }
                })
            }
            break

        default:
            send({
                jsonrpc: '2.0',
                id: rpc.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${rpc.method}`
                }
            })
    }

    // Acknowledge the POST; return the same session ID so client can reuse it
    return new Response(null, {
        status: 200,
        headers: { 'mcp-session-id': sessionId }
    })
}
