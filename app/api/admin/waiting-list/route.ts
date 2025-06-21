import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
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

    // Get all waiting list entries, sorted by creation date (newest first)
    const waitingListSnapshot = await firestore
      .collection("waitingList")
      .orderBy("createdAt", "desc")
      .get();

    const waitingList = waitingListSnapshot.docs.map((doc) => doc.data());

    return NextResponse.json({ waitingList });
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiting list" },
      { status: 500 },
    );
  }
}
