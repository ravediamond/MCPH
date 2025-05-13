import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import {
    getFileMetadata,
    incrementDownloadCount,
    logEvent,
    TEXT_CONTENT_COLLECTION
} from '@/services/firebaseService';
import { getSignedDownloadUrl } from '@/services/storageService';

interface TextContentMetadata {
    id: string;
    fileName: string;
    contentType: string;
    content?: string;
    chunks?: string[];
    size: number;
    uploadedAt: Date;
    expiresAt?: Date;
    downloadCount: number;
}

/**
 * GET handler for retrieving text content by ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const fileId = params.id;
        const db = getFirestore();

        // First check if it's in the text_content collection
        const textContentDoc = await db.collection(TEXT_CONTENT_COLLECTION).doc(fileId).get();

        if (textContentDoc.exists) {
            const data = textContentDoc.data() as TextContentMetadata;

            // Update download count
            await db.collection(TEXT_CONTENT_COLLECTION).doc(fileId).update({
                downloadCount: (data.downloadCount || 0) + 1
            });

            // Log the download event
            await logEvent('text_download', fileId);

            // Check if file has expired
            if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
                return NextResponse.json({ error: 'Content has expired' }, { status: 404 });
            }

            // Get the content - either directly or by combining chunks
            let content: string;
            if (data.content) {
                // Content is stored directly
                content = data.content;
            } else if (data.chunks && data.chunks.length > 0) {
                // Content was split into chunks, combine them
                content = data.chunks.join('');
            } else {
                return NextResponse.json({ error: 'Content not found' }, { status: 404 });
            }

            // Create response with appropriate content type
            const response = new NextResponse(content);

            // Set appropriate content type
            response.headers.set('Content-Type', data.contentType || 'text/plain');

            // Set content disposition for download with original filename
            response.headers.set(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(data.fileName)}"`
            );

            return response;
        }

        // If not in text_content collection, check if it's a regular file in GCS
        // (for very large text content that was stored using the regular file storage)
        const fileMetadata = await getFileMetadata(fileId);

        if (fileMetadata) {
            // Increment the download count
            await incrementDownloadCount(fileId);

            // Get the signed download URL and redirect to it
            const downloadUrl = await getSignedDownloadUrl(fileId);
            return NextResponse.redirect(downloadUrl);
        }

        // If we reach here, the content wasn't found in either location
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    } catch (error: any) {
        console.error('Error retrieving text content:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve content', message: error.message },
            { status: 500 }
        );
    }
}