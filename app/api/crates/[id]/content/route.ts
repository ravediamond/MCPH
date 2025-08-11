import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata } from "@/services/firebaseService";
import { getCrateContentForViewing } from "@/services/storageService";
import { auth } from "@/lib/firebaseAdmin";
import { CrateCategory } from "@/shared/types/crate";
import bcrypt from "bcrypt";

// Define the type for params
type RouteParams = Promise<{ id: string }>;

/**
 * API endpoint to get the content of a crate
 */
export async function GET(
  req: NextRequest,
  { params }: { params: RouteParams },
) {
  try {
    // Properly await the params
    const { id } = await params;

    console.log(`[Content Route] Accessing content for crate ID: ${id}`);

    // Get crate metadata
    const crate = await getCrateMetadata(id);
    if (!crate) {
      console.log(`[Content Route] Crate not found with ID: ${id}`);
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    console.log(
      `[Content Route] Found crate: ${crate.title}, Public: ${crate.shared.public}`,
    );

    // Enhanced logging for debugging auth issues
    console.log(
      "[Content Route] Request headers:",
      Object.fromEntries([...req.headers.entries()]),
    );
    console.log(
      "[Content Route] All cookies:",
      Object.fromEntries(
        req.cookies
          .getAll()
          .map((c) => [c.name, c.value.substring(0, 5) + "..."]),
      ),
    );

    // Check authentication
    const authHeader = req.headers.get("authorization");
    console.log(`[Content Route] Auth header present: ${Boolean(authHeader)}`);

    // Extract cookies for session-based auth
    const cookies = req.cookies;
    const sessionCookie = cookies.get("session");
    console.log(
      `[Content Route] Session cookie present: ${Boolean(sessionCookie)}`,
    );

    let userId = "anonymous";
    let isAuthenticated = false;

    // Try token-based auth first from Authorization header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        console.log(`[Content Route] Verifying token auth from header`);
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
        isAuthenticated = true;
        console.log(
          `[Content Route] Auth header token verification successful. User ID: ${userId}`,
        );
      } catch (error) {
        console.warn(
          `[Content Route] Invalid authentication token in header:`,
          error,
        );
      }
    }

    // If header auth failed, try session cookie (this is our primary auth method)
    if (!isAuthenticated && sessionCookie && sessionCookie.value) {
      try {
        console.log(`[Content Route] Verifying session cookie`);
        const decodedToken = await auth.verifyIdToken(sessionCookie.value);
        userId = decodedToken.uid;
        isAuthenticated = true;
        console.log(
          `[Content Route] Session cookie auth successful. User ID: ${userId}`,
        );
      } catch (error) {
        console.warn(`[Content Route] Invalid session cookie:`, error);
      }
    }

    // If still not authenticated, fallback to anonymous
    if (!isAuthenticated) {
      console.log(`[Content Route] Using anonymous access as fallback`);
    }

    // Check access permissions - content is always readable if public or password matches
    const isPublic = crate.shared.public;

    console.log(`[Content Route] Access check - isPublic: ${isPublic}`);

    if (!crate.shared.public) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    // Access check already performed above

    // Get crate content based on its category (for regular files)
    const { buffer, crate: updatedCrate } = await getCrateContentForViewing(id);
    console.log(
      `[Content Route] Content retrieved successfully, size: ${buffer.length} bytes`,
    );

    // Determine content-type based on crate's mimeType
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": crate.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(crate.title)}"`,
      },
    });
  } catch (error) {
    console.error("[Content Route] Error retrieving crate content:", error);
    return NextResponse.json(
      { error: "Failed to retrieve crate content" },
      { status: 500 },
    );
  }
}

/**
 * API endpoint to get the content of a crate
 * POST method allows providing a password for protected crates
 */
export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { password } = body;

    console.log(`[Content Route] POST request for crate ID: ${id}`);

    // Get crate metadata
    const crate = await getCrateMetadata(id);
    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Expiration check removed as ttlDays is no longer used

    // Check authentication
    const authHeader = req.headers.get("authorization");
    let userId = "anonymous";
    let isAuthenticated = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
        isAuthenticated = true;
      } catch (error) {
        console.warn(`[Content Route] Invalid authentication token:`, error);
      }
    }

    // If header auth failed, try session cookie
    if (!isAuthenticated) {
      const cookies = req.cookies;
      const sessionCookie = cookies.get("session");

      if (sessionCookie && sessionCookie.value) {
        try {
          const decodedToken = await auth.verifyIdToken(sessionCookie.value);
          userId = decodedToken.uid;
          isAuthenticated = true;
        } catch (error) {
          console.warn(`[Content Route] Invalid session cookie:`, error);
        }
      }
    }

    // Check access permissions
    const isPublic = crate.shared.public;

    if (!isPublic) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    // Get crate content based on its category (for regular files)
    const { buffer, crate: updatedCrate } = await getCrateContentForViewing(id);

    // Set cache headers for better performance
    const headers = new Headers({
      "Content-Type": crate.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(crate.title)}"`,
      // Cache for 1 hour if public, no cache if private
      "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-cache",
    });

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error(
      "[Content Route] Error retrieving crate content via POST:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to retrieve crate content" },
      { status: 500 },
    );
  }
}
