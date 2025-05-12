import { NextRequest, NextResponse } from 'next/server';
import { getSignedDownloadUrl } from '@/services/storageService';

// Helper to get client IP
function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return '127.0.0.1';
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const fileId = params.id;

        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const expiresInMinutes = searchParams.get('expires')
            ? parseInt(searchParams.get('expires') as string, 10)
            : 60; // Default to 60 minutes

        // Get a signed URL for the file
        const signedUrl = await getSignedDownloadUrl(fileId, undefined, expiresInMinutes);

        // Log event
        console.log(`Signed URL generated for file: ${fileId}, expires in: ${expiresInMinutes} minutes, by: ${getClientIp(req)}`);

        return NextResponse.json({
            url: signedUrl,
            expiresIn: expiresInMinutes * 60, // in seconds
        });

    } catch (error: any) {
        console.error('Error generating signed URL:', error);

        if (error.message === 'File not found' || error.message === 'File not found in storage') {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With'
        }
    });
}