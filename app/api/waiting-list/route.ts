import { NextRequest, NextResponse } from "next/server";
import { firestore } from "../../../lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, name } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if this email is already in the waiting list
    const existingSubscribers = await firestore
      .collection("waitingList")
      .where("email", "==", email)
      .get();

    if (!existingSubscribers.empty) {
      return NextResponse.json(
        { message: "You are already on the waiting list!" },
        { status: 200 },
      );
    }

    // Create a new waiting list entry
    const id = uuidv4();
    const waitingListData = {
      id,
      email,
      name: name || "",
      createdAt: new Date().toISOString(),
      notified: false,
    };

    await firestore.collection("waitingList").doc(id).set(waitingListData);

    return NextResponse.json(
      { message: "Successfully added to the Pro version waiting list" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding to waiting list:", error);
    return NextResponse.json(
      { error: "Failed to add to waiting list" },
      { status: 500 },
    );
  }
}
