import { NextRequest, NextResponse } from 'next/server';
import { getUserToolUsage } from '@/services/firebaseService';

export async function GET(req: NextRequest, context: { params: { userId: string } }) {
    const { userId } = context.params;
    // You may want to add authentication here
    const usage = await getUserToolUsage(userId);
    return NextResponse.json({ usage });
}
