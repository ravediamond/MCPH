import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/gcpStorageClient';

export async function POST(req: NextRequest) {
    try {
        // Extract file data and metadata from the request
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const uploadUrl = formData.get('uploadUrl') as string;
        const contentType = formData.get('contentType') as string;

        if (!file || !uploadUrl) {
            return NextResponse.json({
                error: 'File and upload URL are required'
            }, { status: 400 });
        }

        // Enforce 50MB file size limit
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'File is too large. Maximum size is 50MB.' }, { status: 400 });
        }

        // Extract the path from the signed URL
        // The URL format is like https://storage.googleapis.com/BUCKET_NAME/PATH?QUERY_PARAMS
        const url = new URL(uploadUrl);
        const pathWithQueryParams = url.pathname.split('/');
        // Skip the first empty element and the bucket name
        const gcsPath = pathWithQueryParams.slice(2).join('/');

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload directly using the GCS client library
        const gcsFile = bucket.file(decodeURIComponent(gcsPath));
        await gcsFile.save(buffer, {
            contentType,
            resumable: false,
        });

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Error in proxy upload:', error);
        return NextResponse.json({
            error: 'Failed to upload file',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false, // Disable the default body parser to handle FormData
    },
};