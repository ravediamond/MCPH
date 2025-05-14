import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '../../../../../../lib/firebaseAdmin'; // Assuming you have this

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

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

        const listUsersResult = await getAuth().listUsers();
        const totalUsers = listUsersResult.users.length;

        return NextResponse.json({ count: totalUsers });
    } catch (error: any) {
        console.error('Error fetching user stats:', error);
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
