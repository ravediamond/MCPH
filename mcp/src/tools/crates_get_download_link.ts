import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCrateDownloadLinkParams } from "../config/schemas";
import { getCrateMetadata } from "../../../services/firebaseService";
import { getSignedDownloadUrl } from "../../../services/storageService";

/**
 * Register the crates_get_download_link tool with the server
 */
export function registerCratesGetDownloadLinkTool(server: McpServer): void {
  server.registerTool(
    "crates_get_download_link",
    {
      title: "Get Download Link",
      description:
        "Generates a pre-signed download URL for a crate, especially for binaries or large files. Download links expire in 24 hours. Response includes expiry info.\n\n" +
        "AI usage example:\n" +
        '• "get download link for crate 12345"',
      inputSchema: GetCrateDownloadLinkParams.shape,
    },
    async (
      { id, expiresInSeconds }: { id: string; expiresInSeconds?: number },
      extra: any,
    ) => {
      const meta = await getCrateMetadata(id);
      if (!meta) {
        throw new Error("Crate not found");
      }

      // Default expiration time (24 hours) if not specified
      const exp =
        typeof expiresInSeconds === "number"
          ? Math.max(1, Math.min(86400, expiresInSeconds))
          : 86400; // Default to 24 hours

      // Get pre-signed URL regardless of type
      const url = await getSignedDownloadUrl(
        meta.id,
        meta.title,
        Math.ceil(exp / 60),
      );

      return {
        content: [
          {
            type: "text",
            text: `Download link for crate ${meta.title}: ${url}\nThis link is valid for ${Math.round(exp / 3600)} hours and ${Math.round((exp % 3600) / 60)} minutes.`,
          },
        ],
        url,
        validForSeconds: exp,
        expiresAt: new Date(Date.now() + exp * 1000).toISOString(),
      };
    },
  );
}
