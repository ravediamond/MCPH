import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import {
  getCrateMetadata,
  logEvent,
  updateCrateSharing,
} from "@/services/firebaseService";

/**
 * API endpoint to update sharing settings for a crate
 * This provides a unified approach to manage all sharing settings from one place
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Handle params as a Promise in Next.js 15+
    const { id } = await context.params;
    const {
      public: isPublic,
      passwordProtected,
      password,
      removePassword,
      sharedWith,
      generateLink = true,
    } = await req.json();

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
        return NextResponse.json(
          { error: "Authentication required to update sharing settings" },
          { status: 401 },
        );
      }
    }

    // Get crate metadata
    const crate = await getCrateMetadata(id);
    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Only the owner can update sharing settings
    if (crate.ownerId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this crate" },
        { status: 403 },
      );
    }

    // Prepare sharing settings update
    const sharingSettings: any = {};

    // Update public sharing status if provided
    if (typeof isPublic === "boolean") {
      sharingSettings.public = isPublic;
    }

    // Update password protection status
    if (typeof passwordProtected === "boolean") {
      sharingSettings.passwordProtected = passwordProtected;
    }

    // Handle password updates (if we want to implement password hashing, do it here)
    if (password) {
      // In a real implementation, you would hash the password here
      // For this example, we're storing the password directly
      sharingSettings.passwordHash = password;
      sharingSettings.passwordSalt = null; // Not using salt for simplicity
      sharingSettings.passwordProtected = true;
    }

    // Handle password removal
    if (removePassword) {
      sharingSettings.passwordHash = null;
      sharingSettings.passwordSalt = null;
      sharingSettings.passwordProtected = false;
    }

    // Update shared with users if provided
    if (sharedWith) {
      sharingSettings.sharedWith = sharedWith;
    }

    // Update sharing settings
    const result = await updateCrateSharing(id, userId, sharingSettings);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update sharing settings" },
        { status: 400 },
      );
    }

    // Log the sharing event
    await logEvent("crate_share_update", id, undefined, {
      userId,
      isPublic: sharingSettings.public,
      passwordProtected: sharingSettings.passwordProtected,
    });

    // Generate response with share URL
    const baseUrl = req.headers.get("origin") || "https://mcphub.dev";
    const shareUrl = `${baseUrl}/crate/${id}`;

    // Return the updated sharing information
    return NextResponse.json({
      id,
      isShared: sharingSettings.public ?? crate.shared.public,
      passwordProtected:
        sharingSettings.passwordProtected ?? crate.shared.passwordProtected,
      shareUrl,
      message: "Sharing settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating crate sharing settings:", error);
    return NextResponse.json(
      { error: "Failed to update crate sharing settings" },
      { status: 500 },
    );
  }
}
