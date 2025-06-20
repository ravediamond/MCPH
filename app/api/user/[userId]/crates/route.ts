import { NextRequest, NextResponse } from "next/server";
import { getUserCrates } from "@/services/firebaseService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;

    // Get pagination parameters from query string
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startAfter = searchParams.get("startAfter") || undefined;

    // Get paginated crates
    const result = await getUserCrates(userId, limit, startAfter);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching user crates:", error);
    return NextResponse.json(
      { error: "Failed to fetch user crates" },
      { status: 500 },
    );
  }
}
