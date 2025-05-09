import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod'; // Add Zod import

import { logEvent } from '@/services/firebaseService'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory sessions map
type Session = {
    controller: ReadableStreamDefaultController<Uint8Array>
    nextEventId: number
}
const sessions = new Map<string, Session>()

// Define Zod schema for the dummy tool input
const DummyToolInputSchema = z.object({
    message: z.string().optional().describe("An optional message for the dummy tool."),
});

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

// Map to store active connections
const connections = new Map<string, ReadableStreamController<Uint8Array>>();

// Function to send event to a specific client
const sendEvent = (connectionId: string, event: string, data: any) => {
    const controller = connections.get(connectionId);
    if (controller) {
        // Format the SSE data
        const formattedData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(formattedData));
    }
};

// Function to send a ping to keep the connection alive
const sendPing = (connectionId: string) => {
    sendEvent(connectionId, 'ping', { timestamp: Date.now() });
};

// Function to extract client IP
const getClientIp = (req: NextRequest): string => {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return '127.0.0.1';
};

/**
 * Handles incoming SSE connection requests.
 */
export async function GET(req: NextRequest) {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    const connectionId = uuidv4();
    const clientIp = getClientIp(req);

    // Log connection event
    await logEvent('sse_connect', connectionId, clientIp);

    // Create a stream for SSE
    const stream = new ReadableStream({
        start(controller) {
            // Store the controller for this connection
            connections.set(connectionId, controller);

            // Send welcome message
            const welcomeEvent = {
                connectionId,
                message: 'Welcome to File Share Hub SSE API',
                features: ['ping'], // Removed 'file_upload', 'file_info'
            };

            // Send the welcome event
            const welcomeData = `event: welcome\ndata: ${JSON.stringify(welcomeEvent)}\n\n`;
            controller.enqueue(new TextEncoder().encode(welcomeData));

            // Set up ping interval to keep connection alive
            const pingInterval = setInterval(() => {
                // Check if connection still exists
                if (connections.has(connectionId)) {
                    sendPing(connectionId);
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000); // Send ping every 30 seconds
        },
        cancel() {
            // Remove connection when it's closed
            connections.delete(connectionId);
            logEvent('sse_disconnect', connectionId, clientIp);
        }
    });

    // Accept POST requests with the same connection ID for file uploads
    const url = new URL(req.url);
    url.searchParams.set('connectionId', connectionId);

    // Return SSE response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Connection-Id': connectionId,
        },
    });
}

/**
 * Handles JSON-RPC messages sent via POST.
 */
export async function POST(req: NextRequest) {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    // Get connection ID from the request
    const url = new URL(req.url);
    const connectionId = url.searchParams.get('connectionId');

    if (!connectionId || !connections.has(connectionId)) {
        return new Response(JSON.stringify({ error: 'Invalid or expired connection' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const clientIp = getClientIp(req);

    try {
        // Parse the request body
        const body = await req.json();
        const { action } = body;

        if (action === 'ping') {
            // Handle ping request (useful for checking if connection is alive)
            sendEvent(connectionId, 'pong', { timestamp: Date.now() });

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else if (action) { // If action is present but not 'ping'
            // Unknown action
            sendEvent(connectionId, 'error', { message: `Unknown action: ${action}` });

            return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // If no 'action' field, proceed to JSON-RPC handling
    } catch (error: any) { // Added type for error
        // Check if the error is due to req.json() failing when body is not JSON (e.g. for JSON-RPC)
        // Or if it's another error within the try block for actions
        if (error.message.includes('Unexpected token') || error.message.includes('invalid json')) {
            // This likely means the request is intended for JSON-RPC, not an action with a JSON body.
            // We can let it fall through to the JSON-RPC logic.
        } else {
            console.error('Error processing POST action:', error);
            sendEvent(connectionId, 'error', { message: 'Server error processing request' });
            return new Response(JSON.stringify({ error: 'Server error processing request' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // JSON-RPC handling starts here
    const currentOrigin = req.headers.get('origin');
    const corsRpcHeaders = getCorsHeaders(currentOrigin); // Renamed to avoid conflict with corsHeaders

    const sessionId = url.searchParams.get('sessionId');
    if (sessionId === null || !sessions.has(sessionId)) {
        return new Response('Session not found', { status: 404, headers: corsRpcHeaders });
    }

    const session = sessions.get(sessionId); // Get session
    if (!session) { // Check if session is undefined (should be caught by .has() but good for type safety)
        return new Response('Session not found after check', { status: 404, headers: corsRpcHeaders });
    }

    const encoder = new TextEncoder();

    const send = (payload: any) => {
        // session is guaranteed to be defined here due to the checks above
        const frame = [
            `id: ${session.nextEventId}`,
            `event: message`,
            `data: ${JSON.stringify(payload)}`,
            ``
        ].join('\n');
        session.controller.enqueue(encoder.encode(frame));
        session.nextEventId++;
    };

    let rpc: { jsonrpc: string; id?: number; method: string; params?: any };
    try {
        // Re-parse req.json() here for the JSON-RPC payload
        // The original req.json() might have been consumed or failed if it was an action request
        // To handle this, we need to clone the request if we want to read the body multiple times,
        // or ensure the body is read only once.
        // For simplicity, assuming the first try/catch for actions either returns or falls through
        // with an unconsumed/parsable body for JSON-RPC.
        // A more robust way would be to read body once and pass it.
        // However, if an action was processed, this part is not reached.
        // If action parsing failed because it's a JSON-RPC, then req.json() here should work.
        rpc = await req.json();
    } catch {
        return new Response('Invalid JSON for RPC', { status: 400, headers: corsRpcHeaders });
    }

    if (rpc.id === undefined) {
        return new Response(null, {
            status: 200,
            headers: { ...corsRpcHeaders, 'mcp-session-id': sessionId ?? '' }
        });
    }

    console.log('RPC Message:', JSON.stringify({
        method: rpc.method,
        id: rpc.id,
        params: rpc.params
    }, null, 2));

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
            });
            break;

        case 'tools/list':
            send({
                jsonrpc: '2.0',
                id: rpc.id,
                result: {
                    tools: [
                        {
                            name: 'dummyTool',
                            description: 'A simple dummy tool that returns a list of strings.',
                            inputSchema: { // Reflect the Zod schema structure
                                type: 'object',
                                properties: {
                                    message: {
                                        type: 'string',
                                        description: 'An optional message for the dummy tool.',
                                        optional: true // Indicate that it's optional
                                    }
                                },
                                required: [] // No required properties as message is optional
                            }
                        }
                        // Removed 'search', 'CreateUploadLink', and 'GetDownloadLink' tools
                    ]
                }
            });
            break;

        case 'tools/call':
            if (rpc.params?.name === 'dummyTool') {
                try {
                    // Validate input using Zod schema
                    const validatedParams = DummyToolInputSchema.parse(rpc.params.arguments || {});
                    const message = validatedParams.message || "No message provided";

                    send({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: `Dummy tool executed successfully. Message: "${message}". Here is a dummy list: ['item1', 'item2', 'item3']`
                                }
                            ],
                            dummyData: ["item1", "item2", "item3"]
                        }
                    });
                } catch (error) {
                    // Handle validation errors
                    if (error instanceof z.ZodError) {
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32602, // Invalid params
                                message: 'Invalid parameters for dummyTool',
                                data: error.errors
                            }
                        });
                    } else {
                        // Handle other errors
                        send({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32000, // Server error
                                message: 'Error executing dummyTool'
                            }
                        });
                    }
                }
            }
            // Removed 'search' tool logic (including Supabase calls)
            // Removed 'CreateUploadLink' tool logic
            // Removed 'GetDownloadLink' tool logic
            else {
                send({
                    jsonrpc: '2.0',
                    id: rpc.id,
                    error: {
                        code: -32601,
                        message: `Tool not found: ${rpc.params?.name}`
                    }
                });
            }
            break;

        default:
            send({
                jsonrpc: '2.0',
                id: rpc.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${rpc.method}`
                }
            });
    }

    return new Response(null, {
        status: 200,
        headers: { ...corsRpcHeaders, 'mcp-session-id': sessionId ?? '' } // Ensure sessionId is a string
    });
}

export const config = {
    runtime: 'nodejs', // This was 'nodejs', if it's an edge route, should be 'edge'
    // The top of the file says 'export const runtime = 'edge''. Conflicting.
    // Assuming the top one is correct for the whole file.
};
