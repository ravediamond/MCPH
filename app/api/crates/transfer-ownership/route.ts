import { NextRequest, NextResponse } from "next/server";
import { bulkTransferCrateOwnership } from "@/services/firebaseService";
import { getUserFromRequest } from "@/lib/apiKeyAuth";

/**
 * API route to transfer ownership of anonymous crates to a logged-in user
 * POST /api/crates/transfer-ownership
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const userInfo = await getUserFromRequest(req);
    if (!userInfo || !userInfo.uid) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get the crate IDs to transfer
    const { crateIds } = await req.json();

    if (!Array.isArray(crateIds) || crateIds.length === 0) {
      return NextResponse.json(
        { error: "No crate IDs provided" },
        { status: 400 },
      );
    }

    // Transfer ownership to the authenticated user
    const result = await bulkTransferCrateOwnership(crateIds, userInfo.uid);

    // Get titles for successfully transferred crates to display in UI
    const successfulCrates = result.results.filter((r) => r.success);
    const crateDetails = [];

    if (successfulCrates.length > 0) {
      try {
        // Get basic info for each crate
        const { getCrateMetadata } = await import("@/services/firebaseService");

        for (const crate of successfulCrates) {
          const metadata = await getCrateMetadata(crate.id);
          if (metadata) {
            crateDetails.push({
              id: crate.id,
              title: metadata.title || "Untitled Crate",
              success: true,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching crate details:", error);
      }
    }

    return NextResponse.json({
      success: result.success,
      message: `Successfully transferred ownership of ${result.successCount} crates.`,
      results: result.results,
      crateDetails: crateDetails,
    });
  } catch (error: any) {
    console.error("Error transferring crate ownership:", error);
    return NextResponse.json(
      {
        error: "Failed to transfer crate ownership",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
