import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabase, createServiceRoleClient } from 'lib/supabaseClient'
import { MCP } from 'types/mcp'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory sessions map
type Session = {
    controller: ReadableStreamDefaultController<Uint8Array>
    nextEventId: number
}
const sessions = new Map<string, Session>()

// Zod schema for our unified "search" tool
const SearchParams = z.object({
    query: z.string(),
    limit: z.number().optional().default(5)
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

    // Log the RPC message for debugging
    console.log('RPC Message:', JSON.stringify({
        method: rpc.method,
        id: rpc.id,
        params: rpc.params
    }, null, 2))

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
                            description: 'Search for MCPs from the Model Context Protocol Hub',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'Search query to find MCPs by name, description, or tags'
                                    },
                                    limit: {
                                        type: 'number',
                                        description: 'Maximum number of MCPs to return (default: 5)'
                                    }
                                },
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
                const { query, limit } = parsed.data
                try {
                    // Build the base query to select relevant fields
                    const selectFields = [
                        'id',
                        'name',
                        'description',
                        'repository_url',
                        'tags',
                        'author',
                        'stars',
                        'forks',
                        'avg_rating',
                        'review_count',
                        'view_count',
                        'last_repo_update'
                    ].join(', ');

                    // Create query builder
                    let queryBuilder = supabase
                        .from('mcps')
                        .select(selectFields);

                    // Apply search filter if query exists
                    if (query && query.trim() !== '') {
                        queryBuilder = queryBuilder.or(
                            `name.ilike.%${query}%,description.ilike.%${query}%`
                        );
                    }

                    // Apply pagination and order
                    const { data: mcpsData, error } = await queryBuilder
                        .order('stars', { ascending: false })
                        .limit(limit);

                    if (error) {
                        throw error;
                    }

                    // Explicitly type and format MCPs
                    const mcps = mcpsData as unknown as MCP[];

                    // Format and enhance each MCP for display
                    const formattedMcps = mcps.map(mcp => ({
                        id: mcp.id,
                        name: mcp.name,
                        description: mcp.description || 'No description available',
                        repository_url: mcp.repository_url || '',
                        tags: Array.isArray(mcp.tags) ? mcp.tags : [],
                        author: mcp.author || '',
                        stars: mcp.stars || 0,
                        forks: mcp.forks || 0,
                        avg_rating: mcp.avg_rating || 0,
                        review_count: mcp.review_count || 0,
                        view_count: mcp.view_count || 0,
                        last_repo_update: mcp.last_repo_update || null,
                        url: `/mcp/${mcp.id}`
                    }));

                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        result: {
                            mcps: formattedMcps,
                            meta: {
                                query: query,
                                count: formattedMcps.length,
                                limit: limit
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error searching MCPs:', error);
                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        error: {
                            code: -32603,
                            message: 'Internal error searching MCPs'
                        }
                    });
                }
            }
            break

        case 'tools/call':
            // Additional detailed logging for tools/call
            console.log('Tools/Call Details:', {
                toolName: rpc.params?.name,
                toolArgs: rpc.params?.arguments,
                rawParams: JSON.stringify(rpc.params)
            });

            // Parse the tool name and arguments from the request
            if (rpc.params?.name === 'search') {
                const mcpSearchParams = SearchParams.safeParse(rpc.params.arguments)
                if (!mcpSearchParams.success) {
                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        error: {
                            code: -32602,
                            message: 'Invalid params',
                            data: mcpSearchParams.error.issues
                        }
                    })
                } else {
                    const { query, limit } = mcpSearchParams.data
                    try {
                        // Build the base query to select relevant fields
                        const selectFields = [
                            'id',
                            'name',
                            'description',
                            'repository_url',
                            'tags',
                            'author',
                            'stars',
                            'forks',
                            'avg_rating',
                            'review_count',
                            'view_count',
                            'last_repo_update'
                        ].join(', ');

                        // Create query builder
                        let queryBuilder = supabase
                            .from('mcps')
                            .select(selectFields);

                        // Apply search filter if query exists
                        if (query && query.trim() !== '') {
                            queryBuilder = queryBuilder.or(
                                `name.ilike.%${query}%,description.ilike.%${query}%`
                            );
                        }

                        // Apply pagination and order
                        const { data: mcpsData, error } = await queryBuilder
                            .order('stars', { ascending: false })
                            .limit(limit);

                        if (error) {
                            throw error;
                        }

                        // Explicitly type and format MCPs
                        const mcps = mcpsData as unknown as MCP[];

                        // Format and enhance each MCP for display
                        const formattedMcps = mcps.map(mcp => ({
                            id: mcp.id,
                            name: mcp.name,
                            description: mcp.description || 'No description available',
                            repository_url: mcp.repository_url || '',
                            tags: Array.isArray(mcp.tags) ? mcp.tags : [],
                            author: mcp.author || '',
                            stars: mcp.stars || 0,
                            forks: mcp.forks || 0,
                            avg_rating: mcp.avg_rating || 0,
                            review_count: mcp.review_count || 0,
                            view_count: mcp.view_count || 0,
                            last_repo_update: mcp.last_repo_update || null,
                            url: `/mcp/${mcp.id}`
                        }));

                        // Format results according to the CallToolResult schema
                        // Plus include the actual raw data in a structured format for clients that can't parse JSON
                        const resultText = `Found ${formattedMcps.length} MCPs matching "${query}":\n\n` +
                            formattedMcps.map(mcp =>
                                `- ${mcp.name} by ${mcp.author}\n  ${mcp.description}\n  URL: ${mcp.repository_url}\n  Stars: ${mcp.stars}, Views: ${mcp.view_count}`
                            ).join('\n\n') +
                            '\n\n--- Raw JSON Data ---\n' +
                            JSON.stringify({ mcps: formattedMcps }, null, 2);

                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            result: {
                                content: [
                                    {
                                        type: 'text',
                                        text: resultText
                                    }
                                ],
                                // Including raw data in the result for clients that can process it
                                mcps: formattedMcps,
                                meta: {
                                    query: query,
                                    count: formattedMcps.length,
                                    limit: limit
                                }
                            }
                        });
                    } catch (error) {
                        console.error('Error searching MCPs:', error);
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32603,
                                message: 'Internal error searching MCPs'
                            }
                        });
                    }
                }
            } else {
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    error: {
                        code: -32601,
                        message: `Tool not found: ${rpc.params?.name}`
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
