import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listApiKeys, deleteApiKey, getApiKeyToolUsage } from '@/services/firebaseService';
import { getAuth } from 'firebase-admin/auth';

// Helper to get userId from request (from session or token)
async function getUserId(req: NextRequest, userId: string) {
    // For simplicity, trust the userId param if authenticated (in production, validate token/session)
    return userId;
}

export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const { userId } = await context.params;
    const resolvedUserId = await getUserId(req, userId);
    if (!resolvedUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const keys = await listApiKeys(resolvedUserId);
    // Do not return hashedKey
    return NextResponse.json(keys.map(({ hashedKey, ...rest }) => rest));
}

export async function POST(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const { userId } = await context.params;
    const resolvedUserId = await getUserId(req, userId);
    if (!resolvedUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { name } = await req.json();
    const { apiKey, record } = await createApiKey(resolvedUserId, name);
    // Return the plain apiKey only once
    return NextResponse.json({ apiKey, ...record });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const { userId } = await context.params;
    const resolvedUserId = await getUserId(req, userId);
    if (!resolvedUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { keyId } = await req.json();
    const ok = await deleteApiKey(resolvedUserId, keyId);
    if (!ok) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    return NextResponse.json({ success: true });
}

// New endpoint: GET /api/user/[userId]/quota
export async function quotaGET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const { userId } = await context.params;
    // You may want to add authentication here
    const apiKeys = await listApiKeys(userId);
    const quotas = await Promise.all(apiKeys.map(async (key) => {
        const usage = await getApiKeyToolUsage(key.id);
        return {
            keyId: key.id,
            name: key.name,
            count: usage.count,
            remaining: usage.remaining,
        };
    }));
    return NextResponse.json({ quotas });
}
