import { NextRequest, NextResponse } from "next/server";
import { uploadCrate } from "@/services/storageService";

// Helper to get client IP
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content type must be multipart/form-data" },
        { status: 400 },
      );
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Enforce 50MB file size limit
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 50MB." },
        { status: 400 },
      );
    }

    // Get TTL if provided
    const ttl = formData.get("ttl");
    const ttlHours = ttl ? parseInt(ttl.toString(), 10) : undefined;

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

    // Get fileType if provided
    const fileType = formData.get("fileType")?.toString();

    // Decide upload method based on fileType
    if (fileType === "file") {
      // Use presigned URL flow for generic/binary files
      const result = await uploadCrate(
        null, // No buffer provided means we're requesting a presigned URL
        file.name,
        file.type,
        {
          ttlDays: ttlHours ? ttlHours / 24 : undefined, // Convert hours to days if provided
        },
      );

      return NextResponse.json(
        {
          uploadUrl: result.presignedUrl,
          fileId: result.id,
          message: "Upload your file using this URL with a PUT request.",
        },
        { status: 201 },
      );
    }

    // Otherwise, do a normal upload (text, image, etc.)
    const buffer = Buffer.from(await file.arrayBuffer());

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

    const crateData = await uploadCrate(buffer, file.name, file.type, {
      ttlDays: ttlHours ? ttlHours / 24 : undefined, // Convert hours to days if provided
      metadata,
      category: fileType ? (fileType as any) : undefined,
      tags: tags, // Add the parsed tags
    });

    // Generate crate page URL
    const downloadUrl = new URL(`/crate/${crateData.id}`, req.url).toString();

    // Log the upload event
    console.log(
      `File uploaded: ${crateData.id}, name: ${file.name}, size: ${file.size}`,
    );

    return NextResponse.json(
      {
        id: crateData.id,
        fileId: crateData.id, // For consistency with other endpoints
        fileName: crateData.fileName,
        contentType: crateData.mimeType,
        size: crateData.size,
        uploadedAt: crateData.createdAt,
        expiresAt: crateData.ttlDays
          ? new Date(
              crateData.createdAt.getTime() +
                crateData.ttlDays * 24 * 60 * 60 * 1000,
            )
          : undefined,
        downloadUrl: downloadUrl, // Add the crate page URL
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    },
  });
}
