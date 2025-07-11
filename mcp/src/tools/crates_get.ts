import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCrateParams } from "../config/schemas";
import { getCrateMetadata } from "../../../services/firebaseService";
import {
  getSignedDownloadUrl,
  getCrateContent,
} from "../../../services/storageService";
import { CrateCategory } from "../../../shared/types/crate";
import * as bcrypt from "bcrypt";

/**
 * Register the crates_get tool with the server
 */
export function registerCratesGetTool(server: McpServer): void {
  server.registerTool(
    "crates_get",
    {
      title: "Get Crate",
      description:
        "Retrieves a crate's full contents and metadata by ID. Returns text content directly, images as base64, or download links for binaries.\n\n" +
        "AI USAGE: Use this to access complete context from organized crate collections found via search or folder-like tag filtering.\n\n" +
        "AI usage examples:\n" +
        '• "show crate with ID 12345"\n' +
        '• "get my crate 12345"',
      inputSchema: GetCrateParams.shape,
    },
    async ({ id, password }: { id: string; password?: string }, extra: any) => {
      const meta = await getCrateMetadata(id);
      if (!meta) {
        throw new Error("Crate not found");
      }

      // Check if the crate has expired
      if (meta.expiresAt && new Date() > new Date(meta.expiresAt)) {
        throw new Error("This crate has expired");
      }

      // Log the metadata for debugging
      console.log(
        "Crate metadata for debugging:",
        JSON.stringify(
          {
            id: meta.id,
            ownerId: meta.ownerId,
            shared: meta.shared,
            isAnonymous: meta.ownerId === "anonymous",
          },
          null,
          2,
        ),
      );

      // Default expiration time (5 minutes)
      const exp = 300;

      // Get authentication context
      let userUid = "";
      if (extra?.req?.auth?.clientId) {
        userUid = extra.req.auth.clientId;
      } else if (extra?.authInfo?.clientId) {
        userUid = extra.authInfo.clientId;
      }

      // Check access permissions
      const isOwner = userUid && userUid === meta.ownerId;
      const isShared = meta.shared?.public === true;
      const isAnonymous = meta.ownerId === "anonymous";

      // Log permissions for debugging
      console.log("Permission check:", {
        isOwner,
        isShared,
        isAnonymous,
        userUid,
        ownerId: meta.ownerId,
        shared: meta.shared,
      });

      // Apply access rules:
      // 1. Owner can always access
      // 2. If shared.public is true, anyone can access (anonymous uploads are public by default)
      // 3. Anonymous uploads should be public (fail-safe)
      // 4. If shared.passwordHash exists and caller is not owner, require password
      if (!isOwner && !isShared && !isAnonymous) {
        throw new Error("You don't have permission to access this crate");
      }

      // Password gate for non-owners (skip for anonymous uploads)
      if (
        !isOwner &&
        meta.shared?.passwordHash &&
        meta.ownerId !== "anonymous"
      ) {
        if (!password) {
          throw new Error("Password required to access this crate");
        }

        const passwordMatch = await bcrypt.compare(
          password,
          meta.shared.passwordHash,
        );
        if (!passwordMatch) {
          throw new Error("Invalid password");
        }
      }

      // Special handling for BINARY category - direct user to use crates_get_download_link instead
      if (meta.category === CrateCategory.OTHERS) {
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
}
