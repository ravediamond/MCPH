import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
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

    // Require authentication for view tracking
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    try {
      const decodedToken = await auth.verifyIdToken(token);
      // View count tracking is now authenticated
    } catch (error) {
      console.warn(`Invalid authentication token:`, error);
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
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
