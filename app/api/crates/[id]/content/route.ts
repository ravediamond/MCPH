import { NextRequest, NextResponse } from "next/server";
import {
  getCrateMetadata,
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
} from "@/services/firebaseService";
import { getCrateContent } from "@/services/storageService";
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
      `[Content Route] Found crate: ${crate.title}, Owner: ${crate.ownerId}, Public: ${crate.shared.public}`,
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

    // Check access permissions
    const isOwner = crate.ownerId === userId;
    const isPublic = crate.shared.public;
    // Simplified for v1: No per-user sharing, only public/private
    const isSharedWithUser = false; // Removed sharedWith array in v1

    console.log(
      `[Content Route] Access check - isOwner: ${isOwner}, isPublic: ${isPublic}, isSharedWithUser: ${isSharedWithUser}`,
    );
    console.log(
      `[Content Route] Current user ID: ${userId}, Crate owner ID: ${crate.ownerId}`,
    );

    if (!isOwner && !crate.shared.public) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    if (!isOwner && crate.shared.passwordHash) {
      const supplied = req.headers.get("x-crate-pass");
      if (!supplied) {
        return NextResponse.json(
          { error: "Password required to view this crate" },
          { status: 401 },
        );
      }
      const match = await bcrypt.compare(supplied, crate.shared.passwordHash);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 },
        );
      }
    }

    if (!isOwner && !isPublic && !isSharedWithUser) {
      console.log(
        `[Content Route] Permission denied. Not owner, not public, not shared with user.`,
      );
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    // Handle feedback templates differently - get data from Firestore
    if (crate.category === CrateCategory.RECIPE) {
      console.log(
        `[Content Route] Fetching feedback template data for ID: ${id}`,
      );

      try {
        const feedbackDoc = await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(id)
          .get();

        if (!feedbackDoc.exists) {
          console.log(
            `[Content Route] Feedback template not found with ID: ${id}`,
          );
          return NextResponse.json(
            { error: "Feedback template not found" },
            { status: 404 },
          );
        }

        const feedbackData = feedbackDoc.data();
        const contentBuffer = Buffer.from(
          JSON.stringify(feedbackData, null, 2),
          "utf-8",
        );

        console.log(
          `[Content Route] Feedback template content retrieved successfully, size: ${contentBuffer.length} bytes`,
        );

        return new NextResponse(contentBuffer, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `inline; filename="${encodeURIComponent(crate.title)}.json"`,
          },
        });
      } catch (error) {
        console.error(
          "[Content Route] Error retrieving feedback template:",
          error,
        );
        return NextResponse.json(
          { error: "Failed to retrieve feedback template data" },
          { status: 500 },
        );
      }
    }

    // Get crate content based on its category (for regular files)
    const { buffer, crate: updatedCrate } = await getCrateContent(id);
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
    const isOwner = crate.ownerId === userId;
    const isPublic = crate.shared.public;
    // Simplified for v1: No per-user sharing, only public/private
    const isSharedWithUser = false; // Removed sharedWith array in v1

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    if (!isOwner && crate.shared.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: "This crate requires a password" },
          { status: 401 },
        );
      }
      const match = await bcrypt.compare(password, crate.shared.passwordHash);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 },
        );
      }
    }

    // Handle feedback templates differently - get data from Firestore
    if (crate.category === CrateCategory.RECIPE) {
      console.log(
        `[Content Route] POST Fetching feedback template data for ID: ${id}`,
      );

      try {
        const feedbackDoc = await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(id)
          .get();

        if (!feedbackDoc.exists) {
          console.log(
            `[Content Route] POST Feedback template not found with ID: ${id}`,
          );
          return NextResponse.json(
            { error: "Feedback template not found" },
            { status: 404 },
          );
        }

        const feedbackData = feedbackDoc.data();
        const contentBuffer = Buffer.from(
          JSON.stringify(feedbackData, null, 2),
          "utf-8",
        );

        // Set cache headers for better performance
        const headers = new Headers({
          "Content-Type": "application/json",
          "Content-Disposition": `inline; filename="${encodeURIComponent(crate.title)}.json"`,
          // Cache for 1 hour if public, no cache if private
          "Cache-Control": isPublic
            ? "public, max-age=3600"
            : "private, no-cache",
        });

        return new NextResponse(contentBuffer, { headers });
      } catch (error) {
        console.error(
          "[Content Route] POST Error retrieving feedback template:",
          error,
        );
        return NextResponse.json(
          { error: "Failed to retrieve feedback template data" },
          { status: 500 },
        );
      }
    }

    // Get crate content based on its category (for regular files)
    const { buffer, crate: updatedCrate } = await getCrateContent(id);

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
