import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Set to true dynamic to enable streaming responses
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Helper to get client IP
function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return '127.0.0.1';
}

// Handle GET requests for SSE
export async function GET(req: NextRequest) {
    const connectionId = uuidv4();

    // Create a readable stream for SSE
    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection event
            const event = `event: connection\ndata: ${JSON.stringify({ connectionId })}\n\n`;
            controller.enqueue(new TextEncoder().encode(event));

            // Send a keepalive every 30 seconds
            const keepAliveInterval = setInterval(() => {
                const event = `event: keepalive\ndata: ${Date.now()}\n\n`;
                controller.enqueue(new TextEncoder().encode(event));
            }, 30000);

            // Log connection event (to be implemented with your preferred logging method)
            console.log(`SSE connection established: ${connectionId} from ${getClientIp(req)}`);

            // Cleanup function (not called in streaming responses, but good practice)
            return () => {
                clearInterval(keepAliveInterval);
            };
        }
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
            'X-Connection-Id': connectionId
        }
    });
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
        }
    });
}

// Handle POST requests (used to send events to specific clients)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { eventType, data, targetConnectionId } = body;

        if (!eventType) {
            return new Response(JSON.stringify({ error: 'Event type is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Log the event (to be implemented with your preferred logging method)
        console.log(`SSE event sent: ${eventType} to ${targetConnectionId || 'broadcast'}`, data);

        return new Response(JSON.stringify({
            success: true,
            message: 'Event received successfully'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Error processing SSE event:', error);
        return new Response(JSON.stringify({ error: 'Failed to process event' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
