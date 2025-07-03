import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShareCrateParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import { z } from "zod";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";

/**
 * Register the crates_share tool with the server
 */
export function registerCratesShareTool(server: McpServer): void {
  server.registerTool(
    "crates_share",
    {
      title: "Share Crate",
      description:
        "Updates a crate's sharing settings (public/private, password protection). Makes crates accessible via direct links for collaboration.\n\n" +
        "AI USAGE: Share organized project contexts or curated knowledge collections. Consider sharing entire 'project:name' tagged collections for team collaboration.\n\n" +
        "AI usage example:\n" +
        '• "share crate 12345 publicly"',
      inputSchema: ShareCrateParams.shape,
    },
    async (args: z.infer<typeof ShareCrateParams>, extra: any) => {
      const { id, password } = args;
      const crateRef = db.collection(CRATES_COLLECTION).doc(id);

      // Get current crate to validate ownership
      const crateDoc = await crateRef.get();
      if (!crateDoc.exists) {
        throw new Error("Crate not found");
      }

      const crateData = crateDoc.data();
      const req = extra?.req as AuthenticatedRequest | undefined;
      const authInfo = extra?.authInfo;

      // Prefer authInfo.clientId, fallback to req.user.userId for backward compatibility
      const userId = authInfo?.clientId ?? req?.user?.userId;

      if (userId && crateData?.ownerId !== userId) {
        throw new Error("You don't have permission to share this crate");
      }

      // Update sharing settings
      const sharingUpdate: any = { "shared.public": true };
      if (password) {
        sharingUpdate["shared.passwordHash"] = await bcrypt.hash(password, 10);
      } else {
        sharingUpdate["shared.passwordHash"] =
          admin.firestore.FieldValue.delete();
      }

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
    },
  );
}
