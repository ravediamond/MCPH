import { NextRequest, NextResponse } from "next/server";
import { uploadCrate } from "@/services/storageService";
import { getUserFromRequest } from "@/lib/apiKeyAuth";

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
    // Require authentication - no more anonymous uploads
    const userInfo = await getUserFromRequest(req);
    if (!userInfo?.uid) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to upload files." },
        { status: 401 },
      );
    }
    // Check if the request is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error:
            "Your upload method isn't supported. Please use the form on our website.",
        },
        { status: 400 },
      );
    }

    // Parse the form data
    const formData = await req.formData();
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

    // Get TTL if provided
    // TTL processing removed as it's no longer supported

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
          // ttlDays removed as it's no longer supported
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
      // ttlDays removed as it's no longer supported
      metadata,
      category: fileType ? (fileType as any) : undefined,
      tags: tags, // Add the parsed tags
      // Use authenticated user ID
      ownerId: userInfo.uid,
      shared: { public: false }, // Private by default
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
        // expiresAt removed as ttlDays is no longer supported
        downloadUrl: downloadUrl, // Add the crate page URL
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Sorry, we couldn't upload your file. Please try again." },
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
