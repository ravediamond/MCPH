import { NextResponse, NextRequest } from 'next/server'; // Removed unused Request import
import { getFileMetadata, incrementDownloadCount, logEvent } from '@/services/firebaseService';
import { streamFile, getSignedDownloadUrl } from '@/services/storageService';

export const config = {
    runtime: 'nodejs',
};

/**
 * Extract client IP address from request
 */
function getClientIp(req: NextRequest): string { // Changed to NextRequest
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    // req.ip could be used here if available and preferred for NextRequest
    return '127.0.0.1';
}

/**
 * GET handler for file downloads
 */
export async function GET(
    request: NextRequest,
    context: { params: { id: string } } // Explicitly type context
): Promise<NextResponse | Response> {
    const fileId = context.params.id; // Access id via context.params

    if (!fileId) {
        return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    try {
        // Get client IP
        const clientIp = getClientIp(request);

        // Get file metadata from Redis
        const fileData = await getFileMetadata(fileId);

        // Check if file exists
        if (!fileData) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check if file has expired
        if (fileData.expiresAt < new Date()) {
            return NextResponse.json({ error: 'File has expired' }, { status: 410 });
        }

        // Increment download count
        await incrementDownloadCount(fileId);

        // Log download event
        await logEvent('file_download', fileId, clientIp);

        // Check for direct parameter to determine download method
        const url = new URL(request.url);
        const direct = url.searchParams.get('direct') === 'true';
        const download = url.searchParams.get('download') === 'true';

        // If direct download is requested, redirect to a signed URL
        if (direct) {
            // Generate signed URL (expires in 10 minutes)
            const signedUrl = await getSignedDownloadUrl(fileId, fileData.fileName);
            return NextResponse.redirect(signedUrl);
        }

        // If download info is requested (default behavior without any params)
        if (!download) {
            return NextResponse.json({
                id: fileData.id,
                fileName: fileData.fileName,
                contentType: fileData.contentType,
                size: fileData.size,
                downloadCount: fileData.downloadCount,
                uploadedAt: fileData.uploadedAt.toISOString(),
                expiresAt: fileData.expiresAt.toISOString(),
                directUrl: `${url.origin}/api/uploads/${fileId}?direct=true`,
                downloadUrl: `${url.origin}/api/uploads/${fileId}?download=true`,
            });
        }

        // Stream the file directly (when download=true)
        const { stream, contentType, size } = await streamFile(fileId, fileData.fileName);

        // Create a readable stream response
        return new Response(stream as unknown as ReadableStream, { // Cast to unknown first, then to ReadableStream
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(fileData.fileName)}"`,
                'Content-Length': size.toString(),
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.error('Error handling download:', error);
        return NextResponse.json(
            { error: 'Failed to process download' },
            { status: 500 }
        );
    }
}

/**
 * DELETE handler for removing a file
 */
export async function DELETE(
    request: NextRequest,
    context: { params: { id: string } } // Explicitly type context
): Promise<NextResponse> {
    const fileId = context.params.id; // Access id via context.params

    if (!fileId) {
        return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    try {
        // Get client IP
        const clientIp = getClientIp(request);

        // Get file metadata from Redis
        const fileData = await getFileMetadata(fileId);

        // Check if file exists
        if (!fileData) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // TODO: Implement authorization check if needed

        // Delete the file (implement this in storageService)
        const { deleteFile } = await import('@/services/storageService');
        const deleted = await deleteFile(fileId, fileData.fileName);

        if (deleted) {
            // Delete metadata from Redis
            const { deleteFileMetadata } = await import('@/services/firebaseService');
            await deleteFileMetadata(fileId);

            // Log deletion event
            await logEvent('file_delete', fileId, clientIp);

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: 'Failed to delete file' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error handling file deletion:', error);
        return NextResponse.json(
            { error: 'Failed to process deletion' },
            { status: 500 }
        );
    }
}