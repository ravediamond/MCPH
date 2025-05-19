import { NextRequest, NextResponse } from "next/server";
import { getFileMetadata, logEvent } from "@/services/firebaseService";
import { getFileContent } from "@/services/storageService";

/**
 * GET handler for retrieving text content by ID
 * Updated to fetch text content exclusively from GCP buckets and handle compression
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const fileId = (await params).id;

    // Get file metadata from Firestore
    const fileMetadata = await getFileMetadata(fileId);

    if (!fileMetadata) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check if file has expired
    if (
      fileMetadata.expiresAt &&
      new Date(fileMetadata.expiresAt) < new Date()
    ) {
      return NextResponse.json(
        { error: "Content has expired" },
        { status: 404 },
      );
    }

    // Get the content from GCP Storage bucket with automatic decompression if needed
    try {
      const { buffer, metadata } = await getFileContent(fileId);

      // Convert buffer to text for text content types
      const content = buffer.toString("utf-8");

      // Log the download event
      await logEvent("text_download", fileId);

      // Create response with appropriate content type
      const response = new NextResponse(content);

      // Set appropriate content type
      response.headers.set(
        "Content-Type",
        metadata.contentType || "text/plain",
      );

      // Set content disposition for download with original filename
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(metadata.fileName)}"`,
      );

      return response;
    } catch (error) {
      console.error("Error retrieving file content:", error);
      return NextResponse.json(
        {
          error: "Failed to retrieve content",
          message: "File could not be retrieved",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Error retrieving text content:", error);
    return NextResponse.json(
      { error: "Failed to retrieve content", message: error.message },
      { status: 500 },
    );
  }
}
