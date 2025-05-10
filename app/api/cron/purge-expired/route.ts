import { NextRequest, NextResponse } from 'next/server';

// Change from dynamic to static for compatibility with static export
export const dynamic = 'force-static';

/**
 * GET /api/cron/purge-expired
 * 
 * Since we're using static export, this is a placeholder endpoint.
 * The actual purge functionality should be implemented in Firebase Functions.
 */
export async function GET(req: NextRequest) {
    return NextResponse.json({
        message: "This is a static placeholder. In production, file purging functionality is provided by Firebase Functions.",
        info: "Please use the Firebase Function endpoint for file purging operations.",
        firebaseFunctionUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://your-firebase-function-url/purgeCron"
    }, { status: 200 });
}