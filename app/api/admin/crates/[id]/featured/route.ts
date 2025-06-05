import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../../lib/firebaseAdmin";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const crateId = params.id;
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

        // Get request body to determine the new featured status
        const body = await request.json();
        const featured = !!body.featured;

        // Check if the crate exists
        const crateRef = firestore.collection("crates").doc(crateId);
        const crateDoc = await crateRef.get();

        if (!crateDoc.exists) {
            return NextResponse.json(
                { error: "Crate not found" },
                { status: 404 },
            );
        }

        // Update the featured status
        await crateRef.update({
            featured,
            updatedAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: `Crate featured status updated to ${featured}`
        });
    } catch (error: any) {
        console.error("Error updating crate featured status:", error);

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