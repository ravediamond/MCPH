import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCrateParams } from "../config/schemas";
import { getCrateMetadata } from "../../../services/firebaseService";
import { deleteCrate } from "../../../services/storageService";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";

/**
 * Register the crates_delete tool with the server
 */
export function registerCratesDeleteTool(server: McpServer): void {
  server.tool(
    "crates_delete",
    DeleteCrateParams.shape,
    {
      description:
        "Permanently deletes a crate's data and metadata.\n\n" +
        "AI usage example:\n" +
        '• "delete crate 12345"',
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
}
