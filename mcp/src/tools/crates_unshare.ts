import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UnshareCrateParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Register the crates_unshare tool with the server
 */
export function registerCratesUnshareTool(server: McpServer): void {
  server.registerTool(
    "crates_unshare",
    {
      title: "Make Crate Private",
      description:
        "Makes a crate private by removing all sharing settings.\n\n" +
        "REQUIRED: editKey parameter for authorization\n\n" +
        "AI usage example:\n" +
        '• "make crate 12345 private with editKey xyz789"',
      inputSchema: UnshareCrateParams.shape,
    },
    async (args: { id: string; editKey: string }, extra: any) => {
      const { id, editKey } = args;
      const crateRef = db.collection(CRATES_COLLECTION).doc(id);

      // Get current crate to validate ownership
      const crateDoc = await crateRef.get();
      if (!crateDoc.exists) {
        throw new Error("Crate not found");
      }

      const crateData = crateDoc.data();

      // Check if the provided edit key matches
      if (crateData?.editKey !== editKey) {
        throw new Error(
          "Invalid edit key. You need the correct edit key to unshare this crate.",
        );
      }

      // Update sharing settings to remove all sharing
      const sharingUpdate = {
        "shared.public": false,
        "shared.passwordHash": FieldValue.delete(),
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
