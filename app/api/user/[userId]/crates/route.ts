import { NextRequest, NextResponse } from "next/server";
import { getUserCrates } from "@/services/firebaseService";

export async function GET(
    req: NextRequest,
    context: { params: { userId: string } }
) {
    try {
        const { userId } = await context.params;
        const crates = await getUserCrates(userId);
        return NextResponse.json(crates);
    } catch (error) {
        console.error("Error fetching user crates:", error);
        return NextResponse.json({ error: "Failed to fetch user crates" }, { status: 500 });
    }
}
