import { NextRequest, NextResponse } from "next/server";
import {
  getFileMetadata,
  deleteFileMetadata,
} from "@/services/firebaseService";
import { deleteFile } from "@/services/storageService";

// Helper to get client IP
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/**
 * GET handler for retrieving file metadata by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const fileId = (await params).id;

    // Get file metadata from Firestore
    const metadata = await getFileMetadata(fileId);

    if (!metadata) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if file has expired
    if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 404 });
    }

    // Log metadata request
    console.log(`File metadata requested: ${fileId} by: ${getClientIp(req)}`);

    // Return file metadata
    return NextResponse.json({
      ...metadata, // Spread all properties of metadata
      uploadedAt: // Ensure dates are ISO strings
        metadata.uploadedAt instanceof Date
          ? metadata.uploadedAt.toISOString()
          : metadata.uploadedAt,
      expiresAt:
        metadata.expiresAt instanceof Date
          ? metadata.expiresAt.toISOString()
          : metadata.expiresAt,
    });
  } catch (error: any) {
    console.error("Error retrieving file metadata:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file information", message: error.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE handler for deleting file metadata by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const deleted = await deleteFile(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "File not found or could not be deleted" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete file" },
      { status: 500 },
    );
  }
}
