import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

/**
 * NOTE: Stateless SSE Implementation
 * 
 * This implementation handles stateless SSE requests where the client 
 * establishes short-lived connections rather than maintaining long-lived ones.
 * 
 * For Firebase/GCP, we use an Express app to handle the SSE endpoints
 * because it gives us better control over headers and response handling
 * than trying to directly map Next.js API routes.
 */

// Initialize Firebase Admin SDK
admin.initializeApp();

// Define Zod schema for the dummy tool input
const DummyToolInputSchema = z.object({
    message: z.string().optional().describe("An optional message for the dummy tool."),
});

// Define your Express app
const app = express();

// Enable CORS
const ALLOWED_ORIGINS = ['*']; // Update this with your allowed origins
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowOrigin = ALLOWED_ORIGINS.includes('*')
        ? '*'
        : (origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'null');

    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }

    next();
});

// Parse JSON body for POST requests
app.use(express.json());

// Type definitions
type Session = {
    nextEventId: number
}

// Function to get client IP
const getClientIp = (req: express.Request): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor && typeof forwardedFor === 'string') {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || '127.0.0.1';
};

// Function to log events (using Firebase Admin SDK)
const logEvent = async (
    eventType: string,
    resourceId: string,
    ipAddress?: string,
    details: Record<string, any> = {}
) => {
    try {
        const db = admin.database();
        const timestamp = new Date();
        const eventId = uuidv4();
        const eventData = {
            id: eventId,
            type: eventType,
            resourceId,
            timestamp: timestamp.toISOString(),
            ipAddress,
            details,
        };

        // Create a reference to the event log path
        const eventLogRef = db.ref(`event_logs/${eventType}`).push();
        await eventLogRef.set(eventData);
    } catch (error) {
        console.error('Error logging event:', error);
    }
};

// SSE endpoint handler - GET /api/sse
app.get('/api/sse', (req, res) => {
    const connectionId = uuidv4();
    const clientIp = getClientIp(req);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Connection-Id', connectionId);

    // Log connection event
    logEvent('sse_connect', connectionId, clientIp);

    // Send welcome message
    const welcomeEvent = {
        connectionId,
        message: 'Welcome to File Share Hub SSE API',
        features: ['ping'],
    };

    // Format and send SSE data
    res.write(`event: welcome\ndata: ${JSON.stringify(welcomeEvent)}\n\n`);

    // For stateless SSE, we can end the response after sending the initial data
    res.end();

    // Log disconnect
    logEvent('sse_disconnect', connectionId, clientIp);
});

// JSON-RPC handler - POST /api/sse
app.post('/api/sse', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const body = req.body;

        // Handle action requests (ping, etc)
        if (body && body.action) {
            const { action } = body;

            if (action === 'ping') {
                return res.status(200).json({
                    success: true,
                    pong: { timestamp: Date.now() }
                });
            } else {
                return res.status(400).json({
                    error: `Unknown action: ${action}`
                });
            }
        }

        // Handle JSON-RPC requests
        if (body && body.jsonrpc === '2.0' && body.method) {
            const rpc = body;

            if (rpc.id === undefined) {
                return res.status(200).send();
            }

            console.log('RPC Message:', JSON.stringify({
                method: rpc.method,
                id: rpc.id,
                params: rpc.params
            }, null, 2));

            // Handle RPC methods
            switch (rpc.method) {
                case 'initialize':
                    return res.status(200).json({
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

                case 'tools/list':
                    return res.status(200).json({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        result: {
                            tools: [
                                {
                                    name: 'dummyTool',
                                    description: 'A simple dummy tool that returns a list of strings.',
                                    inputSchema: {
                                        type: 'object',
                                        properties: {
                                            message: {
                                                type: 'string',
                                                description: 'An optional message for the dummy tool.',
                                                optional: true
                                            }
                                        },
                                        required: []
                                    }
                                }
                            ]
                        }
                    });

                case 'tools/call':
                    if (rpc.params?.name === 'dummyTool') {
                        try {
                            // Validate input using Zod schema
                            const validatedParams = DummyToolInputSchema.parse(rpc.params.arguments || {});
                            const message = validatedParams.message || "No message provided";

                            return res.status(200).json({
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
                                return res.status(200).json({
                                    jsonrpc: '2.0',
                                    id: rpc.id,
                                    error: {
                                        code: -32602,
                                        message: 'Invalid parameters for dummyTool',
                                        data: (error as z.ZodError).errors
                                    }
                                });
                            } else {
                                // Handle other errors
                                return res.status(200).json({
                                    jsonrpc: '2.0',
                                    id: rpc.id,
                                    error: {
                                        code: -32000,
                                        message: 'Error executing dummyTool'
                                    }
                                });
                            }
                        }
                    } else {
                        return res.status(200).json({
                            jsonrpc: '2.0',
                            id: rpc.id,
                            error: {
                                code: -32601,
                                message: `Tool not found: ${rpc.params?.name}`
                            }
                        });
                    }

                default:
                    return res.status(200).json({
                        jsonrpc: '2.0',
                        id: rpc.id,
                        error: {
                            code: -32601,
                            message: `Method not found: ${rpc.method}`
                        }
                    });
            }
        }

        return res.status(400).json({ error: 'Invalid request format' });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Server error processing request' });
    }
});

// Health check endpoint
app.get('/api/sse/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Export the Express API as a Cloud Function
export const nextServerSSE = functions
    .runWith({
        timeoutSeconds: 60, // Reduced timeout since we don't need long-lived connections
        memory: '256MB',
    })
    .https.onRequest(app);