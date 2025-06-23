import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata } from "@/services/firebaseService";
import bcrypt from "bcrypt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { password } = await req.json();
    const crateId = (await params).id;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    const crate = await getCrateMetadata(crateId);

    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    if (!crate.shared.passwordHash) {
      return NextResponse.json(
        { error: "Crate is not password protected" },
        { status: 400 },
      );
    }

    const match = await bcrypt.compare(password, crate.shared.passwordHash);

    if (match) {
      // Passwords match
      // In a real scenario, you might issue a short-lived token here
      // for the client to use for the actual download/access.
      // For now, just confirming verification.
      return NextResponse.json({ success: true, message: "Password verified" });
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { error: "Failed to verify password", message: error.message },
      { status: 500 },
    );
  }
}
