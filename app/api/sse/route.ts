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

// Zod schema for our dummy "search" tool arguments
const SearchParams = z.object({
    query: z.string()
})

/**
 * Handles incoming SSE connection requests.
 */
export async function GET(req: NextRequest) {
    const sessionId = crypto.randomUUID()

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
            const iv = setInterval(() => {
                controller.enqueue(encoder.encode(':\n\n'))
            }, 15_000)

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
            ''
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

        case 'tools/call':
            // 1) Only handle the "search" tool
            if (rpc.params?.name !== 'search') {
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    error: {
                        code: -32601,
                        message: `Tool not found: ${rpc.params?.name}`
                    }
                })
                break
            }

            // 2) Validate just the arguments object
            const parsed = SearchParams.safeParse(rpc.params.arguments)
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
                break
            }

            // 3) Send back a dummy result
            const { query } = parsed.data
            send({
                jsonrpc: '2.0',
                id: rpc.id,
                result: {
                    content: [
                        { type: 'text', text: `Results for “${query}”` }
                    ],
                    data: {
                        name: 'dummy-repo',
                        url: 'https://github.com/octocat/dummy-repo',
                        description: `Results for “${query}”`
                    }
                }
            })
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

    // ACK the POST so client can reuse the session
    return new Response(null, {
        status: 200,
        headers: { 'mcp-session-id': sessionId }
    })
}
