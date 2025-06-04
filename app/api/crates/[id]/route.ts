import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata, logEvent } from "@/services/firebaseService";
import { getCrateContent } from "@/services/storageService";
import { auth } from "@/lib/firebaseAdmin";

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

    // Check if crate has expired
    const now = new Date();
    const expirationDate = new Date(crate.createdAt);
    expirationDate.setDate(expirationDate.getDate() + crate.ttlDays);

    if (now > expirationDate) {
      return NextResponse.json(
        { error: "This crate has expired" },
        { status: 410 }, // Gone
      );
    }

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
    const isSharedWithUser =
      Array.isArray(crate.shared.sharedWith) &&
      crate.shared.sharedWith.includes(userId);

    // If the crate is public, password-protected, and the user is not the owner,
    // require a password to view.
    if (isPublic && crate.shared.passwordProtected && !isOwner) {
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
      ttlDays: crate.ttlDays,
      expiresAt: expirationDate,
      downloadCount: crate.downloadCount,
      isPublic: crate.shared.public,
      isPasswordProtected: crate.shared.passwordProtected,
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

    // Check if crate has expired
    const now = new Date();
    const expirationDate = new Date(crate.createdAt);
    expirationDate.setDate(expirationDate.getDate() + crate.ttlDays);

    if (now > expirationDate) {
      return NextResponse.json(
        { error: "This crate has expired" },
        { status: 410 }, // Gone
      );
    }

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
    const isSharedWithUser =
      Array.isArray(crate.shared.sharedWith) &&
      crate.shared.sharedWith.includes(userId);

    // Check password if required and not the owner
    if (!isOwner && crate.shared.passwordProtected) {
      // In a real implementation, you would compare hashed passwords
      // This is a simplified example - you should use proper password hashing
      if (!password) {
        return NextResponse.json(
          { error: "This crate requires a password" },
          { status: 401 },
        );
      }

      // TODO: Implement proper password verification here
      // For now, we'll assume any provided password works
    }

    if (!isOwner && !isPublic && !isSharedWithUser) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
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
          { status: 401 }
        );
      }
    } else {
      // Try to get authentication from cookies for browser-based requests
      const cookies = req.cookies;
      const sessionCookie = cookies.get('session');

      if (sessionCookie && sessionCookie.value) {
        try {
          const decodedClaims = await auth.verifySessionCookie(sessionCookie.value);
          userId = decodedClaims.uid;
          isAuthenticated = true;
        } catch (error) {
          console.warn(`[DEBUG] Invalid session cookie:`, error);
        }
      }

      if (!isAuthenticated) {
        console.log(`[DEBUG] No valid authentication found. Unauthorized deletion attempt.`);
        return NextResponse.json(
          { error: "Authentication required to delete a crate" },
          { status: 401 }
        );
      }
    }

    // Only the owner can delete the crate
    if (crate.ownerId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this crate" },
        { status: 403 }
      );
    }

    // Delete the crate from storage and Firestore
    const { deleteFile } = await import("@/services/storageService");
    const success = await deleteFile(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete crate" },
        { status: 500 }
      );
    }

    // Log the deletion event
    await logEvent("crate_delete", id, undefined, { userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    return NextResponse.json(
      { error: "Failed to delete crate" },
      { status: 500 }
    );
  }
}
