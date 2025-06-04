import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/services/firebaseService";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { message, email, userId } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    const record = {
      id: uuidv4(),
      message,
      email,
      userId,
      createdAt: new Date(),
    };
    const ok = await saveFeedback(record);
    if (!ok) throw new Error("Failed to save");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

