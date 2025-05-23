import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/services/storageService";

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

    // Get parentId if provided
    const parentId = formData.get("parentId")?.toString() || undefined;

    // Decide upload method based on fileType
    if (fileType === "file") {
      // Use presigned URL flow for generic/binary files
      const { generateUploadUrl } = await import("@/services/storageService");
      const { url, fileId, gcsPath } = await generateUploadUrl(
        file.name,
        file.type,
        ttlHours,
      );
      return NextResponse.json(
        {
          uploadUrl: url,
          fileId,
          gcsPath,
          message: "Upload your file using this URL with a PUT request.",
        },
        { status: 201 },
      );
    }

    // Otherwise, do a normal upload (text, image, etc.)
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileData = await uploadFile(
      buffer,
      file.name,
      file.type,
      ttlHours,
      undefined, // title
      undefined, // description
      fileType, // pass fileType
      metadata, // pass metadata
      parentId, // pass parentId
    );

    // Generate download page URL
    const downloadUrl = new URL(`/download/${fileData.id}`, req.url).toString();

    // Log the upload event
    console.log(
      `File uploaded: ${fileData.id}, name: ${file.name}, size: ${file.size}`,
    );

    return NextResponse.json(
      {
        id: fileData.id,
        fileId: fileData.id, // For consistency with other endpoints
        fileName: fileData.fileName,
        contentType: fileData.contentType,
        size: fileData.size,
        uploadedAt: fileData.uploadedAt,
        expiresAt: fileData.expiresAt,
        downloadUrl: downloadUrl, // Add the download page URL
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
