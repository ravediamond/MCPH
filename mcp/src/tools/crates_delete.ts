import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCrateParams } from "../config/schemas";
import { getCrateMetadata } from "../../../services/firebaseService";
import { deleteCrate } from "../../../services/storageService";

/**
 * Register the crates_delete tool with the server
 */
export function registerCratesDeleteTool(server: McpServer): void {
  server.registerTool(
    "crates_delete",
    {
      title: "Delete Crate",
      description:
        "Permanently deletes a crate's data and metadata. Use with caution.\n\n" +
        "REQUIRED: editKey parameter for authorization\n\n" +
        "AI USAGE: Clean up outdated project files, but consider updating tags (e.g., 'status:archived') instead of deletion to preserve project history.\n\n" +
        "AI usage example:\n" +
        '• "delete crate 12345 with editKey xyz789"',
      inputSchema: DeleteCrateParams.shape,
    },
    async (args: { id: string; editKey: string }, extra: any) => {
      const { id, editKey } = args;

      try {
        // Check if the crate exists first
        const crate = await getCrateMetadata(id);
        if (!crate) {
          throw new Error("Crate not found");
        }

        // Check if the provided edit key matches
        if (crate.editKey !== editKey) {
          throw new Error(
            "Invalid edit key. You need the correct edit key to delete this crate.",
          );
        }

        // Proceed with deletion without confirmation
        const result = await deleteCrate(id, undefined);

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
