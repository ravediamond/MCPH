import { NextRequest, NextResponse } from "next/server";
import { getCrateContent } from "@/services/storageService";
// getCrateMetadata and incrementCrateDownloadCount are effectively called by getCrateContent
// import { auth } from "@/lib/firebaseAdmin"; // For future permission checks if needed

// Helper to get client IP
function getClientIp(req: NextRequest): string {
  let ip = req.headers.get("x-forwarded-for");
  if (ip) {
    // When deployed, x-forwarded-for might contain a chain of IPs. The first one is usually the client.
    return ip.split(",")[0].trim();
  }
  // Fallback for localhost or direct connections when x-forwarded-for is not set.
  // For Edge Runtime, req.ip is not available. We can try to get it from x-real-ip or default.
  ip = req.headers.get("x-real-ip");
  if (ip) {
    return ip.trim();
  }
  return "127.0.0.1"; // Default if no IP found
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const crateId = await params.then((p) => p.id);

  try {
    // Fetch crate data (includes metadata check, gets content buffer, and increments download count)
    // getCrateContent is designed for crates, handles decompression, and calls incrementCrateDownloadCount.
    const { buffer, crate } = await getCrateContent(crateId);

    // Note: Permission checks (e.g., for private crates not owned by the user)
    // are assumed to be handled by the page displaying the download button (/crate/[id]),
    // or would need to be added here if this API endpoint can be accessed directly without prior checks.

    console.log(
      `Crate download initiated via API: ${crateId}, name: ${crate.fileName}, by: ${getClientIp(req)}`,
    );

    // Set headers for download
    const headers = new Headers();
    headers.set("Content-Type", crate.mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename=\"${encodeURIComponent(crate.fileName)}\"`,
    );
    headers.set("Content-Length", buffer.length.toString());

    // Return the buffer as a response
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error(`Error downloading crate ${crateId} via API:`, error);

    if (error.message && error.message.toLowerCase().includes("not found")) {
      return NextResponse.json(
        { error: "Crate not found or has expired" },
        { status: 404 },
      );
    }
    // Differentiate other errors if possible, e.g., storage service unavailable
    if (
      error.message &&
      error.message.toLowerCase().includes("failed to get crate content")
    ) {
      return NextResponse.json(
        { error: "Failed to retrieve crate content from storage" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to download crate",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": "*", // Adjust to specific domains in production
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization", // Include Authorization if you plan to use it
    },
  });
}
