// filepath: /Users/ravindu.somawansa@airliquide.com/Workspace/git_repos/perso/MCPHub/app/api/admin/stats/crates/route.ts
import { NextResponse } from "next/server";
import { admin, auth } from "../../../../../lib/firebaseAdmin";
import { bucket } from "../../../../../lib/gcpStorageClient";

export async function GET(request: Request) {
  try {
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    // Use the pre-initialized auth instance from firebaseAdmin
    const decodedToken = await auth.verifyIdToken(idToken);
    if (!decodedToken.admin) {
      // Check for the admin custom claim
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Use the bucket from gcpStorageClient instead of creating a new Storage instance
    const [files] = await bucket.getFiles();
    const totalObjects = files.length;

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
