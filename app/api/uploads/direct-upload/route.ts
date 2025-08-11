import { NextRequest, NextResponse } from "next/server";
import { uploadCrate } from "@/services/storageService";
import {
  saveCrateMetadata,
  logEvent,
  incrementMetric,
} from "@/services/firebaseService";
import { CrateCategory, CrateSharing } from "@/shared/types/crate";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

/**
 * API route to handle direct file uploads
 */
export async function POST(req: NextRequest) {
  try {
    // No authentication required - allow anonymous uploads

    const formData = await req.formData();

    // Extract file from formData
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Please select a file to upload" },
        { status: 400 },
      );
    }

    // Enforce 10MB file size limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "That file is too big (limit 10 MB). Try compressing it." },
        { status: 400 },
      );
    }

    // Get additional form fields
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const fileTypeParam = formData.get("fileType") as string | null;
    const categoryParam = formData.get("category") as string | null;

    // If a category is explicitly provided, use it; otherwise, fall back to fileType or undefined
    const fileType = categoryParam || fileTypeParam || undefined;

    // Generate edit key for this crate
    const editKey = uuidv4();

    // New: Read sharing options from formData
    const isSharedStr = formData.get("isShared") as string | null;
    const passwordStr = formData.get("password") as string | null;

    const isPublic = isSharedStr === "true";
    let passwordHash: string | null = null;

    if (isPublic && passwordStr && passwordStr.length > 0) {
      passwordHash = await bcrypt.hash(passwordStr, 10);
    }

    const sharingOptions: CrateSharing = {
      public: isPublic,
      ...(passwordHash ? { passwordHash } : {}),
    };

    // Validate that title is provided
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // No storage limits for anonymous uploads

    // Convert File to Buffer for server-side processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse metadata if provided (expects JSON string or array of key-value pairs)
    let metadata: Record<string, string> | undefined = undefined;
    const metadataRaw = formData.get("metadata");
    if (metadataRaw) {
      try {
        const parsed = JSON.parse(metadataRaw.toString());
        if (Array.isArray(parsed)) {
          // Convert array of {key, value} to object
          metadata = {};
          parsed.forEach((item: any) => {
            if (item.key && typeof item.value === "string") {
              metadata![item.key] = item.value;
            }
          });
        } else if (typeof parsed === "object" && parsed !== null) {
          metadata = parsed;
        }
      } catch (e) {
        // Ignore invalid metadata
        console.warn("Invalid metadata provided, ignoring:", metadataRaw);
      }
    }

    // Parse tags if provided
    let tags: string[] | undefined = undefined;
    const tagsRaw = formData.get("tags");
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw.toString());
        // Ensure tags is an array
        if (!Array.isArray(tags)) {
          tags = [];
        }
      } catch (e) {
        console.warn("Invalid tags format, ignoring:", tagsRaw);
        tags = [];
      }
    }

    // Upload the file to storage as a crate
    const crateData = await uploadCrate(buffer, file.name, file.type, {
      title,
      description,
      category: fileType as CrateCategory,
      editKey,
      metadata,
      shared: sharingOptions, // Pass the constructed sharingOptions
    });

    // Store the crate metadata in Firestore
    await saveCrateMetadata(crateData);

    // Generate URLs
    const apiUrl = new URL(`/api/crates/${crateData.id}`, req.url).toString();
    const downloadUrl = new URL(`/crate/${crateData.id}`, req.url).toString();

    // Log the upload event
    await logEvent("crate_upload", crateData.id, undefined, {});
    await incrementMetric("crate_uploads");

    // Return the upload result
    return NextResponse.json({
      success: true,
      fileId: crateData.id,
      editKey: crateData.editKey, // Include edit key for modification
      fileName: crateData.title,
      title: crateData.title,
      description: crateData.description,
      contentType: crateData.mimeType,
      category: crateData.category,
      size: crateData.size,
      apiUrl,
      downloadUrl,
      uploadedAt:
        crateData.createdAt instanceof Date
          ? crateData.createdAt.toISOString()
          : crateData.createdAt,
    });
  } catch (error: any) {
    console.error("Error handling direct upload:", error);
    return NextResponse.json(
      {
        error: "Sorry, we couldn't upload your file. Please try again.",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
