import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCrateParams } from "../config/schemas";
import { getCrateMetadata } from "../../../services/firebaseService";
import { deleteCrate } from "../../../services/storageService";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";

/**
 * Register the crates_delete tool with the server
 */
export function registerCratesDeleteTool(server: McpServer): void {
  server.registerTool(
    "crates_delete",
    {
      title: "Delete Crate",
      description:
        "Permanently deletes a crate's data and metadata.\n\n" +
        "AI usage example:\n" +
        '• "delete crate 12345"',
      inputSchema: DeleteCrateParams.shape,
    },
    async (args: { id: string }, extra: any) => {
      const { id } = args;

      try {
        // Check if the crate exists first
        const crate = await getCrateMetadata(id);
        if (!crate) {
          throw new Error("Crate not found");
        }

        const req = extra?.req as AuthenticatedRequest | undefined;

        // Check if the user has permission to delete this crate
        if (req?.user?.userId && crate.ownerId !== req.user.userId) {
          throw new Error("You don't have permission to delete this crate");
        }

        // Use elicitation to ask for confirmation before deletion
        const confirmResult = await server.server.elicitInput({
          message: `You're about to permanently delete crate "${crate.fileName || crate.title || id}". This action cannot be undone.`,
          requestedSchema: {
            type: "object",
            properties: {
              confirmDelete: {
                type: "boolean",
                title: "Confirm Deletion",
                description: "Are you sure you want to delete this crate?",
              },
              deleteReason: {
                type: "string",
                title: "Reason (optional)",
                description: "Optional: Reason for deletion",
              },
            },
            required: ["confirmDelete"],
          },
        });

        // Check if the user confirmed deletion
        if (
          confirmResult.action !== "accept" ||
          !confirmResult.content?.confirmDelete
        ) {
          return {
            content: [{ type: "text", text: "Deletion cancelled." }],
          };
        }

        // User confirmed, proceed with deletion
        const result = await deleteCrate(id, req?.user?.userId);

        if (!result) {
          throw new Error("Failed to delete crate");
        }

        // Include the optional reason if provided
        const reason = confirmResult.content.deleteReason
          ? `\nReason: ${confirmResult.content.deleteReason}`
          : "";

        return {
          content: [
            {
              type: "text",
              text: `Crate ${id} has been successfully deleted.${reason}`,
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
}
