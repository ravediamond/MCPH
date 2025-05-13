import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/services/storageService';

// Helper to get client IP
function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return '127.0.0.1';
}

export async function POST(req: NextRequest) {
    try {
        // Check if the request is multipart/form-data
        const contentType = req.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Content type must be multipart/form-data' }, { status: 400 });
        }

        // Parse the form data
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Get TTL if provided
        const ttl = formData.get('ttl');
        const ttlHours = ttl ? parseInt(ttl.toString(), 10) : undefined;

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload file
        const fileData = await uploadFile(
            buffer,
            file.name,
            file.type,
            ttlHours
        );

        // Generate download page URL
        const downloadUrl = new URL(`/download/${fileData.id}`, req.url).toString();

        // Log the upload event
        console.log(`File uploaded: ${fileData.id}, name: ${file.name}, size: ${file.size}`);

        return NextResponse.json({
            id: fileData.id,
            fileId: fileData.id, // For consistency with other endpoints
            fileName: fileData.fileName,
            contentType: fileData.contentType,
            size: fileData.size,
            uploadedAt: fileData.uploadedAt,
            expiresAt: fileData.expiresAt,
            downloadUrl: downloadUrl // Add the download page URL
        }, { status: 201 });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With'
        }
    });
}