// app/api/sse/route.ts

import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Session = {
    controller: ReadableStreamDefaultController<Uint8Array>;
    nextId: number;
};

const sessions = new Map<string, Session>();

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const basePath = url.pathname;               // "/api/sse"
    const sessionId = crypto.randomUUID();
    const endpoint = `${basePath}?sessionId=${sessionId}`;

    const headers = new Headers({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            // 1) register session
            sessions.set(sessionId, { controller, nextId: 1 });

            // 2) handshake event
            controller.enqueue(encoder.encode(
                `event: endpoint\ndata: ${endpoint}\n\n`
            ));

            // 3) keep-alive every 15s
            const iv = setInterval(() => {
                controller.enqueue(encoder.encode(`:\n\n`));
            }, 15_000);

            // 4) cleanup on client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(iv);
                controller.close();
                sessions.delete(sessionId);
            });
        },
        cancel() {
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

    let rpcReq: { jsonrpc: string; id?: number; method: string; params?: any };
    try {
        rpcReq = await req.json();
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    const { id, method, params } = rpcReq;
    let rpcRes: any;

    switch (method) {
        case 'initialize':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: {
                    // must match the SSE transport spec version
                    protocolVersion: '2024-11-05',
                    serverInfo: { name: 'MCP SSE Server', version: '1.0.0' },
                    capabilities: {
                        tools: { listChanged: true },
                        resources: { listChanged: true, subscribe: true },
                        prompts: { listChanged: true },
                        logging: true,
                        roots: { listChanged: true },
                        sampling: true,
                    },
                },
            };
            break;

        case 'listOfferings':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: {
                    serverInfo: { name: 'MCP SSE Server', version: '1.0.0' },
                    capabilities: {
                        tools: { listChanged: true },
                        resources: { listChanged: true, subscribe: true },
                        prompts: { listChanged: true },
                        logging: true,
                        roots: { listChanged: true },
                        sampling: true,
                    },
                    offerings: [
                        { name: 'echo', description: 'Echo tool' },
                        // add other offerings here
                    ],
                },
            };
            break;

        case 'tools/list':
        case 'listTools':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: {
                    serverInfo: { name: 'MCP SSE Server', version: '1.0.0' },
                    tools: [
                        {
                            name: 'echo',
                            description: 'Echo tool',
                            inputSchema: {
                                type: 'object',
                                properties: { message: { type: 'string' } },
                                required: ['message'],
                            },
                        },
                    ],
                },
            };
            break;

        case 'resources/list':
        case 'listResources':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: {
                    serverInfo: { name: 'MCP SSE Server', version: '1.0.0' },
                    resources: [
                        {
                            uri: 'dummy://resource',
                            name: 'Dummy Resource',
                            description: 'Just a placeholder',
                        },
                    ],
                },
            };
            break;

        case 'resources/subscribe':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: { subscribed: true },
            };
            break;

        case 'resources/read':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: {
                    contents: [
                        { type: 'text', text: 'Dummy contents for resource' },
                    ],
                },
            };
            break;

        case 'prompts/list':
        case 'listPrompts':
            rpcRes = {
                jsonrpc: '2.0',
                id,
                result: {
                    prompts: [
                        {
                            name: 'echoPrompt',
                            description: 'Prompt that echoes',
                            arguments: [
                                { name: 'message', required: true },
                            ],
                        },
                    ],
                },
            };
            break;

        case 'ping':
            rpcRes = { jsonrpc: '2.0', id, result: 'pong' };
            break;

        default:
            rpcRes = {
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: `Method not found: ${method}` },
            };
    }

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
