import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata, logEvent } from "@/services/firebaseService";
import { getCrateContent } from "@/services/storageService";
import { auth } from "@/lib/firebaseAdmin";
import bcrypt from "bcrypt";

/**
 * API endpoint to get a crate by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get crate metadata from Firestore
    const crate = await getCrateMetadata(id);
    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Expiration check removed as ttlDays is no longer used

    // Check access permissions
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
        console.warn(`[DEBUG] Invalid authentication token:`, error);
      }
    } else {
      console.log(
        `[DEBUG] No valid Bearer token found. Using anonymous access.`,
      );
    }

    // Check if user has access to this crate
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
      return NextResponse.json(
        {
          error: "Password required to view this crate",
          passwordRequired: true,
        },
        { status: 401 },
      );
    }

    if (!isOwner && !isPublic && !isSharedWithUser) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    // Prepare crate response (exclude sensitive data)
    const crateResponse = {
      id: crate.id,
      title: crate.title,
      description: crate.description,
      category: crate.category,
      mimeType: crate.mimeType,
      size: crate.size,
      createdAt: crate.createdAt,
      // ttlDays and expiresAt removed as they're no longer used
      downloadCount: crate.downloadCount,
      isPublic: crate.shared.public,
      isPasswordProtected: Boolean(crate.shared.passwordHash),
      isOwner,
      metadata: crate.metadata,
      tags: crate.tags,
    };

    return NextResponse.json(crateResponse);
  } catch (error) {
    console.error("Error retrieving crate:", error);
    return NextResponse.json(
      { error: "Failed to retrieve crate" },
      { status: 500 },
    );
  }
}

/**
 * API endpoint to get the content of a crate
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const { password } = body;

    // Get crate metadata
    const crate = await getCrateMetadata(id);
    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Expiration check removed as ttlDays is no longer used

    // Check authentication
    const authHeader = req.headers.get("authorization");
    let userId = "anonymous";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn(`[DEBUG] Invalid authentication token:`, error);
      }
    } else {
      console.log(
        `[DEBUG] No valid Bearer token found. Using anonymous access.`,
      );
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

    // Get crate content based on its category
    const { buffer, crate: updatedCrate } = await getCrateContent(id);

    // Determine content-type based on crate's mimeType
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": crate.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(crate.title)}"`,
      },
    });
  } catch (error) {
    console.error("Error retrieving crate content:", error);
    return NextResponse.json(
      { error: "Failed to retrieve crate content" },
      { status: 500 },
    );
  }
}

/**
 * API endpoint to delete a crate by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get crate metadata
    const crate = await getCrateMetadata(id);
    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

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
        console.warn(`[DEBUG] Invalid authentication token:`, error);
        return NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 },
        );
      }
    } else {
      // Try to get authentication from cookies for browser-based requests
      const cookies = req.cookies;
      const sessionCookie = cookies.get("session");

      if (sessionCookie && sessionCookie.value) {
        try {
          const decodedClaims = await auth.verifySessionCookie(
            sessionCookie.value,
          );
          userId = decodedClaims.uid;
          isAuthenticated = true;
        } catch (error) {
          console.warn(`[DEBUG] Invalid session cookie:`, error);
        }
      }

      if (!isAuthenticated) {
        console.log(
          `[DEBUG] No valid authentication found. Unauthorized deletion attempt.`,
        );
        return NextResponse.json(
          { error: "Authentication required to delete a crate" },
          { status: 401 },
        );
      }
    }

    // Only the owner can delete the crate
    if (crate.ownerId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this crate" },
        { status: 403 },
      );
    }

    // Delete the crate from storage and Firestore
    const { deleteFile } = await import("@/services/storageService");
    const success = await deleteFile(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete crate" },
        { status: 500 },
      );
    }

    // Log the deletion event
    await logEvent("crate_delete", id, undefined, { userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    return NextResponse.json(
      { error: "Failed to delete crate" },
      { status: 500 },
    );
  }
}
