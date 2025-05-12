import { NextRequest, NextResponse } from 'next/server'

// Change from dynamic to static for compatibility with static export
export const dynamic = 'force-static'

// This is a static placeholder that will inform users to use the Firebase Functions endpoint
export async function GET(req: NextRequest) {
    return new Response(JSON.stringify({
        message: "This is a static placeholder. In production, SSE functionality is provided by Firebase Functions.",
        endpoint: "/api/sse",
        firebaseFunctionUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url/sse"
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
        }
    });
}

// Simple static response for OPTIONS requests
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
        },
    })
}

// Simple static response for POST requests
export async function POST(req: NextRequest) {
    return new Response(JSON.stringify({
        message: "This is a static placeholder. In production, SSE functionality is provided by Firebase Functions.",
        endpoint: "/api/sse",
        firebaseFunctionUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url/sse"
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
            'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
        }
    });
}

export const config = {
    runtime: 'edge',
};
