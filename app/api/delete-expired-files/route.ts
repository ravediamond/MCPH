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

    // Calculate expiration date for all crates (30 days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 30);

    console.log("Cleaning up expired crates older than 30 days...");
    console.log("Expiration date:", expirationDate);

    // Query for all expired crates (older than 7 days)
    const snapshot = await firestore
      .collection("crates")
      .where("createdAt", "<", expirationDate)
      .get();

    console.log(`Found ${snapshot.size} expired crates`);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No expired crates found",
        count: 0,
      });
    }

    // Delete the expired crates
    const batch = firestore.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();

    // Log for monitoring purposes
    console.log(`Deleted ${count} expired crates.`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${count} expired crates`,
      totalCount: count,
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
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
