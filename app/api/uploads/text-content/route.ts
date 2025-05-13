import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { uploadFile } from '@/services/storageService';
import {
    saveFileMetadata,
    getFileMetadata,
    logEvent,
    incrementMetric,
    TEXT_CONTENT_COLLECTION
} from '@/services/firebaseService';

// Maximum size for storing content directly in Firestore (1MB)
const MAX_FIRESTORE_CONTENT_SIZE = 1024 * 1024; // 1MB

// Maximum chunk size when splitting content
const MAX_CHUNK_SIZE = 800 * 1024; // 800KB to stay safely under Firestore's 1MB document limit

interface TextContentMetadata {
    id: string;
    fileName: string;
    contentType: string;
    content?: string; // For small content stored directly
    chunks?: string[]; // For large content that needs to be split
    size: number;
    uploadedAt: Date;
    expiresAt?: Date;
    downloadCount: number;
}

/**
 * API route to handle storing text content (markdown, JSON, text) directly to Firestore
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('Content-Type') || 'text/plain';
        const ttlHours = parseInt(req.headers.get('x-ttl-hours') || '24', 10);

        // Parse the request to get content and filename
        let fileName = '';
        let content = '';

        if (contentType.includes('application/json')) {
            const jsonData = await req.json();
            content = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
            fileName = jsonData.fileName || `document-${new Date().toISOString().slice(0, 10)}.json`;
        } else {
            content = await req.text();

            // Try to extract filename from headers or generate one based on content type
            fileName = req.headers.get('x-filename') || '';
            if (!fileName) {
                if (contentType.includes('markdown')) {
                    fileName = `document-${new Date().toISOString().slice(0, 10)}.md`;
                } else if (contentType.includes('json')) {
                    fileName = `document-${new Date().toISOString().slice(0, 10)}.json`;
                } else {
                    fileName = `document-${new Date().toISOString().slice(0, 10)}.txt`;
                }
            }
        }

        const fileId = uuidv4();
        const size = new TextEncoder().encode(content).length;
        const uploadedAt = new Date();

        // Calculate expiration time
        let expiresAt: Date | undefined;
        if (ttlHours > 0) {
            expiresAt = new Date(uploadedAt);
            expiresAt.setHours(expiresAt.getHours() + ttlHours);
        }

        let metadata: TextContentMetadata;
        let downloadUrl: string;

        // If content is small enough, store directly in Firestore
        if (size <= MAX_FIRESTORE_CONTENT_SIZE) {
            metadata = {
                id: fileId,
                fileName,
                contentType,
                content,
                size,
                uploadedAt,
                expiresAt,
                downloadCount: 0,
            };

            // Save to Firestore collection for text content
            const db = getFirestore();
            await db.collection(TEXT_CONTENT_COLLECTION).doc(fileId).set(metadata);

            // Generate download URL (via our API)
            downloadUrl = new URL(`/api/uploads/text-content/${fileId}`, req.url).toString();
        }
        // For larger content, split into chunks or store in GCS
        else {
            if (size <= MAX_CHUNK_SIZE * 10) { // If it can be reasonably split (up to ~8MB)
                // Split content into chunks and store in Firestore
                const chunks = splitContent(content, MAX_CHUNK_SIZE);

                metadata = {
                    id: fileId,
                    fileName,
                    contentType,
                    chunks,
                    size,
                    uploadedAt,
                    expiresAt,
                    downloadCount: 0,
                };

                // Save metadata with chunks
                const db = getFirestore();
                await db.collection(TEXT_CONTENT_COLLECTION).doc(fileId).set(metadata);

                // Generate download URL
                downloadUrl = new URL(`/api/uploads/text-content/${fileId}`, req.url).toString();
            }
            // If content is very large, use the standard file upload mechanism
            else {
                const buffer = Buffer.from(content);
                const fileData = await uploadFile(buffer, fileName, contentType, ttlHours);

                // Get the download URL using the existing mechanism
                downloadUrl = new URL(`/api/uploads/${fileId}`, req.url).toString();
            }
        }

        // Log the upload event
        await logEvent('text_upload', fileId);
        await incrementMetric('text_uploads');

        return NextResponse.json({
            success: true,
            fileId,
            fileName,
            contentType,
            size,
            downloadUrl,
            expiresAt: expiresAt?.toISOString(),
        });

    } catch (error: any) {
        console.error('Error saving text content:', error);
        return NextResponse.json(
            { error: 'Failed to save content', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * Split content into chunks that fit within Firestore document size limits
 */
function splitContent(content: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let remaining = content;

    while (remaining.length > 0) {
        // Find a good break point that's under the max size
        const chunkSize = Math.min(remaining.length, maxChunkSize);

        // Try to split at paragraph or line breaks if possible
        let breakPoint = chunkSize;
        if (chunkSize < remaining.length) {
            const possibleBreaks = ['\n\n', '\n', '. ', ', ', ' '];

            for (const breakChar of possibleBreaks) {
                // Look for the last occurrence of the break character before the max size
                const lastBreak = remaining.lastIndexOf(breakChar, chunkSize);
                if (lastBreak > 0) {
                    breakPoint = lastBreak + breakChar.length;
                    break;
                }
            }
        }

        // Add the chunk and remove it from the remaining content
        chunks.push(remaining.substring(0, breakPoint));
        remaining = remaining.substring(breakPoint);
    }

    return chunks;
}