import { NextRequest, NextResponse } from "next/server";
import { generateUploadUrl } from "@/services/storageService";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

    // Extract file details from request body
    const { fileName, contentType, ttlHours } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        {
          error: "File name and content type are required",
        },
        { status: 400 },
      );
    }

    // Generate pre-signed URL for direct upload to GCS
    const { url, fileId, gcsPath } = await generateUploadUrl(
      fileName,
      contentType,
      ttlHours,
    );

    return NextResponse.json(
      {
        uploadUrl: url,
        fileId,
        expiresIn: "15 minutes",
        fileName,
        contentType,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      {
        error: "Failed to generate upload URL",
      },
      { status: 500 },
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    },
  });
}
