import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata } from "@/services/firebaseService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: crateId } = await params;

    if (!crateId) {
      return new NextResponse("Crate ID is required", { status: 400 });
    }

    const crate = await getCrateMetadata(crateId);
    if (!crate) {
      return new NextResponse("Crate not found", { status: 404 });
    }

    if (!crate.shared.public) {
      return new NextResponse("Crate is not public", { status: 403 });
    }

    const viewCount = crate.viewCount || 0;
    const formattedCount =
      viewCount >= 1000
        ? viewCount >= 1000000
          ? `${(viewCount / 1000000).toFixed(1)}M`
          : `${(viewCount / 1000).toFixed(1)}k`
        : viewCount.toString();

    // Generate SVG badge
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="views: ${formattedCount}">
  <title>views: ${formattedCount}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="120" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="40" height="20" fill="#555"/>
    <rect x="40" width="80" height="20" fill="#4c9aff"/>
    <rect width="120" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="210" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="300">👁 views</text>
    <text x="210" y="140" transform="scale(.1)" fill="#fff" textLength="300">👁 views</text>
    <text aria-hidden="true" x="790" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="700">${formattedCount}</text>
    <text x="790" y="140" transform="scale(.1)" fill="#fff" textLength="700">${formattedCount}</text>
  </g>
</svg>`.trim();

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error generating view badge:", error);
    return new NextResponse("Failed to generate badge", { status: 500 });
  }
}
