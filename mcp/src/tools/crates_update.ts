import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UpdateCrateParams } from "../config/schemas";
import {
  getCrateMetadata,
  updateCrateMetadata,
  logEvent,
} from "../../../services/firebaseService";
import { uploadCrate } from "../../../services/storageService";
import { Crate, CrateCategory } from "../../../shared/types/crate";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";
import bcrypt from "bcrypt";
import { z } from "zod";

/**
 * Register the crates_update tool with the server
 */
export function registerCratesUpdateTool(server: McpServer): void {
  server.registerTool(
    "crates_update",
    {
      title: "Update Crate",
      description:
        "Updates an existing crate's content, metadata, or organizational information. " +
        "Allows users to iterate on content while preserving the crate ID, sharing settings, and creation timestamp.\n\n" +
        "FEEDBACK TEMPLATES: For feedback crates, you can update metadata like 'isOpen' to open/close templates for responses.\n\n" +
        "Only the provided parameters will be updated; omitted parameters remain unchanged.\n\n" +
        "AI usage examples:\n" +
        '• "update crate 12345 with new content"\n' +
        "• \"change the title of crate 12345 to 'Final Report'\"\n" +
        '• "add tags to crate 12345"\n' +
        '• "close feedback template 12345" (set metadata.isOpen to false)\n' +
        '• "reopen feedback template 12345" (set metadata.isOpen to true)\n' +
        '• "update the description of my crate 12345"',
      inputSchema: UpdateCrateParams.shape,
    },
    async (args: z.infer<typeof UpdateCrateParams>, extra: any) => {
      const {
        id,
        title,
        description,
        data,
        fileName,
        contentType,
        category,
        tags,
        metadata,
      } = args;

      // Get authentication info from extra (supplied by the SDK)
      const req = extra?.req as AuthenticatedRequest | undefined;
      const authInfo = extra?.authInfo;

      // Prefer authInfo.clientId, fallback to req.user.userId for backward compatibility
      const userId = authInfo?.clientId ?? req?.user?.userId;

      // If no authenticated user, return error
      if (!userId) {
        return {
          content: [
            {
              type: "text",
              text: "Authentication required to update a crate.",
            },
          ],
          isError: true,
        };
      }

      try {
        // Get the original crate metadata
        const originalCrate = await getCrateMetadata(id);
        if (!originalCrate) {
          return {
            content: [
              {
                type: "text",
                text: `Crate with ID ${id} not found.`,
              },
            ],
            isError: true,
          };
        }

        // Check if the user owns the crate
        if (originalCrate.ownerId !== userId) {
          return {
            content: [
              {
                type: "text",
                text: "You don't have permission to update this crate.",
              },
            ],
            isError: true,
          };
        }

        // Prepare update data based on what was provided
        // Only include fields that are explicitly provided to avoid overwriting existing values
        const updateData: Partial<Crate> = {};

        // Update metadata fields if provided
        if (title !== undefined) {
          updateData.title = title;
        }

        if (description !== undefined) {
          updateData.description = description;
        }

        if (category !== undefined) {
          updateData.category = category;
        }

        if (tags !== undefined) {
          updateData.tags = tags;
        }

        if (metadata !== undefined) {
          updateData.metadata = metadata;
        }

        // If content data is provided, we need to handle file upload
        if (data !== undefined) {
          // Ensure we have contentType if updating data
          if (!contentType && !originalCrate.mimeType) {
            return {
              content: [
                {
                  type: "text",
                  text: "Content type is required when updating crate content.",
                },
              ],
              isError: true,
            };
          }

          const actualContentType = contentType || originalCrate.mimeType;
          const actualFileName = fileName || originalCrate.fileName;

          // Create buffer from data
          const buffer = Buffer.from(data, "utf8");

          // Update searchField for text search
          const metaString =
            updateData.metadata || originalCrate.metadata
              ? Object.entries(
                  updateData.metadata || originalCrate.metadata || {},
                )
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" ")
              : "";

          const updatedTags = updateData.tags || originalCrate.tags || [];
          const tagsString = updatedTags.join(" ");

          const searchText = [
            updateData.title || originalCrate.title,
            updateData.description || originalCrate.description,
            tagsString,
            metaString,
          ]
            .filter(Boolean)
            .join(" ");

          updateData.searchField = searchText.toLowerCase();

          // Use the existing crate info but with the updated file
          // Merge original crate data with updates to preserve all existing fields
          const mergedCrateData = {
            ...originalCrate,
            ...updateData,
            id: originalCrate.id, // Preserve the ID
            ownerId: userId,
            shared: originalCrate.shared, // Preserve sharing settings
          };

          const crateData = await uploadCrate(
            buffer,
            actualFileName,
            actualContentType,
            mergedCrateData,
          );

          // Log the update event
          await logEvent("crate_update", id, undefined, { userId });

          return {
            content: [
              {
                type: "text",
                text: `Crate updated successfully. Content and metadata for crate ${id} have been updated.`,
              },
            ],
            crate: crateData,
          };
        } else {
          // If no content update, just update the metadata
          if (Object.keys(updateData).length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No changes specified. Please provide at least one field to update.",
                },
              ],
              isError: true,
            };
          }

          // Update searchField for text search if metadata was changed
          if (
            updateData.title ||
            updateData.description ||
            updateData.tags ||
            updateData.metadata
          ) {
            const metaString =
              updateData.metadata || originalCrate.metadata
                ? Object.entries(
                    updateData.metadata || originalCrate.metadata || {},
                  )
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" ")
                : "";

            const updatedTags = updateData.tags || originalCrate.tags || [];
            const tagsString = updatedTags.join(" ");

            const searchText = [
              updateData.title || originalCrate.title,
              updateData.description || originalCrate.description,
              tagsString,
              metaString,
            ]
              .filter(Boolean)
              .join(" ");

            updateData.searchField = searchText.toLowerCase();
          }

          // Update the crate metadata in Firestore
          const updatedCrate = await updateCrateMetadata(id, updateData);

          // Log the update event
          await logEvent("crate_update", id, undefined, { userId });

          return {
            content: [
              {
                type: "text",
                text: `Crate updated successfully. Metadata for crate ${id} has been updated.`,
              },
            ],
            crate: updatedCrate,
          };
        }
      } catch (error) {
        console.error("Error updating crate:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to update crate: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
