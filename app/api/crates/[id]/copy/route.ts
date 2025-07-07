import { NextRequest, NextResponse } from "next/server";
import { getCrateMetadata } from "@/lib/services";
import { getCrateContent, uploadCrate } from "@/services/storageService";
import { auth } from "@/lib/firebaseAdmin";

/**
 * API endpoint to copy a crate to the user's collection
 * Based on the MCP crates_copy tool functionality
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
        console.warn(`Invalid authentication token:`, error);
      }
    }

    // Require authentication for this operation
    if (!isAuthenticated || userId === "anonymous") {
      return NextResponse.json(
        {
          error: "You need to be logged in to copy crates to your collection.",
        },
        { status: 401 },
      );
    }

    // Get the source crate metadata
    const sourceCrate = await getCrateMetadata(id);
    if (!sourceCrate) {
      return NextResponse.json({ error: "Crate not found." }, { status: 404 });
    }

    // Check if the crate is already owned by the user
    if (sourceCrate.ownerId === userId) {
      return NextResponse.json(
        { error: "This crate is already in your collection." },
        { status: 400 },
      );
    }

    // Check if the crate is accessible to the user
    const isPublic = sourceCrate.shared?.public === true;
    const isAnonymous = sourceCrate.ownerId === "anonymous";

    if (!isPublic && !isAnonymous) {
      return NextResponse.json(
        { error: "You don't have permission to copy this crate." },
        { status: 403 },
      );
    }

    // Get the crate content
    const { buffer, crate } = await getCrateContent(id);

    // Prepare new crate data for the copy
    const newCrateData = {
      title: sourceCrate.title,
      description: sourceCrate.description,
      ownerId: userId,
      category: sourceCrate.category,
      tags: sourceCrate.tags,
      metadata: sourceCrate.metadata,
      shared: {
        public: false, // Make the copy private by default
      },
    };

    // Upload the copy with the new owner
    const newCrate = await uploadCrate(
      buffer,
      sourceCrate.fileName,
      sourceCrate.mimeType,
      newCrateData,
    );

    return NextResponse.json({
      success: true,
      message: `Crate copied successfully to your collection. New crate ID: ${newCrate.id}`,
      crate: {
        id: newCrate.id,
        title: newCrate.title,
        description: newCrate.description,
        category: newCrate.category,
      },
    });
  } catch (error) {
    console.error("Error copying crate:", error);
    return NextResponse.json(
      {
        error: `Failed to copy crate: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
