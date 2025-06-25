import { NextRequest, NextResponse } from "next/server";
import { db, CRATES_COLLECTION, logEvent } from "@/services/firebaseService";
import { deleteCrate } from "@/services/storageService";

/**
 * API route to delete expired crates (scheduled job)
 * This endpoint should be called by a cron job (e.g., every day)
 * It finds all crates with an expiresAt date in the past and deletes them
 */
export async function GET(req: NextRequest) {
  // Check if this is an authorized request (should be secured with a token in production)
  // For now, we'll just allow it to be called without auth for demonstration purposes
  // In a real-world scenario, use a secure webhook with authentication

  try {
    const now = new Date();

    // Query for crates that have expired
    const snapshot = await db
      .collection(CRATES_COLLECTION)
      .where("expiresAt", "<", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No expired crates found",
        count: 0,
      });
    }

    // Process each expired crate
    const results = [];
    let successCount = 0;

    for (const doc of snapshot.docs) {
      const crate = doc.data();

      try {
        // Delete the crate content and metadata
        const deleted = await deleteCrate(doc.id);

        if (deleted) {
          successCount++;
          results.push({
            id: doc.id,
            success: true,
            title: crate.title || "Untitled",
            expiredAt:
              crate.expiresAt instanceof Date
                ? crate.expiresAt.toISOString()
                : crate.expiresAt,
          });

          // Log deletion event
          await logEvent("crate_expired_delete", doc.id, undefined, {
            title: crate.title,
            ownerId: crate.ownerId,
            expiresAt: crate.expiresAt,
          });
        } else {
          results.push({
            id: doc.id,
            success: false,
            error: "Failed to delete crate",
          });
        }
      } catch (error) {
        console.error(`Error deleting expired crate ${doc.id}:`, error);
        results.push({
          id: doc.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${successCount} expired crates`,
      count: successCount,
      total: snapshot.size,
      results,
    });
  } catch (error) {
    console.error("Error deleting expired crates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete expired crates",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
