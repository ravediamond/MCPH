import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import {
  requireApiKeyAuth,
  apiKeyAuthMiddleware,
  AuthenticatedRequest,
} from "../../lib/apiKeyAuth";
import {
  getCrateMetadata,
  CRATES_COLLECTION,
  incrementUserToolUsage,
  db,
} from "../../services/firebaseService";
import {
  getSignedDownloadUrl,
  getCrateContent,
  generateUploadUrl,
  uploadCrate,
  deleteCrate,
} from "../../services/storageService";
import util from "util";
import { Crate, CrateCategory } from "../../shared/types/crate";

// Global error handlers for better diagnostics
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Unhandled Rejection at:",
    promise,
    "reason:",
    reason instanceof Error
      ? reason.stack || reason.message
      : util.inspect(reason, { depth: null }),
  );
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(
    "Uncaught Exception:",
    err instanceof Error
      ? err.stack || err.message
      : util.inspect(err, { depth: null }),
  );
  process.exit(1);
});

// Load environment variables
// Note: When running with npm run dev, this is loaded automatically through the -r dotenv/config flag
// This is here for the production build or direct node execution
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "../.env.local" });
} else {
  dotenv.config({ path: ".env.local" });
}

const app = express();
app.use(express.json());

// In-memory IP-based request throttling
// Map of IP addresses to {count, timestamp}
const ipThrottleMap = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS_PER_WINDOW = 50; // Maximum requests per window
const THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create a typed IP throttling middleware
const ipThrottlingMiddleware = function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Skip throttling for specific IPs if needed
  // if (ip === 'trusted-ip') return next();

  const now = Date.now();
  const ipData = ipThrottleMap.get(ip);

  if (!ipData) {
    // First request from this IP
    ipThrottleMap.set(ip, { count: 1, timestamp: now });
    return next();
  }

  // Reset counter if outside the window
  if (now - ipData.timestamp > THROTTLE_WINDOW_MS) {
    ipThrottleMap.set(ip, { count: 1, timestamp: now });
    return next();
  }

  // Increment counter if within the window
  ipData.count += 1;

  // Check if over limit
  if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Too many requests. Please try again later.",
      },
      id: null,
    });
  }

  // Update the map
  ipThrottleMap.set(ip, ipData);
  next();
};

// Clean up the throttle map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipThrottleMap.entries()) {
    if (now - data.timestamp > THROTTLE_WINDOW_MS) {
      ipThrottleMap.delete(ip);
    }
  }
}, THROTTLE_WINDOW_MS);

// IP throttling middleware
app.use(ipThrottlingMiddleware as express.RequestHandler);

// Add CORS headers for API endpoints
app.use(function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

// Zod schemas for tool arguments
const ListCratesParams = z.object({});
const GetCrateParams = z.object({
  id: z.string(),
});
const GetCrateDownloadLinkParams = z.object({
  id: z.string(),
  expiresInSeconds: z.number().int().min(1).max(86400).optional(),
});
const GoogleOAuthParams = z.object({
  scope: z.string().optional().default("profile email"),
  state: z.string().optional(),
  redirectUri: z.string().optional(),
});
const UploadCrateParams = z
  .object({
    fileName: z.string(),
    contentType: z.string(),
    data: z.string().optional(), // base64-encoded if present
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.nativeEnum(CrateCategory).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    isPublic: z.boolean().optional().default(false),
    password: z.string().optional(),
  })
  .refine((data) => !(data.isPublic && data.password), {
    message: "A crate cannot be both public and password-protected",
    path: ["isPublic", "password"],
  });
const ShareCrateParams = z
  .object({
    id: z.string(),
    public: z.boolean().optional(),
    // Removed for v1 simplification:
    // sharedWith: z.array(z.string()).optional(),
    passwordProtected: z.boolean().optional(),
  })
  .refine((data) => !(data.public && data.passwordProtected), {
    message: "A crate cannot be both public and password-protected",
    path: ["public", "passwordProtected"],
  });
const UnshareCrateParams = z.object({
  id: z.string(),
});
const DeleteCrateParams = z.object({
  id: z.string(),
});
const SearchParams = z.object({
  query: z.string(),
});

// Helper to create a new MCP server instance with real tools
function getServer(req?: AuthenticatedRequest) {
  const server = new McpServer({
    name: "MCPH-mcp-server",
    description: "MCPH server for handling crates and tools.",
    version: "1.0.0",
  });

  // --- WRAP TOOL REGISTRATION FOR USAGE TRACKING ---
  const originalTool = server.tool;
  server.tool = function (...args: any[]) {
    const toolName = args[0];
    let handler: any;
    if (args.length === 3) {
      handler = args[2];
    } else if (args.length >= 4) {
      handler = args[args.length - 1];
    }
    if (!handler) return (originalTool as any).apply(server, args);
    const wrappedHandler = async (toolArgs: any, ...rest: any[]) => {
      try {
        if (req?.user && req.user.userId) {
          const userId = req.user.userId;
          // Log the tool name and client for debugging, but only pass userId to incrementUserToolUsage
          console.log(
            `Tool ${toolName} called by user ${userId} from client ${req.clientName || "unknown"}`,
          );
          const usage = await incrementUserToolUsage(userId);
          console.log(
            `Tool usage incremented for user ${userId}: ${toolName}, client: ${req.clientName || "unknown"}, count: ${usage.count}, remaining: ${usage.remaining}`,
          );
        } else {
          console.warn(
            "DEBUG tool usage tracking: req.user or req.user.userId missing",
          );
        }
      } catch (err) {
        console.error("Error incrementing tool usage:", err);
      }
      return handler(toolArgs, ...rest);
    };
    if (args.length === 3) {
      args[2] = wrappedHandler;
    } else {
      args[args.length - 1] = wrappedHandler;
    }
    return (originalTool as any).apply(server, args);
  };

  // google_oauth
  server.tool(
    "google_oauth",
    {}, // Empty object makes it callable with no arguments
    {
      description:
        "Initiates a Google OAuth flow. Returns a URL that the user can visit to authenticate with Google and grant access to the requested scopes.",
    },
    async (_: unknown, extra: any) => {
      // Default base URL from environment variable or hardcoded fallback
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mcph.io";

      // Generate a random state parameter
      const oauthState = randomUUID();

      // Use default redirect URI that matches the authorized redirect URIs in Google Cloud Console
      // For local development, we need to use port 5000 as that's what's authorized
      let callbackUrl: string;
      if (baseUrl.includes("localhost")) {
        // For localhost, use port 5000 as configured in Google Cloud Console
        callbackUrl = "http://localhost:5000";
      } else if (baseUrl.includes("mcph-dev")) {
        // For development environment
        callbackUrl = "https://mcph-dev.firebaseapp.com/__/auth/handler";
      } else {
        // For production or other environments
        callbackUrl = `${baseUrl}/auth/callback`;
      }

      // Default scope for Google OAuth
      const scope = "profile email";

      // Configure OAuth parameters
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: scope,
        access_type: "offline",
        state: oauthState,
        prompt: "consent",
      });

      // Construct the Google OAuth URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      return {
        content: [
          {
            type: "text",
            text: `Please visit the following URL to authenticate with Google:\n\n${authUrl}\n\nAfter authentication, you will be redirected to ${callbackUrl}.`,
          },
        ],
        authUrl,
        state: oauthState,
      };
    },
  );

  // crates/list
  server.tool(
    "crates_list",
    {},
    {
      description:
        "Lists all available crates in the system, including their metadata, ID, title, description, category, content type, tags, and expiration date.",
    },
    async (_: unknown, extra?: any) => {
      const snapshot = await db
        .collection(CRATES_COLLECTION)
        .where(
          "createdAt",
          ">",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ) // Filter to last 30 days
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const crates: Array<
        Partial<Crate> & {
          id: string;
          expiresAt: string | null;
          contentType?: string;
          category?: CrateCategory;
        }
      > = snapshot.docs.map((doc) => {
        // Get document data properly
        const data = doc.data() as any;
        const id = doc.id;

        // Filter out unwanted properties using safe type casting
        const { embedding, searchField, gcsPath, ...filteredData } = data;

        // Access potentially undefined properties safely
        const mimeType = data.mimeType;
        const category = data.category;

        return {
          id: doc.id,
          ...filteredData,
          contentType: mimeType, // Add contentType
          category: category, // Add category
          expiresAt: null, // ttlDays is no longer supported
        };
      });

      return {
        crates,
        content: [
          {
            type: "text",
            text: crates
              .map(
                (c) =>
                  `ID: ${c.id}\nTitle: ${c.title || "Untitled"}\n` +
                  `Description: ${c.description || "No description"}\n` +
                  `Category: ${c.category || "N/A"}\n` +
                  `Content Type: ${c.contentType || "N/A"}\n` +
                  `Tags: ${Array.isArray(c.tags) ? c.tags.join(", ") : "None"}\n`,
              )
              .join("\n---\n"),
          },
        ],
      };
    },
  );

  // crates/get
  server.tool(
    "crates_get",
    GetCrateParams.shape,
    {
      description:
        "Retrieves the content of a specific crate by its ID. Returns text content for code, markdown, and JSON, image data for images, and directs to download links for binary files.",
    },
    async ({ id }: { id: string }, extra: any) => {
      const meta = await getCrateMetadata(id);
      if (!meta) {
        throw new Error("Crate not found");
      }

      // Default expiration time (5 minutes)
      const exp = 300;

      // Special handling for BINARY category - direct user to use crates_get_download_link instead
      if (meta.category === CrateCategory.BINARY) {
        return {
          content: [
            {
              type: "text",
              text: `This crate contains ${meta.category.toLowerCase()} content. Please use the 'crates_get_download_link' tool to get a download link for this content.\n\nExample: { "id": "${meta.id}" }`,
            },
          ],
        };
      }

      // Get pre-signed URL regardless of type
      const url = await getSignedDownloadUrl(
        meta.id,
        meta.title,
        Math.ceil(exp / 60),
      );

      // Handle images differently with image content type
      if (meta.category === CrateCategory.IMAGE) {
        try {
          // Fetch the image content
          const result = await getCrateContent(meta.id);

          // Convert to base64
          const base64 = result.buffer.toString("base64");

          // Determine the correct MIME type or default to image/png
          const mimeType = meta.mimeType || "image/png";

          return {
            content: [
              {
                type: "image",
                data: base64,
                mimeType: mimeType,
              },
            ],
          };
        } catch (error) {
          console.error(`Error fetching image content for crate ${id}:`, error);
          // Fallback to URL if fetching content fails
          return {
            content: [
              {
                type: "text",
                text: `![${meta.title || "Image"}](${url})`,
              },
            ],
          };
        }
      }
      // For text-based categories like CODE, JSON, MARKDOWN, etc., return the actual content
      else {
        try {
          // Fetch the content
          const result = await getCrateContent(meta.id);

          // Convert buffer to text
          const textContent = result.buffer.toString("utf-8");

          return {
            content: [
              {
                type: "text",
                text: textContent,
              },
            ],
          };
        } catch (error) {
          console.error(`Error fetching content for crate ${id}:`, error);
          // Fallback to URL if fetching content fails
          return {
            resources: [
              {
                uri: `crate://${meta.id}`,
                contents: [
                  {
                    uri: url,
                    title: meta.title,
                    description: meta.description,
                    contentType: meta.mimeType,
                  },
                ],
              },
            ],
            content: [
              {
                type: "text",
                text: `Crate "${meta.title}" is available at crate://${meta.id}`,
              },
            ],
          };
        }
      }
    },
  );

  // crates/get_download_link
  server.tool(
    "crates_get_download_link",
    GetCrateDownloadLinkParams.shape,
    {
      description:
        "Generates a pre-signed download URL for a crate, particularly useful for binary or large files. The URL defaults to 24 hours validity unless specified otherwise, and the response includes expiration information.",
    },
    async (
      { id, expiresInSeconds }: { id: string; expiresInSeconds?: number },
      extra: any,
    ) => {
      const meta = await getCrateMetadata(id);
      if (!meta) {
        throw new Error("Crate not found");
      }

      // Default expiration time (24 hours) if not specified
      const exp =
        typeof expiresInSeconds === "number"
          ? Math.max(1, Math.min(86400, expiresInSeconds))
          : 86400; // Default to 24 hours

      // Get pre-signed URL regardless of type
      const url = await getSignedDownloadUrl(
        meta.id,
        meta.title,
        Math.ceil(exp / 60),
      );

      return {
        content: [
          {
            type: "text",
            text: `Download link for crate ${meta.title}: ${url}\nThis link is valid for ${Math.round(exp / 3600)} hours and ${Math.round((exp % 3600) / 60)} minutes.`,
          },
        ],
        url,
        validForSeconds: exp,
        expiresAt: new Date(Date.now() + exp * 1000).toISOString(),
      };
    },
  );

  // crates/search
  server.tool(
    "crates_search",
    SearchParams.shape,
    {
      description:
        "Searches for crates by text matching. Returns crates that match the query in title, description, or tags.",
    },
    async ({ query }: { query: string }) => {
      // Simplified for v1 - text search only (no vector search)
      let topK = 10;
      const cratesRef = db.collection(CRATES_COLLECTION);
      // Text-based search only (searchField prefix, case-insensitive)
      const textQuery = query.toLowerCase();
      const classicalSnapshot = await cratesRef
        .where("searchField", ">=", textQuery)
        .where("searchField", "<=", textQuery + "\uf8ff")
        .limit(topK)
        .get();
      const allCrates = classicalSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Format crates to match the list schema
      const crates: Array<
        Partial<Crate> & {
          id: string;
          expiresAt: string | null;
          contentType?: string;
          category?: CrateCategory;
        }
      > = allCrates.map((doc) => {
        // Get document data properly
        const data = doc as any;
        const id = doc.id;

        // Extract remaining properties safely (they might not all exist)
        const { embedding, searchField, gcsPath, ...filteredData } = data;

        // Access potentially undefined properties safely
        const mimeType = data.mimeType;
        const category = data.category;

        return {
          id,
          ...filteredData,
          contentType: mimeType, // Use safely extracted mimeType
          category: category, // Use safely extracted category
          expiresAt: null, // ttlDays is no longer supported
        };
      });

      return {
        crates,
        content: [
          {
            type: "text",
            text:
              crates.length > 0
                ? crates
                    .map(
                      (c) =>
                        `ID: ${c.id}\nTitle: ${c.title || "Untitled"}\n` +
                        `Description: ${c.description || "No description"}\n` +
                        `Category: ${c.category || "N/A"}\n` +
                        `Content Type: ${c.contentType || "N/A"}\n` +
                        `Tags: ${Array.isArray(c.tags) ? c.tags.join(", ") : "None"}\n`,
                    )
                    .join("\n---\n")
                : `No crates found matching "${query}"`,
          },
        ],
      };
    },
  );

  // crates/upload
  server.tool(
    "crates_upload",
    UploadCrateParams._def.schema._def.shape(),
    {
      description:
        "Uploads a new crate to the system. For small text-based content, performs a direct upload. For large binary files, returns a pre-signed upload URL.",
    },
    async (args: z.infer<typeof UploadCrateParams>, extra: any) => {
      const {
        fileName, // Original fileName from args
        contentType,
        data,
        title, // Original title from args
        description,
        category, // Original category from args
        tags,
        metadata,
        isPublic,
        password,
      } = args;

      // Ensure we have a proper fileName for JSON content
      let effectiveFileName = fileName;
      if (
        (!effectiveFileName || effectiveFileName.trim() === "") &&
        contentType === "application/json"
      ) {
        const baseNameSource =
          title && title.trim() !== "" ? title.trim() : "untitled";
        effectiveFileName = `${baseNameSource.replace(/[/\\0?%*:|"<>.\\s]/g, "_")}.json`;
      } else if (!effectiveFileName || effectiveFileName.trim() === "") {
        const baseNameSource =
          title && title.trim() !== "" ? title.trim() : "untitled";
        // Sanitize, removing potentially problematic characters including dots from the base name
        const baseName = baseNameSource.replace(/[/\\0?%*:|"<>.\\s]/g, "_");

        let extension = "";
        if (category) {
          switch (category) {
            case CrateCategory.JSON:
              extension = ".json";
              break;
            case CrateCategory.IMAGE:
              extension = ".png";
              break;
            case CrateCategory.MARKDOWN:
              extension = ".md";
              break;
            case CrateCategory.CODE:
              extension = ".txt";
              break;
            case CrateCategory.BINARY:
              extension = ".bin";
              break;
            default:
              extension = ".dat";
          }
        } else if (contentType) {
          if (contentType === "application/json") extension = ".json";
          else if (contentType === "image/jpeg" || contentType === "image/jpg")
            extension = ".jpg";
          else if (contentType === "image/png") extension = ".png";
          else if (contentType === "image/gif") extension = ".gif";
          else if (contentType === "image/webp") extension = ".webp";
          else if (contentType === "image/svg+xml") extension = ".svg";
          else if (contentType === "text/markdown") extension = ".md";
          else if (contentType === "text/csv") extension = ".csv";
          else if (contentType.includes("javascript")) extension = ".js";
          else if (contentType.includes("typescript")) extension = ".ts";
          else if (contentType.includes("python")) extension = ".py";
          else if (contentType.startsWith("text/")) extension = ".txt";
          else if (
            contentType.startsWith("application/octet-stream") ||
            contentType.startsWith("binary/")
          )
            extension = ".bin";
          else extension = ".dat";
        } else {
          extension = ".dat";
        }
        effectiveFileName = `${baseName}${extension}`;
      }

      // Create the partial crate data
      const partialCrate: Partial<Crate> = {
        title: title || effectiveFileName, // Use original title, or fallback to effectiveFileName
        description,
        ownerId: req?.user?.userId || "anonymous",
        shared: {
          public: isPublic,
          passwordProtected: !!password,
          // Use bcrypt to hash the password
          passwordHash: password ? await bcrypt.hash(password, 10) : null,
          passwordSalt: null, // bcrypt includes the salt in the hash
        },
      };

      // Only add tags if they exist and are a non-empty array
      if (tags && Array.isArray(tags) && tags.length > 0) {
        partialCrate.tags = tags;
      }

      // Only add metadata if it exists
      if (metadata && Object.keys(metadata).length > 0) {
        partialCrate.metadata = metadata;
      }

      if (category) {
        partialCrate.category = category;
      }

      // Determine if we should return a presigned URL or directly upload
      const isBinaryCategory = category === CrateCategory.BINARY;
      const isBinaryContentType =
        contentType.startsWith("application/") ||
        contentType === "binary/octet-stream";

      const isBigDataType =
        category === CrateCategory.BINARY ||
        contentType === "text/csv" ||
        contentType.startsWith("application/octet-stream") ||
        contentType.startsWith("binary/");

      if (isBigDataType && !data) {
        const { url, fileId, gcsPath } = await generateUploadUrl(
          effectiveFileName,
          contentType,
        );
        return {
          content: [
            {
              type: "text",
              text: `Upload your file using this URL with a PUT request: ${url}. Crate ID: ${fileId}`,
            },
          ],
          uploadUrl: url,
          crateId: fileId,
          gcsPath,
        };
      }

      if (!data) {
        return {
          content: [{ type: "text", text: "Missing data for direct upload" }],
          isError: true,
        };
      }

      const buffer = Buffer.from(data, "utf8");

      // Simplified for v1 - no embeddings, just a searchable text field
      const metaString = metadata
        ? Object.entries(metadata)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" ")
        : "";
      const tagsString = Array.isArray(tags) ? tags.join(" ") : "";
      const searchText = [title, description, tagsString, metaString]
        .filter(Boolean)
        .join(" ");

      // Add searchField to partialCrate for text search
      partialCrate.searchField = searchText.toLowerCase();

      const crate = await uploadCrate(
        buffer,
        effectiveFileName,
        contentType,
        partialCrate,
      );

      return {
        content: [
          {
            type: "text",
            text: `Crate uploaded successfully. Crate ID: ${crate.id}`,
          },
        ],
        crate,
      };
    },
  );

  // crates/share
  server.tool(
    "crates_share",
    ShareCrateParams._def.schema._def.shape(),
    {
      description:
        "Updates the sharing settings for a crate. Allows making a crate public, sharing with specific users, and setting password protection.",
    },
    async (args: z.infer<typeof ShareCrateParams>, extra: any) => {
      const { id, public: isPublic, passwordProtected } = args;
      const crateRef = db.collection(CRATES_COLLECTION).doc(id);

      // Get current crate to validate ownership
      const crateDoc = await crateRef.get();
      if (!crateDoc.exists) {
        throw new Error("Crate not found");
      }

      const crateData = crateDoc.data();
      if (req?.user?.userId && crateData?.ownerId !== req.user.userId) {
        throw new Error("You don't have permission to share this crate");
      }

      // Update sharing settings
      const sharingUpdate: any = {};
      if (typeof isPublic === "boolean")
        sharingUpdate["shared.public"] = isPublic;
      // Removed for v1 simplification: per-user sharing
      if (typeof passwordProtected === "boolean")
        sharingUpdate["shared.passwordProtected"] = passwordProtected;

      await crateRef.update(sharingUpdate);

      // Return the shareable link and status
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://mcph.io"}/crate/${id}`;
      return {
        content: [
          {
            type: "text",
            text: `Crate ${id} sharing settings updated. ${isPublic ? "Public link" : "Private link"}: ${shareUrl}`,
          },
        ],
        id,
        isPublic,
        passwordProtected,
        shareUrl,
        crateLink: `mcph.io/crate/${id}`,
      };
    },
  );

  // crates/unshare
  server.tool(
    "crates_unshare",
    UnshareCrateParams.shape,
    {
      description:
        "Removes all sharing settings from a crate, making it private. Resets all sharing settings, removing public access and shared users.",
    },
    async (args: { id: string }, extra: any) => {
      const { id } = args;
      const crateRef = db.collection(CRATES_COLLECTION).doc(id);

      // Get current crate to validate ownership
      const crateDoc = await crateRef.get();
      if (!crateDoc.exists) {
        throw new Error("Crate not found");
      }

      const crateData = crateDoc.data();
      if (req?.user?.userId && crateData?.ownerId !== req.user.userId) {
        throw new Error("You don't have permission to unshare this crate");
      }

      // Update sharing settings to remove all sharing
      const sharingUpdate = {
        "shared.public": false,
        // Removed for v1 simplification: per-user sharing
        "shared.passwordProtected": false,
        // Optionally, clear the password if it's stored directly and not hashed
        // 'shared.password': null, // orFieldValue.delete() if you want to remove the field
      };

      await crateRef.update(sharingUpdate);

      return {
        content: [
          {
            type: "text",
            text: `Crate ${id} has been unshared. It is now private.`,
          },
        ],
        id,
      };
    },
  );

  // crates/delete
  server.tool(
    "crates_delete",
    DeleteCrateParams.shape,
    {
      description:
        "Permanently deletes a crate. Removes both the crate content from storage and its metadata from the database.",
    },
    async (args: { id: string }, extra: any) => {
      const { id } = args;

      try {
        // Check if the crate exists first
        const crate = await getCrateMetadata(id);
        if (!crate) {
          throw new Error("Crate not found");
        }

        // Check if the user has permission to delete this crate
        if (req?.user?.userId && crate.ownerId !== req.user.userId) {
          throw new Error("You don't have permission to delete this crate");
        }

        // Use the deleteCrate function from storageService
        const result = await deleteCrate(id, req?.user?.userId);

        if (!result) {
          throw new Error("Failed to delete crate");
        }

        return {
          content: [
            {
              type: "text",
              text: `Crate ${id} has been successfully deleted.`,
            },
          ],
          id,
        };
      } catch (error) {
        console.error("Error deleting crate:", error);
        // Type guard to handle 'unknown' error type
        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error("Failed to delete crate");
        }
      }
    },
  );

  return server;
}

// Stateless MCP endpoint (modern Streamable HTTP, stateless)
app.post(
  "/",
  apiKeyAuthMiddleware as unknown as express.RequestHandler,
  async (req, res) => {
    // Safely use the request as AuthenticatedRequest after middleware has processed it
    const authReq = req as unknown as AuthenticatedRequest;

    console.log(
      `[${new Date().toISOString()}] Incoming POST / from ${authReq.ip || authReq.socket.remoteAddress}`,
    );
    console.log("Request body:", JSON.stringify(authReq.body));
    try {
      // Extract client name from the initialize params if available
      let clientName: string | undefined = undefined;

      // Check if this is an initialize request with name parameter
      if (
        authReq.body &&
        authReq.body.method === "initialize" &&
        authReq.body.params?.name
      ) {
        clientName = authReq.body.params.name;
        // Store the client name on the request object for future reference
        authReq.clientName = clientName;
      }
      // For other jsonrpc methods, try to extract from params
      else if (authReq.body && authReq.body.params?.name) {
        clientName = authReq.body.params.name;
        authReq.clientName = clientName;
      }

      // Create a new server instance for this request
      const server = getServer(authReq);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });

      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(authReq, res, authReq.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  },
);

// Optionally, reject GET/DELETE on / for clarity
app.get("/", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
});
app.delete("/", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`MCPH ready to go!`);
});
