import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../../../lib/firebaseAdmin'; // Assuming you have this

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();
const db = getFirestore();

export async function GET(request: Request) {
    try {
        const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        if (!decodedToken.admin) { // Check for the admin custom claim
            return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
        }

        // Example: Counting documents in a 'fileMetadata' collection
        // Replace 'fileMetadata' with your actual collection name for file metadata
        const collectionRef = db.collection('fileMetadata');
        const snapshot = await collectionRef.count().get();
        const totalDocs = snapshot.data().count;

        return NextResponse.json({ count: totalDocs });
    } catch (error: any) {
        console.error('Error fetching Firestore stats:', error);
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
