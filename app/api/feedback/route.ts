import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { admin } from "@/lib/firebaseAdmin";

interface FeedbackPayload {
  message: string;
  type: "bug" | "feature" | "general";
  email?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[FeedbackAPI] Starting feedback processing");

    // Debug Firebase initialization state
    console.log("[FeedbackAPI] Firebase apps initialized:", admin.apps.length);

    // Get Firestore instance
    let db;
    try {
      console.log("[FeedbackAPI] Attempting to get Firestore instance");
      db = getFirestore();
      console.log("[FeedbackAPI] Successfully got Firestore instance");
    } catch (dbError) {
      console.error("[FeedbackAPI] Error getting Firestore instance:", dbError);
      return NextResponse.json(
        { error: "Database initialization error" },
        { status: 500 },
      );
    }

    // Parse request body
    const payload: FeedbackPayload = await request.json();

    // Validate required fields
    if (!payload.message || !payload.type || !payload.timestamp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Add to Firestore
    console.log("[FeedbackAPI] Adding feedback to Firestore");
    await db.collection("recipe").add({
      message: payload.message,
      type: payload.type,
      email: payload.email || null,
      timestamp: payload.timestamp,
      status: "new",
      userAgent: request.headers.get("user-agent") || null,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        null,
    });
    console.log("[FeedbackAPI] Feedback added successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FeedbackAPI] Error saving feedback:", error);
    if (error instanceof Error) {
      console.error("[FeedbackAPI] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    );
  }
}
