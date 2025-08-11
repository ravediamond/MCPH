import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UploadCrateParams, UploadCrateParamsShape } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import {
  generateUploadUrl,
  uploadCrate,
} from "../../../services/storageService";
import { Crate, CrateCategory } from "../../../shared/types/crate";
import bcrypt from "bcrypt";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/**
 * Register the crates_upload tool with the server
 */
export function registerCratesUploadTool(server: McpServer): void {
  server.registerTool(
    "crates_upload",
    {
      title: "Upload Crate",
      description:
        "Uploads a new crate with content and metadata. Small text content is uploaded directly; large/binary files return a pre-signed URL.\n\n" +
        "REQUIRED PARAMETERS:\n" +
        "• data: The content to upload (text/base64)\n" +
        "• title: Title for the crate\n" +
        "• contentType: MIME type (see allowed types below)\n\n" +
        "OPTIONAL PARAMETERS:\n" +
        "• fileName: File name (auto-generated if not provided)\n" +
        "• category: Content category (see ecosystem categories below)\n" +
        "• description: Description of the content\n" +
        "• metadata: Key-value pairs for additional info\n" +
        "• isPublic: Make crate publicly accessible (default: false)\n" +
        "SIMPLE CATEGORIES:\n" +
        "• recipe: 🧾 AI task instructions (step-by-step workflows for AI agents)\n" +
        "• text: 📝 Any written content (notes, docs, markdown)\n" +
        "• image: 🖼️ Pictures, charts, diagrams\n" +
        "• code: 💻 Scripts and programming (JS, Python, HTML, CSS)\n" +
        "• data: 📊 Spreadsheets, JSONs, CSVs\n" +
        "• poll: 🎯 Interactive polls\n\n" +
        "ALLOWED CONTENT TYPES:\n" +
        "• Text: text/plain, text/markdown, text/csv, text/html\n" +
        "• Code: text/javascript, text/typescript, text/python, application/json\n" +
        "• Data: application/yaml, text/yaml, text/x-yaml, text/csv\n" +
        "• Images: image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml\n" +
        "• Binary: application/octet-stream, binary/octet-stream\n\n" +
        "AI usage examples:\n" +
        '• Upload markdown: {"data": "# Hello", "title": "Doc", "contentType": "text/markdown"}\n' +
        '• Upload JSON: {"data": "{\\"key\\": \\"value\\"}", "title": "Config", "contentType": "application/json"}',
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

      const {
        fileName, // Original fileName from args
        contentType,
        data,
        title, // Original title from args
        description,
        category, // Original category from args
        metadata,
        isPublic,
      } = validationResult.data;

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
            case CrateCategory.RECIPE:
              extension = ".md";
              break;
            case CrateCategory.TEXT:
              extension = ".txt";
              break;
            case CrateCategory.IMAGE:
              extension = ".png";
              break;
            case CrateCategory.CODE:
              extension = ".js";
              break;
            case CrateCategory.DATA:
              extension = ".json";
              break;
            case CrateCategory.POLL:
              extension = ".json";
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

      // Create the partial crate data with edit key
      const editKey = uuidv4(); // Generate unique edit key for this crate

      console.log("[crates_upload] Creating new crate with edit key");

      const partialCrate: Partial<Crate> = {
        title: title || effectiveFileName, // Use original title, or fallback to effectiveFileName
        description,
        editKey, // Store edit key for modification access
        shared: {
          public: isPublic,
        },
      };


      // Only add metadata if it exists
      if (metadata && Object.keys(metadata).length > 0) {
        partialCrate.metadata = metadata;
      }

      if (category) {
        partialCrate.category = category;
      }

      // Determine if we should return a presigned URL or directly upload
      const isBinaryContentType =
        contentType.startsWith("application/octet-stream") ||
        contentType === "binary/octet-stream";

      const isBigDataType =
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
      const searchText = [title, description, metaString]
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
            text: `Crate uploaded successfully. 
            
View link: /crate/${crate.id}
Edit key: ${crate.editKey}

Keep the edit key secure - it allows modifying this crate.`,
          },
        ],
        crate,
      };
    },
  );
}
