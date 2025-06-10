import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../../lib/firebaseAdmin";

// Function to handle POST requests to toggle featured status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await the params promise to get the actual id value
    const { id } = await params;

    // Get and validate authentication token
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    // Verify the token and check admin status
    const decodedToken = await getAuth().verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Parse request body to get featured status
    const { featured } = await request.json();

    // Validate featured is a boolean
    if (typeof featured !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request: 'featured' must be a boolean value" },
        { status: 400 },
      );
    }

    // Check if the crate exists
    const crateRef = firestore.collection("crates").doc(id);
    const crateDoc = await crateRef.get();

    if (!crateDoc.exists) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Update the featured status
    await crateRef.update({
      featured: featured,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Crate ${featured ? "added to" : "removed from"} featured`,
      featured: featured,
    });
  } catch (error: any) {
    console.error("Error updating featured status:", error);

    // Handle specific Firebase errors
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
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
