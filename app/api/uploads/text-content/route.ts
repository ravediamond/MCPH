import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/services/storageService';
import {
    logEvent,
    incrementMetric,
    saveFileMetadata
} from '@/services/firebaseService';
import { DATA_TTL } from '@/app/config/constants';

/**
 * API route to handle storing text content (markdown, JSON, text) to GCP Storage
 * This is an updated implementation that always uses GCP buckets for storage
 * and Firestore only for metadata management
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('Content-Type') || 'text/plain';
        const ttlDaysParam = req.headers.get('x-ttl-days');
        const ttlDays = ttlDaysParam ? parseInt(ttlDaysParam, 10) : DATA_TTL.DEFAULT_DAYS;
        const userId = req.headers.get('x-user-id');
        const title = req.headers.get('x-title');
        const description = req.headers.get('x-description');
        const fileTypeParam = req.headers.get('x-file-type');
        const fileType = fileTypeParam || undefined; // Convert null to undefined

        // Validate that title is provided
        if (!title || !title.trim()) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

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

        // Convert content to Buffer for storage in GCP
        const buffer = Buffer.from(content);

        // Enforce 50MB file size limit
        if (buffer.length > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'File is too large. Maximum size is 50MB.' }, { status: 400 });
        }

        // Store the text content in GCP Storage bucket
        const fileData = await uploadFile(buffer, fileName, contentType, ttlDays, title, description ?? undefined, fileType);

        // Add userId to the fileData if available
        if (userId) {
            fileData.userId = userId;
        }

        // Store the updated metadata in Firestore
        await saveFileMetadata({
            ...fileData,
            uploadedAt: new Date(fileData.uploadedAt),
            expiresAt: fileData.expiresAt ? new Date(fileData.expiresAt) : undefined,
        } as any);

        // Generate URLs
        const apiUrl = new URL(`/api/files/${fileData.id}`, req.url).toString();
        const downloadUrl = new URL(`/download/${fileData.id}`, req.url).toString();

        // Log the upload event
        await logEvent('text_upload', fileData.id, undefined, userId ? { userId } : undefined);
        await incrementMetric('text_uploads');

        return NextResponse.json({
            success: true,
            fileId: fileData.id,
            fileName: fileData.fileName,
            title: fileData.title,
            description: fileData.description,
            contentType: fileData.contentType,
            fileType: fileData.fileType, // Include fileType in the response
            size: fileData.size,
            apiUrl,
            downloadUrl,
            uploadedAt: new Date(fileData.uploadedAt).toISOString(),
            expiresAt: fileData.expiresAt ? new Date(fileData.expiresAt).toISOString() : undefined,
            // Include compression information if available
            compressed: fileData.compressed,
            compressionRatio: fileData.compressionRatio
        });

    } catch (error: any) {
        console.error('Error saving text content:', error);
        return NextResponse.json(
            { error: 'Failed to save content', message: error.message },
            { status: 500 }
        );
    }
}