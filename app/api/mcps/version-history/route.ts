// This file has been deprecated since version functionality is no longer used
// Keeping an empty file temporarily to prevent 404 errors in case there are still references to this endpoint

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    return NextResponse.json({
        error: 'Version functionality has been deprecated',
        versionHistory: []
    }, { status: 410 }); // 410 Gone
}