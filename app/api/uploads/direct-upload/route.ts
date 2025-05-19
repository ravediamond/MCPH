import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/services/storageService';
import { saveFileMetadata, logEvent, incrementMetric, getUserStorageUsage } from '@/services/firebaseService';
import { DATA_TTL } from '@/app/config/constants';

/**
 * API route to handle direct file uploads
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Extract file from formData
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Enforce 50MB file size limit
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'File is too large. Maximum size is 50MB.' }, { status: 400 });
        }

        // Get additional form fields
        const ttlDaysParam = formData.get('ttlDays') as string | null;
        const ttlDays = ttlDaysParam ? parseInt(ttlDaysParam, 10) : DATA_TTL.DEFAULT_DAYS;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const userId = formData.get('userId') as string;
        const fileTypeParam = formData.get('fileType') as string | null;
        const fileType = fileTypeParam || undefined; // Convert null to undefined

        // Validate that title is provided
        if (!title || !title.trim()) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        // Enforce per-user storage limit (500MB)
        if (userId) {
            const storage = await getUserStorageUsage(userId);
            if (storage.remaining < file.size) {
                return NextResponse.json({ error: 'Storage quota exceeded. You have ' + (storage.remaining / 1024 / 1024).toFixed(2) + ' MB remaining.' }, { status: 403 });
            }
        }

        // Convert File to Buffer for server-side processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload the file to storage
        const fileData = await uploadFile(buffer, file.name, file.type, ttlDays, title, description, fileType);

        // Add userId to the fileData if available
        if (userId) {
            fileData.userId = userId;
        }

        // --- VECTOR EMBEDDING GENERATION ---
        // Prepare text for embedding: concatenate title, description, and metadata
        let embedding: number[] | undefined = undefined;
        try {
            const metadataObj = fileData.metadata || {};
            const metaString = Object.entries(metadataObj).map(([k, v]) => `${k}: ${v}`).join(' ');
            const concatText = [title, description, metaString].filter(Boolean).join(' ');
            if (concatText.trim().length > 0) {
                const { getEmbedding } = await import('@/lib/vertexAiEmbedding');
                embedding = await getEmbedding(concatText);
            }
        } catch (e) {
            console.error('Failed to generate embedding:', e);
        }

        // Store the metadata in Firestore with userId and embedding if available
        await saveFileMetadata({
            ...fileData,
            uploadedAt: new Date(fileData.uploadedAt),
            expiresAt: fileData.expiresAt ? new Date(fileData.expiresAt) : undefined,
            ...(embedding ? { embedding } : {}),
        });

        // Generate URLs
        const apiUrl = new URL(`/api/files/${fileData.id}`, req.url).toString();
        const downloadUrl = new URL(`/download/${fileData.id}`, req.url).toString();

        // Log the upload event
        await logEvent('file_upload', fileData.id, undefined, userId ? { userId } : undefined);
        await incrementMetric('file_uploads');

        // Return the upload result with compression info if available
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
        console.error('Error handling direct upload:', error);
        return NextResponse.json(
            { error: 'Upload failed', message: error.message },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};