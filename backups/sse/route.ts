import { NextRequest, NextResponse } from 'next/server'
import { ipAddress } from '@vercel/edge'; // Import ipAddress
import { Ratelimit, Duration } from '@upstash/ratelimit'; // Import Ratelimit AND Duration
import { Redis } from '@upstash/redis'; // Corrected Redis import for edge runtime

import { z } from 'zod'
import { supabase, createServiceRoleClient } from '@/lib/supabaseClient'
import { MCP } from 'types/mcp'
import { uploadFile, getSignedDownloadUrl } from '@/services/storageService'
import { saveFileMetadata, getFileMetadata, incrementDownloadCount, logEvent } from '@/services/redisService'

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
    limit: z
        .number()
        .min(1, { message: 'limit must be at least 1' })
        .max(20, { message: 'limit cannot exceed 20' })
        .optional()
        .default(5),
    tags: z
        .array(z.string())
        .optional()
        .describe('Optional tags to filter MCPs by, especially provider and deployment tags'),
})

// Zod schema for CreateUploadLink tool
const CreateUploadLinkParams = z.object({
    fileName: z.string().min(1, { message: 'fileName is required' }),
    contentType: z.string().min(1, { message: 'contentType is required' }),
    ttlHours: z.number()
        .min(0.016, { message: 'ttlHours must be at least 0.016 (1 minute)' })
        .max(24, { message: 'ttlHours cannot exceed 24 hours' })
        .optional()
        .default(1),
    base64Content: z.string().min(1, { message: 'base64Content is required' }),
})

// Zod schema for GetDownloadLink tool
const GetDownloadLinkParams = z.object({
    fileId: z.string().min(1, { message: 'fileId is required' }),
})

// List of allowed origins; use ['*'] to allow all
const ALLOWED_ORIGINS = ['*']

function getCorsHeaders(origin: string | null) {
    const allowOrigin = ALLOWED_ORIGINS.includes('*')
        ? '*'
        : (origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'null')

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
        'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
        // 'Access-Control-Allow-Credentials': 'true', // uncomment if using cookies
    }
}

// Initialize Upstash Redis client and Rate Limiter
// Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in your environment variables
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Read rate limit configuration from environment variables, with defaults
const rateLimitRequests = parseInt(process.env.UPSTASH_RATE_LIMIT_REQUESTS || '10', 10);
const rateLimitWindow = (process.env.UPSTASH_RATE_LIMIT_WINDOW || '10 s') as Duration;

const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(rateLimitRequests, rateLimitWindow), // Use the casted duration
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     */
    prefix: "@upstash/ratelimit/sse",
});

/**
 * Handle preflight CORS requests
 */
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin')
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(origin),
    })
}

/**
 * Handles incoming SSE connection requests.
 */
export async function GET(req: NextRequest) {
    // Rate limit check
    const ip = ipAddress(req) || '127.0.0.1'; // Get IP address
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
        return new Response('Rate limit exceeded', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
            },
        });
    }

    const origin = req.headers.get('origin')
    const cors = getCorsHeaders(origin)

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
            ...cors,
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
    // Rate limit check
    const ip = ipAddress(req) || '127.0.0.1'; // Get IP address
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
        return new Response('Rate limit exceeded', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
            },
        });
    }

    const origin = req.headers.get('origin')
    const cors = getCorsHeaders(origin)

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId || !sessions.has(sessionId)) {
        return new Response('Session not found', { status: 404, headers: cors, })
    }

    // Parse JSON-RPC envelope
    let rpc: { jsonrpc: string; id?: number; method: string; params?: any }
    try {
        rpc = await req.json()
    } catch {
        return new Response('Invalid JSON', { status: 400, headers: cors, })
    }

    // If it's a notification (no id), just ACK
    if (rpc.id === undefined) {
        return new Response(null, {
            status: 200,
            headers: { ...cors, 'mcp-session-id': sessionId }
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
                    protocolVersion: '2024-11-05',
                    serverInfo: { name: 'MCPH SSE', version: '1.0.0' },
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
                            description: 'Search for MCPs from the Model Context Protocol Hub. You can filter by provider tags (like "provider:Official" or "provider:Community") and deployment tags (like "deployment:Docker" or "deployment:Serverless").',
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
                                    },
                                    tags: {
                                        type: 'array',
                                        items: {
                                            type: 'string'
                                        },
                                        description: 'Filter MCPs by specific tags, particularly useful for provider tags (provider:Official, provider:Community) and deployment tags (deployment:Docker, deployment:Serverless, etc.)'
                                    }
                                },
                                required: ['query']
                            }
                        },
                        {
                            name: 'CreateUploadLink',
                            description: 'Upload a file to the file sharing service and get a link that expires after the TTL period.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    fileName: {
                                        type: 'string',
                                        description: 'Name of the file to upload'
                                    },
                                    contentType: {
                                        type: 'string',
                                        description: 'MIME type of the file (e.g., "text/plain", "application/pdf")'
                                    },
                                    ttlHours: {
                                        type: 'number',
                                        description: 'Time-to-live in hours (default: 1, min: 0.016 [1 minute], max: 24)'
                                    },
                                    base64Content: {
                                        type: 'string',
                                        description: 'Base64-encoded content of the file'
                                    }
                                },
                                required: ['fileName', 'contentType', 'base64Content']
                            }
                        },
                        {
                            name: 'GetDownloadLink',
                            description: 'Get a download link for an existing file by ID.',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    fileId: {
                                        type: 'string',
                                        description: 'ID of the file to download'
                                    }
                                },
                                required: ['fileId']
                            }
                        }
                    ]
                }
            })
            break

        case 'tools/call':
            // Additional detailed logging for tools/call
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
                    const { query, limit, tags } = mcpSearchParams.data
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

                        // Get data
                        const { data: mcpsData, error } = await queryBuilder
                            .order('stars', { ascending: false })
                            .limit(limit);

                        if (error) {
                            throw error;
                        }

                        // Explicitly type and format MCPs
                        let mcps = mcpsData as unknown as MCP[];

                        // Filter by tags if specified
                        if (tags && tags.length > 0) {
                            mcps = mcps.filter(mcp => {
                                if (!mcp.tags || !Array.isArray(mcp.tags)) return false;

                                // Check if MCP has all specified tags
                                return tags.every(searchTag => {
                                    // Handle prefixed tags (provider:, deployment:)
                                    if (searchTag.includes(':')) {
                                        return mcp.tags!.includes(searchTag);
                                    }
                                    // Handle raw tag names or partial matches
                                    else {
                                        return mcp.tags!.some(mcpTag =>
                                            mcpTag.includes(searchTag) ||
                                            mcpTag.replace(/^(provider:|deployment:|domain:)/, '') === searchTag
                                        );
                                    }
                                });
                            });
                        }

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
                        // Include tag information in the description
                        const resultText = `Found ${formattedMcps.length} MCPs matching "${query}"${tags && tags.length > 0 ? ` with tags: ${tags.join(', ')}` : ''}:\n\n` +
                            formattedMcps.map(mcp => {
                                // Extract provider and deployment tags for display
                                const providerTags = mcp.tags.filter(t => t.startsWith('provider:')).map(t => t.replace('provider:', ''));
                                const deploymentTags = mcp.tags.filter(t => t.startsWith('deployment:')).map(t => t.replace('deployment:', ''));

                                return `- ${mcp.name} by ${mcp.author}\n` +
                                    `  ${mcp.description}\n` +
                                    `  URL: ${mcp.repository_url}\n` +
                                    `  Stars: ${mcp.stars}, Views: ${mcp.view_count}\n` +
                                    (providerTags.length > 0 ? `  Provider: ${providerTags.join(', ')}\n` : '') +
                                    (deploymentTags.length > 0 ? `  Deployment: ${deploymentTags.join(', ')}\n` : '');
                            }).join('\n\n') +
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
                                    tags: tags || [],
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
            } else if (rpc.params?.name === 'CreateUploadLink') {
                try {
                    const uploadParams = CreateUploadLinkParams.safeParse(rpc.params.arguments);
                    if (!uploadParams.success) {
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32602,
                                message: 'Invalid params',
                                data: uploadParams.error.issues
                            }
                        });
                        break;
                    }

                    const { fileName, contentType, ttlHours, base64Content } = uploadParams.data;
                    
                    // Decode base64 content
                    let fileBuffer;
                    try {
                        // Remove any data URL prefix if present
                        const base64Data = base64Content.replace(/^data:[^;]+;base64,/, '');
                        fileBuffer = Buffer.from(base64Data, 'base64');
                    } catch (error) {
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32602,
                                message: 'Invalid base64 content'
                            }
                        });
                        break;
                    }

                    // Upload the file
                    const fileData = await uploadFile(
                        fileBuffer,
                        fileName,
                        contentType,
                        ttlHours
                    );

                    // Calculate TTL in seconds for Redis
                    const ttlSeconds = Math.floor(ttlHours * 60 * 60);
                    
                    // Save metadata in Redis with TTL
                    await saveFileMetadata(fileData, ttlSeconds);
                    
                    // Log upload event
                    await logEvent('upload', fileData.id, ip, {
                        fileName: fileData.fileName,
                        size: fileData.size,
                        ttlHours,
                        via: 'SSE API'
                    });

                    // Generate download URL
                    const host = req.headers.get('host');
                    const protocol = host?.includes('localhost') ? 'http' : 'https';
                    const downloadUrl = `${protocol}://${host}/api/uploads/${fileData.id}`;

                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: `File uploaded successfully!\n\nFile ID: ${fileData.id}\nFile Name: ${fileData.fileName}\nSize: ${fileData.size} bytes\nExpires: ${fileData.expiresAt.toISOString()}\nDownload URL: ${downloadUrl}`
                                }
                            ],
                            fileId: fileData.id,
                            fileName: fileData.fileName,
                            size: fileData.size,
                            downloadUrl,
                            uploadedAt: fileData.uploadedAt.toISOString(),
                            expiresAt: fileData.expiresAt.toISOString()
                        }
                    });
                } catch (error) {
                    console.error('Error in CreateUploadLink:', error);
                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        error: {
                            code: -32603,
                            message: 'Internal error uploading file'
                        }
                    });
                }
            } else if (rpc.params?.name === 'GetDownloadLink') {
                try {
                    const downloadParams = GetDownloadLinkParams.safeParse(rpc.params.arguments);
                    if (!downloadParams.success) {
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32602,
                                message: 'Invalid params',
                                data: downloadParams.error.issues
                            }
                        });
                        break;
                    }

                    const { fileId } = downloadParams.data;
                    
                    // Get file metadata from Redis
                    const fileData = await getFileMetadata(fileId);
                    
                    if (!fileData) {
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32602,
                                message: 'File not found or expired'
                            }
                        });
                        break;
                    }
                    
                    // Check if file has expired
                    const now = new Date();
                    if (fileData.expiresAt < now) {
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32602,
                                message: 'File has expired'
                            }
                        });
                        break;
                    }

                    // Increment download count
                    await incrementDownloadCount(fileId);
                    
                    // Log download event
                    await logEvent('download', fileId, ip, {
                        fileName: fileData.fileName,
                        via: 'SSE API'
                    });
                    
                    // Generate a signed URL
                    const signedUrl = await getSignedDownloadUrl(fileId, fileData.fileName);
                    
                    // Generate direct download URL
                    const host = req.headers.get('host');
                    const protocol = host?.includes('localhost') ? 'http' : 'https';
                    const directUrl = `${protocol}://${host}/api/uploads/${fileId}`;

                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: `File found!\n\nFile ID: ${fileData.id}\nFile Name: ${fileData.fileName}\nSize: ${fileData.size} bytes\nUploaded: ${fileData.uploadedAt.toISOString()}\nExpires: ${fileData.expiresAt.toISOString()}\nDownload URL: ${signedUrl}\n\nDirect URL: ${directUrl}`
                                }
                            ],
                            fileId: fileData.id,
                            fileName: fileData.fileName,
                            size: fileData.size,
                            contentType: fileData.contentType,
                            downloadUrl: signedUrl,
                            directUrl: directUrl,
                            uploadedAt: fileData.uploadedAt.toISOString(),
                            expiresAt: fileData.expiresAt.toISOString(),
                            downloadCount: fileData.downloadCount + 1 // Include the current download
                        }
                    });
                } catch (error) {
                    console.error('Error in GetDownloadLink:', error);
                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        error: {
                            code: -32603,
                            message: 'Internal error getting download link'
                        }
                    });
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
