import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/firebaseAdmin';

interface FeedbackPayload {
    message: string;
    type: 'bug' | 'feature' | 'general';
    email?: string;
    timestamp: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get Firestore instance
        const db = getFirestore();

        // Parse request body
        const payload: FeedbackPayload = await request.json();

        // Validate required fields
        if (!payload.message || !payload.type || !payload.timestamp) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Add to Firestore
        await db.collection('feedback').add({
            message: payload.message,
            type: payload.type,
            email: payload.email || null,
            timestamp: payload.timestamp,
            status: 'new',
            userAgent: request.headers.get('user-agent') || null,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json(
            { error: 'Failed to save feedback' },
            { status: 500 }
        );
    }
}