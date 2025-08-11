import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import {
  getCrateMetadata,
  logEvent,
  updateCrateSharing,
} from "@/services/firebaseService";
import bcrypt from "bcrypt";

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
      password,
      public: isPublic = true,
      passwordProtected = false,
      removePassword = false,
      editKey,
    } = await req.json();

    // Get crate metadata
    const crate = await getCrateMetadata(id);
    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Check editKey for sharing permission
    if (!editKey || editKey !== crate.editKey) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to update this crate. Valid editKey required.",
        },
        { status: 403 },
      );
    }

    // Prepare sharing settings update
    const sharingSettings: any = {
      public: isPublic,
    };

    if (passwordProtected && password && password.length > 0) {
      sharingSettings.passwordHash = await bcrypt.hash(password, 10);
    } else if (!passwordProtected || removePassword) {
      sharingSettings.passwordHash = null;
    }

    // Simplified for v1: No per-user sharing
    // Update shared with users if provided
    // if (sharedWith) {
    //   sharingSettings.sharedWith = sharedWith;
    // }

    // Update sharing settings
    const result = await updateCrateSharing(id, editKey, sharingSettings);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update sharing settings" },
        { status: 400 },
      );
    }

    // Log the sharing event
    await logEvent("crate_share_update", id, undefined, {
      isPublic,
    });

    // Generate response with share URL
    const baseUrl = req.headers.get("origin") || "https://mcph.dev";
    const shareUrl = `${baseUrl}/crate/${id}`;

    // Return the updated sharing information
    return NextResponse.json({
      id,
      isShared: isPublic,
      shareUrl,
      passwordProtected: Boolean(sharingSettings.passwordHash),
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
