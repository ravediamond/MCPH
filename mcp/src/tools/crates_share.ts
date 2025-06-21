import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShareCrateParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
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
        "Updates a crate's sharing settings (public/private, password protection).\n\n" +
        "AI usage example:\n" +
        '• "share crate 12345 publicly"',
      inputSchema: ShareCrateParams._def.schema._def.shape(),
    },
    async (args: z.infer<typeof ShareCrateParams>, extra: any) => {
      const { id, public: isPublic, passwordProtected } = args;
      const crateRef = db.collection(CRATES_COLLECTION).doc(id);

      // Get current crate to validate ownership
      const crateDoc = await crateRef.get();
      if (!crateDoc.exists) {
        throw new Error("Crate not found");
      }

      const crateData = crateDoc.data();
      const req = extra?.req as AuthenticatedRequest | undefined;

      if (req?.user?.userId && crateData?.ownerId !== req.user.userId) {
        throw new Error("You don't have permission to share this crate");
      }

      // Update sharing settings
      const sharingUpdate: any = {};
      if (typeof isPublic === "boolean")
        sharingUpdate["shared.public"] = isPublic;
      // Removed for v1 simplification: per-user sharing
      if (typeof passwordProtected === "boolean")
        sharingUpdate["shared.passwordProtected"] = passwordProtected;

      await crateRef.update(sharingUpdate);

      // Return the shareable link and status
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://mcph.io"}/crate/${id}`;
      return {
        content: [
          {
            type: "text",
            text: `Crate ${id} sharing settings updated. ${isPublic ? "Public link" : "Private link"}: ${shareUrl}`,
          },
        ],
        id,
        isPublic,
        passwordProtected,
        shareUrl,
        crateLink: `mcph.io/crate/${id}`,
      };
    },
  );
}
