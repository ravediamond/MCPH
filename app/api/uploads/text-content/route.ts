import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { uploadFile } from '@/services/storageService';
import {
    saveFileMetadata,
    // getFileMetadata, // No longer directly used here for text content logic
    logEvent,
    incrementMetric,
    TEXT_CONTENT_COLLECTION,
    FileMetadata as FirebaseFileMetadata // Renaming to avoid conflict
} from '@/services/firebaseService';
import { DATA_TTL } from '@/app/config/constants'; // Added import

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
    uploadedAt: Date; // Storing as Date object
    expiresAt?: Date; // Storing as Date object
    downloadCount: number;
    userId?: string; // Add userId to interface
}

/**
 * API route to handle storing text content (markdown, JSON, text) directly to Firestore or GCS
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('Content-Type') || 'text/plain';
        // Read ttlDays from header, default to DATA_TTL.DEFAULT_DAYS
        const ttlDaysParam = req.headers.get('x-ttl-days');
        const ttlDays = ttlDaysParam ? parseInt(ttlDaysParam, 10) : DATA_TTL.DEFAULT_DAYS;

        const userId = req.headers.get('x-user-id'); // Get user ID from header if provided

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

        // Using 'let' instead of 'const' for fileId since it might be reassigned
        let fileId = uuidv4();
        const size = new TextEncoder().encode(content).length;
        const uploadedAt = new Date(); // Use Date object

        // Calculate expiration time using DATA_TTL
        const expiresAt = new Date(DATA_TTL.getExpirationTimestamp(uploadedAt.getTime(), ttlDays));

        let metadata: TextContentMetadata;
        let downloadUrl: string;
        let apiUrl: string;

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
                ...(userId && { userId }) // Add userId if available
            };

            // Save to Firestore collection for text content
            const db = getFirestore();
            await db.collection(TEXT_CONTENT_COLLECTION).doc(fileId).set(metadata);

            // Generate API URL (for direct content access)
            apiUrl = new URL(`/api/uploads/text-content/${fileId}`, req.url).toString();

            // Generate download page URL (for user-friendly page)
            downloadUrl = new URL(`/download/${fileId}`, req.url).toString();
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
                    ...(userId && { userId }) // Add userId if available
                };

                // Save metadata with chunks
                const db = getFirestore();
                await db.collection(TEXT_CONTENT_COLLECTION).doc(fileId).set(metadata);

                // Generate API URL for direct access
                apiUrl = new URL(`/api/uploads/text-content/${fileId}`, req.url).toString();

                // Generate download page URL for user-friendly page
                downloadUrl = new URL(`/download/${fileId}`, req.url).toString();
            }
            // If content is very large, use the standard file upload mechanism
            else {
                const buffer = Buffer.from(content);

                // Pass ttlDays to uploadFile
                const fileData = await uploadFile(buffer, fileName, contentType, ttlDays);

                // fileData from uploadFile is of type StorageFileMetadata, which uses number for timestamps
                // We need to ensure the response uses ISOString for expiresAt
                fileId = fileData.id;

                // Generate API URL for direct access
                apiUrl = new URL(`/api/uploads/${fileId}`, req.url).toString();

                // Generate download page URL for user-friendly page
                downloadUrl = new URL(`/download/${fileId}`, req.url).toString();

                // Log the upload event (using fileData.id as it's the definitive one)
                await logEvent('gcs_text_upload', fileData.id, undefined, userId ? { userId } : undefined);
                await incrementMetric('gcs_text_uploads');

                return NextResponse.json({
                    success: true,
                    fileId: fileData.id,
                    fileName: fileData.fileName,
                    contentType: fileData.contentType,
                    size: fileData.size,
                    apiUrl,
                    downloadUrl,
                    expiresAt: fileData.expiresAt ? new Date(fileData.expiresAt).toISOString() : undefined,
                });
            }
        }

        // Log the upload event (for Firestore direct/chunked storage)
        await logEvent('text_upload', fileId, undefined, userId ? { userId } : undefined);
        await incrementMetric('text_uploads');

        return NextResponse.json({
            success: true,
            fileId,
            fileName,
            contentType,
            size,
            apiUrl,          // Direct API URL for programmatic access
            downloadUrl,     // User-friendly download page URL
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