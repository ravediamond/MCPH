import { NextRequest, NextResponse } from 'next/server';
import { getFileMetadata, saveFileMetadata } from '@/services/firebaseService';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { expiresAt } = await req.json();
        if (!expiresAt) {
            return NextResponse.json({ error: 'Missing expiresAt' }, { status: 400 });
        }
        const file = await getFileMetadata(id);
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        // Update expiry
        file.expiresAt = new Date(expiresAt);
        await saveFileMetadata(file);
        return NextResponse.json({ success: true, expiresAt: file.expiresAt });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update expiry' }, { status: 500 });
    }
}
