import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireApiKeyAuth } from '@/lib/apiKeyAuth'
import { getFileMetadata } from '@/services/firebaseService'
import { getFirestore } from 'firebase-admin/firestore'
import { FILES_COLLECTION } from '@/services/firebaseService'
import { getSignedDownloadUrl, getFileContent } from '@/services/storageService'

// export const runtime = 'edge'
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

// Zod schemas for tool arguments
const ListArtifactsParams = z.object({})
const GetArtifactParams = z.object({ id: z.string(), expiresInSeconds: z.number().int().min(1).max(86400).optional() })

/**
 * Handles incoming SSE connection requests.
 */
export async function GET(req: NextRequest) {
    console.log('SSE GET called');
    try {
        let apiKeyRecord
        try {
            apiKeyRecord = await requireApiKeyAuth(req)
        } catch (err) {
            return err instanceof Response ? err : new Response('Unauthorized', { status: 401 })
        }

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
    } catch (err) {
        console.error('Error in /sse GET route:', err)
        return new Response('Internal Server Error', { status: 500 })
    }
}

/**
 * Handles JSON-RPC messages sent via POST.
 */
export async function POST(req: NextRequest) {
    console.log('SSE POST called');
    try {
        let apiKeyRecord
        try {
            apiKeyRecord = await requireApiKeyAuth(req)
        } catch (err) {
            console.error('API key error:', err)
            return err instanceof Response ? err : new Response('Unauthorized', { status: 401 })
        }
        // You can access permissions via apiKeyRecord if needed

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
                console.log('[SSE] tools/list called')
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    result: {
                        tools: [
                            {
                                name: 'artifacts/list',
                                description: 'List all available artifacts',
                                inputSchema: { type: 'object', properties: {}, required: [] }
                            },
                            {
                                name: 'artifacts/get',
                                description: 'Get the raw artifact data for a specific artifact by id',
                                inputSchema: {
                                    type: 'object',
                                    properties: { id: { type: 'string' }, expiresInSeconds: { type: 'integer', minimum: 1, maximum: 86400 } },
                                    required: ['id']
                                }
                            },
                            {
                                name: 'artifacts/get_metadata',
                                description: 'Get all metadata fields as text for a specific artifact by id',
                                inputSchema: {
                                    type: 'object',
                                    properties: { id: { type: 'string' } },
                                    required: ['id']
                                }
                            },
                            {
                                name: 'artifacts/search',
                                description: 'Search for artifacts by query string in fileName or description',
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
                console.log(`[SSE] tools/call: ${rpc.params?.name}`, rpc.params?.arguments)
                if (rpc.params?.name === 'artifacts/list') {
                    // No params needed
                    const parsed = ListArtifactsParams.safeParse(rpc.params.arguments)
                    if (!parsed.success) {
                        console.warn('[SSE] Invalid params for artifacts/list', parsed.error.issues)
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
                    try {
                        const db = getFirestore()
                        const snapshot = await db.collection(FILES_COLLECTION).orderBy('uploadedAt', 'desc').limit(100).get()
                        const artifacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        console.log(`[SSE] artifacts/list returned ${artifacts.length} artifacts`)
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            result: {
                                artifacts,
                                content: [{
                                    type: 'text',
                                    text: `IDs: ${artifacts.map(a => a.id).join(', ')}`
                                }]
                            }
                        })
                    } catch (err) {
                        console.error('[SSE] Failed to list artifacts', err)
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: { code: -32000, message: 'Failed to list artifacts', data: String(err) }
                        })
                    }
                    break
                }
                if (rpc.params?.name === 'artifacts/get') {
                    const parsed = GetArtifactParams.safeParse(rpc.params.arguments)
                    if (!parsed.success) {
                        console.warn('[SSE] Invalid params for artifacts/get', parsed.error.issues)
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
                    try {
                        const meta = await getFileMetadata(parsed.data.id)
                        if (!meta) {
                            console.warn(`[SSE] Artifact not found: ${parsed.data.id}`)
                            send({
                                jsonrpc: '2.0',
                                id: rpc.id,
                                error: { code: 404, message: 'Artifact not found' }
                            })
                        } else {
                            let contentText = ''
                            let contentType = meta.contentType || ''
                            // If file is generic (binary), return a download link
                            if (contentType.startsWith('application/') || contentType === 'binary/octet-stream') {
                                // Clamp expiresInSeconds to [1, 86400], default 300
                                let expiresInSeconds = 300
                                if (typeof parsed.data.expiresInSeconds === 'number') {
                                    expiresInSeconds = Math.max(1, Math.min(86400, parsed.data.expiresInSeconds))
                                }
                                const url = await getSignedDownloadUrl(meta.id, meta.fileName, expiresInSeconds)
                                contentText = `Download link (valid for ${expiresInSeconds} seconds): ${url}`
                            } else {
                                // Otherwise, return the file content as text (if possible)
                                try {
                                    const { buffer } = await getFileContent(meta.id)
                                    contentText = buffer.toString('utf-8')
                                } catch (e) {
                                    contentText = '[Error reading file content]'
                                }
                            }
                            send({
                                jsonrpc: '2.0',
                                id: rpc.id,
                                result: {
                                    artifact: meta,
                                    content: [{ type: 'text', text: contentText }]
                                }
                            })
                        }
                    } catch (err) {
                        console.error('[SSE] Failed to get artifact', err)
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: { code: -32000, message: 'Failed to get artifact', data: String(err) }
                        })
                    }
                    break
                }
                if (rpc.params?.name === 'artifacts/get_metadata') {
                    const parsed = GetArtifactParams.safeParse(rpc.params.arguments)
                    if (!parsed.success) {
                        console.warn('[SSE] Invalid params for artifacts/get_metadata', parsed.error.issues)
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
                    try {
                        const meta = await getFileMetadata(parsed.data.id)
                        if (!meta) {
                            console.warn(`[SSE] Artifact not found: ${parsed.data.id}`)
                            send({
                                jsonrpc: '2.0',
                                id: rpc.id,
                                error: { code: 404, message: 'Artifact not found' }
                            })
                        } else {
                            console.log(`[SSE] artifacts/get_metadata returned artifact for id: ${parsed.data.id}`)
                            send({
                                jsonrpc: '2.0',
                                id: rpc.id,
                                result: {
                                    artifact: meta,
                                    content: [{
                                        type: 'text',
                                        text: Object.entries(meta).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')
                                    }]
                                }
                            })
                        }
                    } catch (err) {
                        console.error('[SSE] Failed to get artifact metadata', err)
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: { code: -32000, message: 'Failed to get artifact metadata', data: String(err) }
                        })
                    }
                    break
                }
                if (rpc.params?.name === 'artifacts/search') {
                    const parsed = SearchParams.safeParse(rpc.params.arguments)
                    if (!parsed.success) {
                        console.warn('[SSE] Invalid params for search', parsed.error.issues)
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
                    try {
                        const db = getFirestore()
                        const queryStr = parsed.data.query.toLowerCase()
                        const snapshot = await db.collection(FILES_COLLECTION).orderBy('uploadedAt', 'desc').limit(100).get()
                        const artifacts = snapshot.docs
                            .map(doc => ({ id: doc.id, ...(doc.data() as { fileName?: string; description?: string }) }))
                            .filter(a =>
                                (a.fileName?.toLowerCase().includes(queryStr)) ||
                                (a.description?.toLowerCase().includes(queryStr))
                            )
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            result: {
                                artifacts,
                                content: [{
                                    type: 'text',
                                    text: `IDs: ${artifacts.map(a => a.id).join(', ')}`
                                }]
                            }
                        })
                    } catch (err) {
                        console.error('[SSE] Failed to search artifacts', err)
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: { code: -32000, message: 'Failed to search artifacts', data: String(err) }
                        })
                    }
                    break
                }
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    error: {
                        code: -32601,
                        message: `Tool not found: ${rpc.params?.name}`
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
    } catch (err) {
        console.error('Error in /sse POST route:', err)
        return new Response('Internal Server Error', { status: 500 })
    }
}
