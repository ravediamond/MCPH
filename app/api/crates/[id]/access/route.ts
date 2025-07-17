import { NextRequest, NextResponse } from "next/server";
import { incrementCrateDownloadCount } from "@/services/firebaseService";

/**
 * API endpoint to increment download count when content is accessed
 * This is used when "View Content" is clicked (content access without download)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: crateId } = await params;

    // Increment download count (content access counts as a download)
    const downloadCount = await incrementCrateDownloadCount(crateId);

    return NextResponse.json({
      success: true,
      downloadCount: downloadCount,
    });
  } catch (error) {
    console.error(
      "Error incrementing download count for content access:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to increment download count" },
      { status: 500 },
    );
  }
}
