import { NextRequest, NextResponse } from "next/server";
import { getFileStream, deleteFile } from "@/services/storageService";

// Helper to get client IP
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

// Handle GET requests - Download file
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const fileId = (await params).id;

    // Get file as stream
    const { stream, metadata } = await getFileStream(fileId);

    // Log download event
    console.log(
      `File download: ${fileId}, name: ${metadata.fileName}, by: ${getClientIp(req)}`,
    );

    // Set headers for download
    const headers = new Headers();
    headers.set("Content-Type", metadata.contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(metadata.fileName)}"`,
    );

    // Return the stream as a response
    return new NextResponse(stream as any, {
      headers,
    });
  } catch (error: any) {
    console.error("Error downloading file:", error);

    if (
      error.message === "File not found" ||
      error.message === "File not found in storage"
    ) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}

// Handle DELETE requests - Delete file
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const fileId = (await params).id;

    // Delete the file
    const success = await deleteFile(fileId);

    if (!success) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Log deletion event
    console.log(`File deleted: ${fileId} by: ${getClientIp(req)}`);

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    },
  });
}
