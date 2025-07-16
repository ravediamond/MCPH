import { NextRequest, NextResponse } from "next/server";
import { duplicateCrate } from "@/services/firebaseService";
import { auth } from "@/lib/firebaseAdmin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization");
    let userId: string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    try {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 },
      );
    }

    const { id: crateId } = await params;
    if (!crateId) {
      return NextResponse.json(
        { error: "Crate ID is required" },
        { status: 400 },
      );
    }

    const result = await duplicateCrate(crateId, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      crateId: result.crateId,
    });
  } catch (error) {
    console.error("Error duplicating crate:", error);
    return NextResponse.json(
      { error: "Failed to duplicate crate" },
      { status: 500 },
    );
  }
}
