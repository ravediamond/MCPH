import { NextResponse } from "next/server";
import {
  getUserFiles,
  FileMetadata,
} from "../../../../../services/firebaseService";

export async function GET(request: Request) {
  // Extract userId from the URL pathname
  const url = new URL(request.url);
  const match = url.pathname.match(/\/user\/([^/]+)\/files/);
  const userId = match ? match[1] : null;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const files: FileMetadata[] = await getUserFiles(userId);
    return NextResponse.json(files);
  } catch (error) {
    console.error(`Error fetching files for user ${userId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}
