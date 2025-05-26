// filepath: /Users/ravindu.somawansa@airliquide.com/Workspace/git_repos/perso/MCPHub/app/api/admin/stats/crates/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { admin } from "../../../../../lib/firebaseAdmin";
import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage client
const storage = new Storage();
// Ensure your GCS bucket name is set as an environment variable
const bucketName = process.env.GCS_BUCKET_NAME;

export async function GET(request: Request) {
    if (!bucketName) {
        console.error("GCS_BUCKET_NAME environment variable is not set.");
        return NextResponse.json(
            { error: "Server configuration error: Bucket name not set." },
            { status: 500 },
        );
    }

    try {
        const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json(
                { error: "Unauthorized: No token provided" },
                { status: 401 },
            );
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        if (!decodedToken.admin) {
            // Check for the admin custom claim
            return NextResponse.json(
                { error: "Forbidden: User is not an admin" },
                { status: 403 },
            );
        }

        const [objects] = await storage.bucket(bucketName).getFiles();
        const totalObjects = objects.length;

        return NextResponse.json({ count: totalObjects });
    } catch (error: any) {
        console.error("Error fetching storage stats:", error);
        if (
            error.code === "auth/id-token-expired" ||
            error.code === "auth/argument-error"
        ) {
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