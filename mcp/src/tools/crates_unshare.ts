import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UnshareCrateParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";

/**
 * Register the crates_unshare tool with the server
 */
export function registerCratesUnshareTool(server: McpServer): void {
  server.tool(
    "crates_unshare",
    UnshareCrateParams.shape,
    {
      description:
        "Makes a crate private by removing all sharing settings.\n\n" +
        "AI usage example:\n" +
        '• "make crate 12345 private"',
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
      const req = extra?.req as AuthenticatedRequest | undefined;

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
}
