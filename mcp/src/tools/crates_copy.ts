import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getCrateMetadata,
  getCrateContent,
  uploadCrate,
} from "../../../services/storageService";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";
import { CopyCrateParams } from "../config/schemas";

/**
 * Register the crates_copy tool with the server
 */
export function registerCratesCopyTool(server: McpServer): void {
  server.registerTool(
    "crates_copy",
    {
      title: "Copy Crate",
      description:
        "Copies an existing crate to the user's collection. If the crate is already owned by the user, it will not be copied.\n\n" +
        "AI usage examples:\n" +
        '• "copy crate with ID 12345 to my collection"\n' +
        '• "save this crate 12345 to my crates"',
      inputSchema: CopyCrateParams.shape,
    },
    async ({ id }: { id: string }, extra: any) => {
      // Get authentication context
      let userUid = "";
      if (extra?.req?.auth?.clientId) {
        userUid = extra.req.auth.clientId;
      } else if (extra?.authInfo?.clientId) {
        userUid = extra.authInfo.clientId;
      }

      // Require authentication for this operation
      if (!userUid || userUid === "anonymous") {
        return {
          content: [
            {
              type: "text",
              text: "You need to be logged in to copy crates to your collection.",
            },
          ],
          isError: true,
        };
      }

      try {
        // Get the source crate metadata
        const sourceCrate = await getCrateMetadata(id);
        if (!sourceCrate) {
          return {
            content: [
              {
                type: "text",
                text: "Crate not found.",
              },
            ],
            isError: true,
          };
        }

        // Check if the crate is already owned by the user
        if (sourceCrate.ownerId === userUid) {
          return {
            content: [
              {
                type: "text",
                text: "This crate is already in your collection.",
              },
            ],
          };
        }

        // Check if the crate is accessible to the user
        const isPublic = sourceCrate.shared?.public === true;
        const isAnonymous = sourceCrate.ownerId === "anonymous";

        if (!isPublic && !isAnonymous) {
          return {
            content: [
              {
                type: "text",
                text: "You don't have permission to copy this crate.",
              },
            ],
            isError: true,
          };
        }

        // Get the crate content
        const { buffer, crate } = await getCrateContent(id);

        // Prepare new crate data for the copy
        const newCrateData = {
          title: `Copy of ${sourceCrate.title}`,
          description: sourceCrate.description,
          ownerId: userUid,
          category: sourceCrate.category,
          tags: sourceCrate.tags,
          metadata: sourceCrate.metadata,
          shared: {
            public: false, // Make the copy private by default
          },
        };

        // Upload the copy with the new owner
        const newCrate = await uploadCrate(
          buffer,
          sourceCrate.fileName,
          sourceCrate.mimeType,
          newCrateData,
        );

        return {
          content: [
            {
              type: "text",
              text: `Crate copied successfully to your collection. New crate ID: ${newCrate.id}`,
            },
          ],
          crate: newCrate,
        };
      } catch (error) {
        console.error("Error copying crate:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to copy crate: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
