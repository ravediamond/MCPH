import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { bucket, uploadsFolder } from '@/lib/gcpStorageClient';
import { saveFileMetadata } from '@/services/firebaseService';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Generate a unique ID for the file
        const fileId = uuidv4();
        const gcsPath = `${uploadsFolder}${fileId}/${encodeURIComponent(file.name)}`;

        // Convert the file to a buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload directly to GCS
        const gcsFile = bucket.file(gcsPath);
        await gcsFile.save(buffer, {
            contentType: file.type || 'application/octet-stream',
            resumable: false,
            metadata: {
                metadata: {
                    fileId,
                    originalName: file.name,
                    uploadedAt: Date.now().toString(),
                },
            }
        });

        // Generate a signed URL for download (for internal use/direct access)
        const [signedUrl] = await gcsFile.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        // Generate download page URL for user-facing link
        const downloadUrl = new URL(`/download/${fileId}`, req.url).toString();

        // Prepare file metadata
        const uploadedAt = Date.now();
        const fileData = {
            id: fileId,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            size: buffer.length,
            gcsPath,
            uploadedAt,
            downloadCount: 0,
        };

        // Store metadata in Firestore
        await saveFileMetadata({
            ...fileData,
            uploadedAt: new Date(uploadedAt)
        } as any, 0);

        return NextResponse.json({
            success: true,
            fileId,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            directUrl: signedUrl, // Renamed to clarify this is the direct file URL
            downloadUrl: downloadUrl, // New user-friendly download page URL
            uploadedAt: new Date(uploadedAt).toISOString()
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Failed to upload file',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};