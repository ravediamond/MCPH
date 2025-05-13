import { NextResponse } from 'next/server';
import { getUserFiles, FileMetadata } from '../../../../../services/firebaseService'; // Adjusted path

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const userId = params.userId;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const files: FileMetadata[] = await getUserFiles(userId);
        return NextResponse.json(files);
    } catch (error) {
        console.error(`Error fetching files for user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}
