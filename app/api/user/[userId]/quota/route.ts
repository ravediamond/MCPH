import { NextRequest, NextResponse } from "next/server";
import {
  getUserToolUsage,
  getUserStorageUsage,
  getUserSharedCratesCount,
} from "@/services/firebaseService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  // You may want to add authentication here
  const usage = await getUserToolUsage(userId);
  const storage = await getUserStorageUsage(userId);
  const sharedCrates = await getUserSharedCratesCount(userId);
  return NextResponse.json({ usage, storage, sharedCrates });
}
