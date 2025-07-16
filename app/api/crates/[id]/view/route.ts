import { NextRequest, NextResponse } from "next/server";
import { incrementCrateViewCount } from "@/services/firebaseService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: crateId } = await params;

    if (!crateId) {
      return NextResponse.json(
        { error: "Crate ID is required" },
        { status: 400 },
      );
    }

    const viewCount = await incrementCrateViewCount(crateId);

    return NextResponse.json({
      success: true,
      viewCount,
    });
  } catch (error) {
    console.error("Error tracking crate view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 },
    );
  }
}
