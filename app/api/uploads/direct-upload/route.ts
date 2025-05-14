import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { bucket, uploadsFolder } from '@/lib/gcpStorageClient';
import { saveFileMetadata } from '@/services/firebaseService';
import { DATA_TTL } from '@/app/config/constants'; // Added import for DATA_TTL

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        // Get user ID from form data (if provided)
        const userId = formData.get('userId') as string | null;
        const ttlDaysParam = formData.get('ttlDays') as string | null; // Get ttlDays from formData
        const title = formData.get('title') as string; // Get title (required)
        const description = formData.get('description') as string | null; // Get description (optional)

        // Determine TTL in days, defaulting to DATA_TTL.DEFAULT_DAYS
        const ttlDays = ttlDaysParam ? parseInt(ttlDaysParam, 10) : DATA_TTL.DEFAULT_DAYS;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
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
                    title,
                    ...(description && { description }),
                    uploadedAt: Date.now().toString(),
                    ...(userId && { userId }) // Add user ID to metadata if available
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
        // Calculate expiresAt using DATA_TTL
        const expiresAtTimestamp = DATA_TTL.getExpirationTimestamp(uploadedAt, ttlDays);

        const fileData = {
            id: fileId,
            fileName: file.name,
            title, // Add title
            ...(description && { description }), // Add description if provided
            contentType: file.type || 'application/octet-stream',
            size: buffer.length,
            gcsPath,
            uploadedAt, // Keep as number for internal consistency before saving
            expiresAt: expiresAtTimestamp, // Add expiresAt timestamp (as number)
            downloadCount: 0,
            ...(userId && { userId }) // Add user ID to file data if available
        };

        // Store metadata in Firestore
        await saveFileMetadata({
            ...fileData,
            uploadedAt: new Date(uploadedAt),
            expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp) : undefined, // Convert to Date for Firestore
        } as any);

        return NextResponse.json({
            success: true,
            fileId,
            fileName: file.name,
            title,
            description: description || undefined,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            directUrl: signedUrl, // Renamed to clarify this is the direct file URL
            downloadUrl: downloadUrl, // New user-friendly download page URL
            uploadedAt: new Date(uploadedAt).toISOString(),
            expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp).toISOString() : undefined // Add expiresAt to response as ISO string
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