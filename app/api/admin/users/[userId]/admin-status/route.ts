import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function POST(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = params.userId;
        const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];

        if (!idToken) {
            return NextResponse.json(
                { error: "Unauthorized: No token provided" },
                { status: 401 },
            );
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        if (!decodedToken.admin) {
            return NextResponse.json(
                { error: "Forbidden: User is not an admin" },
                { status: 403 },
            );
        }

        // Get request body to determine the new admin status
        const body = await request.json();
        const isAdmin = !!body.isAdmin;

        // Check if the user is trying to revoke their own admin status
        if (userId === decodedToken.uid && !isAdmin) {
            return NextResponse.json(
                { error: "You cannot revoke your own admin privileges" },
                { status: 400 },
            );
        }

        // Update the user's custom claims to set admin status
        await getAuth().setCustomUserClaims(userId, { admin: isAdmin });

        return NextResponse.json({
            success: true,
            message: `User admin status updated to ${isAdmin}`
        });
    } catch (error: any) {
        console.error("Error updating user admin status:", error);

        if (error.code === "auth/user-not-found") {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or expired token" },
                { status: 401 },
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}