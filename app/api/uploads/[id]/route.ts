import { NextRequest, NextResponse } from 'next/server';

// Change to static for compatibility with Next.js static export
export const dynamic = 'force-static';

// Configure as static API
export const config = {
    runtime: 'edge',
};

type ParamsType = Promise<{ id: string }>;

/**
 * Generate static params for all possible dynamic routes
 * This is required when using "output: export" in next.config.js
 */
export async function generateStaticParams() {
    // You'll need to return an array of objects with the id parameter
    // for each dynamic route you want to pre-render
    return [
        { id: 'placeholder' }
        // Add more IDs if you want to pre-render specific file routes
    ];
}

/**
 * Static placeholder for the file download API
 * In a static export, file downloads need to be handled by Firebase Functions
 */
export async function GET(
    request: NextRequest,
    { params }: { params: ParamsType }
) {
    const { id }: { id: string } = await params;

    return NextResponse.json({
        message: "This is a static placeholder. In production, file download functionality is provided by Firebase Functions.",
        fileId: id,
        endpoint: `/api/uploads/${id}`,
        firebaseFunctionUrl: `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url"}/fileDownload/${id}`
    }, { status: 200 });
}

/**
 * DELETE handler placeholder for removing a file
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: ParamsType }
) {
    const { id }: { id: string } = await params;

    return NextResponse.json({
        message: "This is a static placeholder. In production, file deletion functionality is provided by Firebase Functions.",
        fileId: id,
        endpoint: `/api/uploads/${id}`,
        firebaseFunctionUrl: `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url"}/fileDelete/${id}`
    }, { status: 200 });
}