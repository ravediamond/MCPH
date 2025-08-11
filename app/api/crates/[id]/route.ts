import { NextRequest, NextResponse } from "next/server";
import { logEvent, updateCrateMetadata } from "@/services/firebaseService";
import { getCrateContent } from "@/services/storageService";
import { getCrateMetadata } from "@/lib/services";
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

    // Check if the crate has expired
    if (crate.expiresAt && new Date() > new Date(crate.expiresAt)) {
      return NextResponse.json(
        { error: "This crate has expired" },
        { status: 410 },
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
        console.warn(`Invalid authentication token:`, error);
      }
    } else {
      console.log(`No valid Bearer token found. Using anonymous access.`);
    }

    // Check if user has access to this crate
    const isPublic = crate.shared?.public || false;

    if (!isPublic) {
      return NextResponse.json(
        { error: "You don't have permission to access this crate" },
        { status: 403 },
      );
    }

    // Prepare crate response (exclude sensitive data)
    const processTags = (tags: any): string[] => {
      if (Array.isArray(tags)) {
        return tags;
      } else if (typeof tags === "object" && tags !== null) {
        // Handle case where tags is an object - convert to array of values
        return Object.values(tags);
      } else if (typeof tags === "string") {
        return [tags];
      } else {
        return [];
      }
    };

    const crateResponse = {
      id: crate.id,
      title: crate.title,
      description: crate.description,
      category: crate.category,
      mimeType: crate.mimeType,
      size: crate.size,
      createdAt: crate.createdAt,
      expiresAt: crate.expiresAt, // Include expiration date if set
      downloadCount: crate.downloadCount,
      viewCount: crate.viewCount || 0,
      isPublic: crate.shared?.public || false,
      // isOwner field removed - using editKey system now
      metadata: crate.metadata,
      tags: processTags(crate.tags),
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

    // Check if the crate has expired
    if (crate.expiresAt && new Date() > new Date(crate.expiresAt)) {
      return NextResponse.json(
        { error: "This crate has expired" },
        { status: 410 },
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
    const isPublic = crate.shared?.public || false;

    if (!isPublic) {
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

    // Parse request body to get editKey
    const body = await req.json();
    const { editKey } = body;

    // Check editKey for delete permission
    if (!editKey || editKey !== crate.editKey) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to delete this crate. Valid editKey required.",
        },
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
    await logEvent("crate_delete", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    return NextResponse.json(
      { error: "Failed to delete crate" },
      { status: 500 },
    );
  }
}

/**
 * API endpoint to update a crate's metadata (PUT method)
 */
export async function PUT(
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

    // Parse the request body
    const body = await req.json();
    const { editKey } = body;

    // Check editKey for update permission
    if (!editKey || editKey !== crate.editKey) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to update this crate. Valid editKey required.",
        },
        { status: 403 },
      );
    }
    const updateData: Partial<typeof crate> = {};

    // Fields that can be updated
    if (body.title !== undefined && typeof body.title === "string") {
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description =
        typeof body.description === "string"
          ? body.description.trim()
          : body.description;
    }

    if (body.tags !== undefined && Array.isArray(body.tags)) {
      updateData.tags = body.tags.filter(
        (tag: any) => typeof tag === "string" && tag.trim().length > 0,
      );
    }

    if (body.metadata !== undefined && typeof body.metadata === "object") {
      updateData.metadata = body.metadata;
    }

    // Skip update if no fields were changed
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes to apply",
      });
    }

    // Update the crate metadata in Firestore
    const updatedCrate = await updateCrateMetadata(id, updateData);

    // Log the update event
    await logEvent("crate_update", id);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Crate updated successfully",
    });
  } catch (error) {
    console.error("Error updating crate:", error);
    return NextResponse.json(
      { error: "Failed to update crate" },
      { status: 500 },
    );
  }
}

/**
 * API endpoint to update a crate's metadata (PATCH method)
 */
export async function PATCH(
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

    // Parse the request body
    const body = await req.json();
    const { editKey } = body;

    // Check editKey for update permission
    if (!editKey || editKey !== crate.editKey) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to update this crate. Valid editKey required.",
        },
        { status: 403 },
      );
    }
    const updateData: Partial<typeof crate> = {};

    // Fields that can be updated
    if (body.title && typeof body.title === "string") {
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.tags !== undefined && Array.isArray(body.tags)) {
      updateData.tags = body.tags;
    }

    if (body.metadata !== undefined && typeof body.metadata === "object") {
      updateData.metadata = body.metadata;
    }

    // Update shared/public status
    if (body.shared !== undefined) {
      if (typeof body.shared === "object") {
        updateData.shared = { ...crate.shared };

        if (typeof body.shared.public === "boolean") {
          updateData.shared.public = body.shared.public;
        }
      }
    }

    // Skip update if no fields were changed
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes to apply",
        crate: {
          id: crate.id,
          title: crate.title,
          description: crate.description,
          tags: crate.tags,
          metadata: crate.metadata,
          shared: {
            public: crate.shared.public,
          },
        },
      });
    }

    // Update the crate metadata in Firestore
    const updatedCrate = await updateCrateMetadata(id, updateData);

    // Log the update event
    await logEvent("crate_update", id);

    // Return the updated crate data
    return NextResponse.json({
      success: true,
      crate: {
        id: updatedCrate.id,
        title: updatedCrate.title,
        description: updatedCrate.description,
        tags: updatedCrate.tags,
        metadata: updatedCrate.metadata,
        shared: {
          public: updatedCrate.shared.public,
        },
      },
    });
  } catch (error) {
    console.error("Error updating crate:", error);
    return NextResponse.json(
      { error: "Failed to update crate" },
      { status: 500 },
    );
  }
}
