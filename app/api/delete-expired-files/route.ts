import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../lib/firebaseAdmin";

// This endpoint is called by Vercel Cron jobs
// It's configured in vercel.json to run daily at midnight
export async function GET(req: NextRequest) {
  try {
    // Check for authentication
    const idToken = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    // Verify admin status
    const decodedToken = await getAuth().verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Calculate expiration dates
    // Private crates expire after 30 days, public crates after 90 days
    const privateExpirationDate = new Date();
    privateExpirationDate.setDate(privateExpirationDate.getDate() - 30);

    const publicExpirationDate = new Date();
    publicExpirationDate.setDate(publicExpirationDate.getDate() - 90);

    console.log("Cleaning up expired crates...");
    console.log("Private expiration date:", privateExpirationDate);
    console.log("Public expiration date:", publicExpirationDate);

    // First, query for expired private crates (older than 30 days)
    const privateSnapshot = await firestore
      .collection("crates")
      .where("createdAt", "<", privateExpirationDate)
      .where("isPublic", "==", false)
      .get();

    // Then, query for expired public crates (older than 90 days)
    const publicSnapshot = await firestore
      .collection("crates")
      .where("createdAt", "<", publicExpirationDate)
      .where("isPublic", "==", true)
      .get();

    console.log(`Found ${privateSnapshot.size} expired private crates`);
    console.log(`Found ${publicSnapshot.size} expired public crates`);

    if (privateSnapshot.empty && publicSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No expired crates found",
        count: 0,
      });
    }

    // Delete the expired crates
    const batch = firestore.batch();
    let privateCount = 0;
    let publicCount = 0;

    privateSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      privateCount++;
    });

    publicSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      publicCount++;
    });

    await batch.commit();
    const totalCount = privateCount + publicCount;

    // Log for monitoring purposes
    console.log(
      `Deleted ${privateCount} private and ${publicCount} public expired crates (total: ${totalCount})`,
    );

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${totalCount} expired crates (${privateCount} private, ${publicCount} public)`,
      privateCount,
      publicCount,
      totalCount,
    });
  } catch (error: any) {
    console.error("Error cleaning up expired crates:", error);

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
      { error: "Failed to clean up expired crates" },
      { status: 500 },
    );
  }
}
