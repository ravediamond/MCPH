import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShareCrateParams } from "../config/schemas";

/**
 * DEPRECATED: use crates_share instead. This forwards to crates_share
 * with password removed.
 */
export function registerCratesMakePublicTool(server: McpServer): void {
  server.registerTool(
    "crates_make_public",
    {
      title: "Make Crate Public",
      description: "Deprecated alias for crates_share",
      inputSchema: ShareCrateParams.shape,
    },
    async (args: any, extra: any) => {
      const { id } = args;
      // Instead of trying to get the crates_share tool directly,
      // we'll just create a new request to the crates_share functionality
      try {
        // Import the necessary functions from firebaseService and other dependencies
        const { db, CRATES_COLLECTION } = await import(
          "../../../services/firebaseService"
        );
        const admin = await import("firebase-admin");

        // Replicate the crates_share functionality
        const crateRef = db.collection(CRATES_COLLECTION).doc(id);

        // Get current crate to validate ownership
        const crateDoc = await crateRef.get();
        if (!crateDoc.exists) {
          throw new Error("Crate not found");
        }

        const crateData = crateDoc.data();
        const req = extra?.req;
        const authInfo = extra?.authInfo;

        // Prefer authInfo.clientId, fallback to req.user.userId for backward compatibility
        const userId = authInfo?.clientId ?? req?.user?.userId;

        if (userId && crateData?.ownerId !== userId) {
          throw new Error("You don't have permission to share this crate");
        }

        // Update sharing settings
        const sharingUpdate: any = { "shared.public": true };
        sharingUpdate["shared.passwordHash"] =
          admin.firestore.FieldValue.delete();

        await crateRef.update(sharingUpdate);

        // Return the shareable link and status
        const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://mcph.io"}/crate/${id}`;
        return {
          content: [
            {
              type: "text",
              text: `Crate ${id} sharing settings updated. Link: ${shareUrl}`,
            },
          ],
          id,
          shareUrl,
          crateLink: `mcph.io/crate/${id}`,
        };
      } catch (error) {
        throw error;
      }
    },
  );
}
