import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import multer from 'multer';  // Changed from namespace import to default import
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * NOTE: Firebase Functions Implementation
 * 
 * This implementation handles both SSE and file operations:
 * 1. SSE for real-time events
 * 2. File uploads/downloads
 * 3. Cron jobs for cleanup
 */

// Initialize Firebase Admin SDK
admin.initializeApp();

// Define Zod schemas
const DummyToolInputSchema = z.object({
    message: z.string().optional().describe("An optional message for the dummy tool."),
});

// Define your Express app
const app = express();

// Enable CORS
const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://mcphub.vercel.app', '*']; // Update with all allowed origins
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowOrigin = ALLOWED_ORIGINS.includes('*') ||
        (origin && ALLOWED_ORIGINS.includes(origin))
        ? origin : 'null';

    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }

    return next();
});

// Parse JSON body for POST requests
app.use(express.json());

// Type definitions
type FileMetadata = {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    expiresAt: string;
    downloadCount: number;
    downloadLimit?: number;
    ipAddress?: string;
};

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

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Connection-Id', connectionId);

    // Log connection event
    logEvent('sse_connect', connectionId, getClientIp(req));

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
    logEvent('sse_disconnect', connectionId, getClientIp(req));

    // Return to satisfy TypeScript
    return;
});

// JSON-RPC handler - POST /api/sse
app.post('/api/sse', async (req, res) => {
    try {
        // Remove the unused clientIp variable declaration
        const body = req.body;

        // Log RPC request with client IP for monitoring/debugging purposes
        if (body && body.jsonrpc === '2.0') {
            console.log(`RPC request from ${getClientIp(req)}`);
        }

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

// Create a new Express app for file operations
const fileApp = express();

// Enable CORS for file operations
fileApp.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowOrigin = ALLOWED_ORIGINS.includes('*') ||
        (origin && ALLOWED_ORIGINS.includes(origin))
        ? origin : 'null';

    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }

    return next();
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// File upload endpoint
fileApp.post('/api/uploads', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const file = req.file;
        const fileId = uuidv4();
        const bucket = admin.storage().bucket();

        // Create a temp file path
        const tempFilePath = path.join(os.tmpdir(), file.originalname);
        fs.writeFileSync(tempFilePath, file.buffer);

        // Upload to Firebase Storage
        await bucket.upload(tempFilePath, {
            destination: `uploads/${fileId}`,
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    originalName: file.originalname,
                    fileId
                }
            }
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        // Calculate expiration (default: 7 days)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Store metadata in Firestore
        const fileMetadata: FileMetadata = {
            id: fileId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            downloadCount: 0,
            downloadLimit: req.body.downloadLimit ? parseInt(req.body.downloadLimit) : undefined,
            ipAddress: getClientIp(req)
        };

        await admin.firestore().collection('files').doc(fileId).set(fileMetadata);

        // Log the upload event
        await logEvent('file_upload', fileId, getClientIp(req), {
            filename: file.originalname,
            size: file.size
        });

        res.status(201).json({
            fileId,
            url: `/api/uploads/${fileId}`,
            expiresAt: expiresAt.toISOString()
        });
        return;

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
        return;
    }
});

// File download endpoint
fileApp.get('/api/uploads/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const clientIp = getClientIp(req);

        // Get file metadata from Firestore
        const fileDoc = await admin.firestore().collection('files').doc(fileId).get();

        if (!fileDoc.exists) {
            return res.status(404).json({ error: 'File not found' });
        }

        const fileData = fileDoc.data() as FileMetadata;

        // Check if file has expired
        if (new Date(fileData.expiresAt) < new Date()) {
            return res.status(410).json({ error: 'File has expired and is no longer available' });
        }

        // Check download limit if set
        if (fileData.downloadLimit && fileData.downloadCount >= fileData.downloadLimit) {
            return res.status(403).json({ error: 'Download limit reached for this file' });
        }

        // Get file from Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`uploads/${fileId}`);
        const [exists] = await file.exists();

        if (!exists) {
            return res.status(404).json({ error: 'File storage error' });
        }

        // Update download count
        await admin.firestore().collection('files').doc(fileId).update({
            downloadCount: admin.firestore.FieldValue.increment(1)
        });

        // Log download event
        await logEvent('file_download', fileId, clientIp, {
            filename: fileData.originalName
        });

        // Set headers for download
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalName)}"`);

        // Stream file to response
        const fileStream = file.createReadStream();
        fileStream.pipe(res);
        return;

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
        return;
    }
});

// File deletion endpoint
fileApp.delete('/api/uploads/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const clientIp = getClientIp(req);

        // Get file metadata from Firestore
        const fileDoc = await admin.firestore().collection('files').doc(fileId).get();

        if (!fileDoc.exists) {
            return res.status(404).json({ error: 'File not found' });
        }

        const fileData = fileDoc.data() as FileMetadata;

        // Delete from Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`uploads/${fileId}`);
        await file.delete();

        // Delete metadata from Firestore
        await admin.firestore().collection('files').doc(fileId).delete();

        // Log deletion event
        await logEvent('file_delete', fileId, clientIp, {
            filename: fileData.originalName
        });

        res.status(200).json({ message: 'File deleted successfully' });
        return;

    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
        return;
    }
});

// Export the file operations Express app as a Cloud Function
export const fileOperations = functions
    .runWith({
        timeoutSeconds: 300,
        memory: '512MB',
    })
    .https.onRequest(fileApp);

// Scheduled function to purge expired files (runs daily)
export const purgeExpiredFiles = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async context => {
        try {
            const now = new Date();

            // Query for expired files
            const expiredFilesQuery = await admin.firestore()
                .collection('files')
                .where('expiresAt', '<', now.toISOString())
                .get();

            if (expiredFilesQuery.empty) {
                console.log('No expired files to purge');
                return null;
            }

            const bucket = admin.storage().bucket();
            const batch = admin.firestore().batch();
            const deletedCount = expiredFilesQuery.size;

            // Delete each expired file
            for (const doc of expiredFilesQuery.docs) {
                const fileData = doc.data() as FileMetadata;
                const fileId = fileData.id;

                // Delete from Storage
                try {
                    const file = bucket.file(`uploads/${fileId}`);
                    await file.delete();
                } catch (err) {
                    console.error(`Error deleting file ${fileId} from storage:`, err);
                }

                // Add to batch delete for Firestore
                batch.delete(doc.ref);

                // Log purge event
                await logEvent('file_purge', fileId, undefined, {
                    reason: 'expired',
                    filename: fileData.originalName
                });
            }

            // Commit the batch delete
            await batch.commit();

            console.log(`Successfully purged ${deletedCount} expired files`);
            return null;

        } catch (error) {
            console.error('Error purging expired files:', error);
            return null;
        }
    });