import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UploadCrateParams, UploadCrateParamsShape } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import {
  generateUploadUrl,
  uploadCrate,
} from "../../../services/storageService";
import { Crate, CrateCategory } from "../../../shared/types/crate";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";
import bcrypt from "bcrypt";
import { z } from "zod";

/**
 * Register the crates_upload tool with the server
 */
export function registerCratesUploadTool(server: McpServer): void {
  server.registerTool(
    "crates_upload",
    {
      title: "Upload Crate",
      description:
        "Uploads a new crate with content, metadata, and organizational tags. Small text content is uploaded directly; large/binary files return a pre-signed URL.\n\n" +
        "REQUIRED PARAMETERS:\n" +
        "• data: The content to upload (text/base64)\n" +
        "• title: Title for the crate\n\n" +
        "OPTIONAL PARAMETERS:\n" +
        "• fileName: File name (auto-generated if not provided)\n" +
        "• contentType: MIME type (auto-detected from category if not provided)\n" +
        "• category: Content category (markdown, json, yaml, code, etc.)\n" +
        "• description: Description of the content\n" +
        "• tags: ARRAY of strings (not a single string!) - e.g. [\"project:website\", \"type:requirements\"]\n" +
        "• metadata: Key-value pairs for additional info\n" +
        "• isPublic: Make crate publicly accessible (default: false)\n" +
        "• password: Password protect the crate\n\n" +
        "TAGGING BEST PRACTICES:\n" +
        '• Use project tags: ["project:website-redesign", "project:chatbot-v2"]\n' +
        '• Add type tags: ["type:requirements", "type:code", "type:data"]\n' +
        '• Include context tags: ["context:user-research", "context:specs"]\n' +
        '• Add workflow tags: ["status:draft", "priority:high"]\n\n' +
        "IMPORTANT: tags must be an ARRAY, not a string!\n" +
        'Correct: tags: ["project:ecommerce", "type:requirements"]\n' +
        'Wrong: tags: "project:ecommerce, type:requirements"\n\n' +
        "AI usage examples:\n" +
        '• Upload with tags: {"data": "content", "title": "My Doc", "tags": ["project:web", "type:doc"]}\n' +
        '• Simple upload: {"data": "content", "title": "notes", "category": "markdown"}',
      inputSchema: UploadCrateParamsShape.shape,
    },
    async (args: z.infer<typeof UploadCrateParams>, extra: any) => {
      // Validate the arguments with business rules
      const validationResult = UploadCrateParams.safeParse(args);
      if (!validationResult.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid arguments: ${validationResult.error.message}`,
            },
          ],
          isError: true,
        };
      }

      let {
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
      } = validationResult.data;

      // Auto-detect contentType from category if not provided
      if (!contentType && category) {
        switch (category) {
          case CrateCategory.JSON:
            contentType = "application/json";
            break;
          case CrateCategory.YAML:
            contentType = "application/yaml";
            break;
          case CrateCategory.MARKDOWN:
            contentType = "text/markdown";
            break;
          case CrateCategory.CODE:
            contentType = "text/plain";
            break;
          case CrateCategory.IMAGE:
            contentType = "image/png";
            break;
          case CrateCategory.BINARY:
            contentType = "application/octet-stream";
            break;
          default:
            contentType = "text/plain";
        }
      } else if (!contentType) {
        // Default contentType if neither contentType nor category provided
        contentType = "text/plain";
      }

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
            case CrateCategory.YAML:
              extension = ".yaml";
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
          else if (
            contentType === "application/yaml" ||
            contentType === "text/yaml" ||
            contentType === "text/x-yaml"
          )
            extension = ".yaml";
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
      // Get authentication info from extra (supplied by the SDK)
      const req = extra?.req as AuthenticatedRequest | undefined;
      const authInfo = extra?.authInfo;

      // Prefer authInfo.clientId, fallback to req.user.userId for backward compatibility
      const ownerId = authInfo?.clientId ?? req?.user?.userId ?? "anonymous";

      // Debug logging to verify authentication
      console.log("[crates_upload] Authentication debug:", {
        extraHasReq: !!extra?.req,
        extraUserId: req?.user?.userId,
        authInfo: authInfo ? { clientId: authInfo.clientId } : undefined,
        chosenOwnerId: ownerId,
        clientName: req?.clientName || "unknown",
      });

      const partialCrate: Partial<Crate> = {
        title: title || effectiveFileName, // Use original title, or fallback to effectiveFileName
        description,
        ownerId,
        shared: {
          public: isPublic,
          ...(password
            ? { passwordHash: await bcrypt.hash(password, 10) }
            : {}),
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

      // Add expiration date for anonymous uploads (30 days from now)
      if (ownerId === "anonymous") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        partialCrate.expiresAt = expiresAt;
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
}
