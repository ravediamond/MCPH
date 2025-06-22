import { NextRequest, NextResponse } from "next/server";
import { uploadCrate } from "@/services/storageService";
import { CrateCategory, CrateSharing } from "@/shared/types/crate";
import bcrypt from "bcrypt";
import { auth } from "@/lib/firebaseAdmin";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
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

    // Extract authentication token if present
    const authHeader = req.headers.get("authorization");
    let userId = "anonymous";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.warn(
          "Invalid authentication token, using anonymous user",
          error,
        );
      }
    }

    // Get basic crate metadata
    const title = formData.get("title")?.toString() || file.name;
    const description = formData.get("description")?.toString();
    const categoryStr = formData.get("category")?.toString();
    const tagsStr = formData.get("tags")?.toString();
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()) : undefined;

    // Validate and set category
    let category: CrateCategory;
    if (
      categoryStr &&
      Object.values(CrateCategory).includes(categoryStr as CrateCategory)
    ) {
      category = categoryStr as CrateCategory;
    } else {
      // Determine default category based on mime type or extension
      if (file.type.startsWith("image/")) {
        category = CrateCategory.IMAGE;
      } else if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        category = CrateCategory.MARKDOWN;
      } else if (file.type.includes("json") || file.name.endsWith(".json")) {
        // Added check for .json extension
        category = CrateCategory.JSON;
      } else if (
        file.type.includes("text") || // Broader check for text-based files
        file.name.endsWith(".txt") ||
        file.name.endsWith(".js") ||
        file.name.endsWith(".ts") ||
        file.name.endsWith(".py") || // Example: Python
        file.name.endsWith(".java") // Example: Java
      ) {
        category = CrateCategory.CODE;
      } else {
        category = CrateCategory.BINARY;
      }
    }

    // Parse sharing settings
    const isPublic = formData.get("public") === "true";
    const passwordStr = formData.get("password")?.toString();
    // Simplified for v1: No per-user sharing lists
    // const sharedWithStr = formData.get("sharedWith")?.toString();
    // const sharedWith = sharedWithStr
    //   ? sharedWithStr.split(",").map((uid) => uid.trim())
    //   : undefined;

    // If the crate is public and the user is authenticated, check shared crates limit
    if (isPublic && userId !== "anonymous") {
      const { hasReachedSharedCratesLimit } = await import(
        "@/services/firebaseService"
      );
      const limitReached = await hasReachedSharedCratesLimit(userId);

      if (limitReached) {
        return NextResponse.json(
          {
            error:
              "Shared crates limit reached. You can share a maximum of 50 crates. Please delete some shared crates before sharing new ones.",
          },
          { status: 403 },
        );
      }
    }

    const sharing: CrateSharing = {
      public: isPublic,
      ...(passwordStr ? { passwordHash: await bcrypt.hash(passwordStr, 10) } : {}),
    };

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

    // Upload the file and create the crate
    const buffer = Buffer.from(await file.arrayBuffer());
    const crate = await uploadCrate(buffer, file.name, file.type, {
      title,
      description,
      category,
      tags,
      ownerId: userId,
      shared: sharing,
      metadata,
    });

    // Generate crate page URL
    const crateUrl = new URL(`/crate/${crate.id}`, req.url).toString();

    // Log the upload event
    console.log(
      `Crate uploaded: ${crate.id}, name: ${file.name}, size: ${file.size}, category: ${category}`,
    );

    return NextResponse.json(
      {
        id: crate.id,
        title: crate.title,
        description: crate.description,
        category: crate.category,
        mimeType: crate.mimeType,
        size: crate.size,
        crateUrl,
        createdAt: crate.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading crate:", error);
    return NextResponse.json(
      { error: "Failed to upload crate" },
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
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
    },
  });
}
