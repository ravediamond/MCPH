import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Session = {
    controller: ReadableStreamDefaultController<Uint8Array>;
    nextId: number;
};

// In-module in-memory session map
const sessions = new Map<string, Session>();

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const basePath = url.pathname; // "/api/sse"
    const sessionId = crypto.randomUUID();
    const endpointUrl = `${basePath}?sessionId=${sessionId}`;

    const headers = new Headers({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            // 1) Register session
            sessions.set(sessionId, { controller, nextId: 1 });

            // 2) Handshake
            controller.enqueue(
                encoder.encode(`event: endpoint\ndata: ${endpointUrl}\n\n`)
            );

            // 3) (Optional) initial MCP init event
            controller.enqueue(
                encoder.encode(
                    `event: message\ndata: ${JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'mcp/init',
                        params: { sessionId },
                    })}\n\n`
                )
            );

            // 4) Heartbeat every 15s
            const iv = setInterval(() => {
                controller.enqueue(encoder.encode(`:\n\n`));
            }, 15_000);

            // 5) Cleanup on disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(iv);
                controller.close();
                sessions.delete(sessionId);
            });
        },
        cancel() {
            // if stream is closed server-side
            sessions.delete(sessionId);
        },
    });

    return new Response(stream, { headers });
}

export async function POST(req: NextRequest) {
    const url = req.nextUrl;
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId || !sessions.has(sessionId)) {
        return new Response('Session not found', { status: 404 });
    }

    let rpcReq: {
        jsonrpc: string;
        id: number | string;
        method: string;
        params?: any;
    };
    try {
        rpcReq = await req.json();
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    // --- dispatch JSON-RPC ---
    let rpcRes: any;
    switch (rpcReq.method) {
        case 'initialize':
            rpcRes = {
                jsonrpc: '2.0',
                id: rpcReq.id,
                result: {
                    protocolVersion: '1.0.0',
                    supportedTransports: ['sse'],
                },
            };
            break;
        case 'listTools':
            rpcRes = {
                jsonrpc: '2.0',
                id: rpcReq.id,
                result: {
                    tools: [
                        {
                            name: 'echo',
                            inputSchema: {
                                type: 'object',
                                properties: { message: { type: 'string' } },
                            },
                        },
                    ],
                },
            };
            break;
        default:
            rpcRes = {
                jsonrpc: '2.0',
                id: rpcReq.id,
                error: { code: -32601, message: `Method not found: ${rpcReq.method}` },
            };
    }

    // 6) Send back over SSE as a "message" event
    const session = sessions.get(sessionId)!;
    const payload = [
        `id: ${session.nextId++}`,
        `event: message`,
        `data: ${JSON.stringify(rpcRes)}`,
        ``,
    ].join('\n');

    session.controller.enqueue(new TextEncoder().encode(payload));

    return new Response(null, { status: 200 });
}
