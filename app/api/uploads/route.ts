import { NextRequest, NextResponse } from 'next/server';

// Change to static for compatibility with Next.js static export
export const dynamic = 'force-static';

// Configure as static API
export const config = {
    runtime: 'edge',
};

/**
 * Static placeholder for the file uploads API
 * In a static export, file uploads need to be handled by Firebase Functions
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    return NextResponse.json({
        message: "This is a static placeholder. In production, file upload functionality is provided by Firebase Functions.",
        endpoint: "/api/uploads",
        firebaseFunctionUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url/fileUpload"
    }, { status: 200 });
}

/**
 * GET handler to provide information about the API
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    return NextResponse.json({
        message: "This is a static placeholder. In production, file upload functionality is provided by Firebase Functions.",
        info: "Please use the Firebase Function endpoint for file uploads.",
        firebaseFunctionUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url/fileUpload"
    });
}