import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../lib/firebaseAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing subscriber ID" },
        { status: 400 },
      );
    }

    // Verify admin authentication
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { notified } = body;

    if (typeof notified !== "boolean") {
      return NextResponse.json(
        { error: "Invalid notified status. Must be a boolean value." },
        { status: 400 },
      );
    }

    // Check if the entry exists
    const docRef = firestore.collection("waitingList").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 },
      );
    }

    // Update the notification status
    await docRef.update({ notified });

    return NextResponse.json({
      success: true,
      message: `Subscriber marked as ${notified ? "notified" : "waiting"}`,
    });
  } catch (error) {
    console.error("Error updating waiting list entry:", error);
    return NextResponse.json(
      { error: "Failed to update subscriber status" },
      { status: 500 },
    );
  }
}
