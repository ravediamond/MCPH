import { NextRequest, NextResponse } from "next/server";
import { uploadCrate } from "@/services/storageService";
import { saveCrateMetadata, logEvent, incrementMetric, getUserStorageUsage } from "@/services/firebaseService";
import { DATA_TTL } from "@/app/config/constants";
import { CrateCategory } from "@/app/types/crate";

/**
 * API route to handle direct file uploads
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extract file from formData
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Enforce 50MB file size limit
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 50MB." },
        { status: 400 },
      );
    }

    // Get additional form fields
    const ttlDaysParam = formData.get("ttlDays") as string | null;
    const ttlDays = ttlDaysParam
      ? parseInt(ttlDaysParam, 10)
      : DATA_TTL.DEFAULT_DAYS;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const userId = formData.get("userId") as string;
    const fileTypeParam = formData.get("fileType") as string | null;
    const fileType = fileTypeParam || undefined; // Convert null to undefined

    // Validate that title is provided
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Enforce per-user storage limit (500MB)
    if (userId) {
      const storage = await getUserStorageUsage(userId);
      if (storage.remaining < file.size) {
        return NextResponse.json(
          {
            error:
              "Storage quota exceeded. You have " +
              (storage.remaining / 1024 / 1024).toFixed(2) +
              " MB remaining.",
          },
          { status: 403 },
        );
      }
    }

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

    // Upload the file to storage as a crate
    const crateData = await uploadCrate(
      buffer,
      file.name,
      file.type,
      {
        title,
        description,
        category: fileType as CrateCategory,
        ownerId: userId || "anonymous",
        ttlDays,
        metadata,
      }
    );

    // --- VECTOR EMBEDDING GENERATION ---
    let embedding: number[] | undefined = undefined;
    try {
      const metadataObj = crateData.metadata || {};
      const metaString = Object.entries(metadataObj)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" ");
      const concatText = [title, description, metaString]
        .filter(Boolean)
        .join(" ");
      if (concatText.trim().length > 0) {
        const { getEmbedding } = await import("@/lib/vertexAiEmbedding");
        embedding = await getEmbedding(concatText);
      }
    } catch (e) {
      console.error("Failed to generate embedding:", e);
    }

    // Store the crate metadata in Firestore, including embedding if available
    await saveCrateMetadata({
      ...crateData,
      ...(embedding ? { embedding } : {}),
    });

    // Generate URLs
    const apiUrl = new URL(`/api/crates/${crateData.id}`, req.url).toString();
    const downloadUrl = new URL(`/crate/${crateData.id}`, req.url).toString();

    // Log the upload event
    await logEvent(
      "crate_upload",
      crateData.id,
      undefined,
      userId ? { userId } : undefined,
    );
    await incrementMetric("crate_uploads");

    // Return the upload result with compression info if available
    return NextResponse.json({
      success: true,
      fileId: crateData.id,
      fileName: crateData.title,
      title: crateData.title,
      description: crateData.description,
      contentType: crateData.mimeType,
      category: crateData.category,
      size: crateData.size,
      apiUrl,
      downloadUrl,
      uploadedAt: crateData.createdAt instanceof Date ? crateData.createdAt.toISOString() : crateData.createdAt,
      expiresAt: crateData.ttlDays ? new Date(new Date(crateData.createdAt).getTime() + crateData.ttlDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
      compressed: crateData.compressed,
      compressionRatio: crateData.compressionRatio,
    });
  } catch (error: any) {
    console.error("Error handling direct upload:", error);
    return NextResponse.json(
      { error: "Upload failed", message: error.message },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
