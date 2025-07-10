import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SocialShareParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { z } from "zod";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";

/**
 * Generate share URLs for different social platforms
 */
function generateShareUrls(
  crateId: string,
  title: string,
  description: string,
  url: string,
  customMessage?: string,
) {
  const defaultMessage =
    customMessage || `Check out this AI artifact: ${title} - ${url}`;
  const encodedMessage = encodeURIComponent(defaultMessage);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    discord: defaultMessage, // Discord doesn't have direct share URL, return message
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedMessage}`,
  };
}

/**
 * Register the crates_share_social tool with the server
 */
export function registerCratesShareSocialTool(server: McpServer): void {
  server.registerTool(
    "crates_share_social",
    {
      title: "Share Crate on Social Media",
      description:
        "Generate social media share URLs and content for crates. Supports Twitter/X, Reddit, LinkedIn, Discord, Telegram, and Email sharing.\n\n" +
        "AI USAGE: Generate formatted share content for distributing AI artifacts across social platforms. Useful for sharing project outputs, code snippets, or collaborative work.\n\n" +
        "AI usage examples:\n" +
        '• "share crate 12345 on twitter"\n' +
        '• "get sharing links for crate abc123 with custom message"\n' +
        '• "share crate def456 on all platforms"',
      inputSchema: SocialShareParams.shape,
    },
    async (args: z.infer<typeof SocialShareParams>, extra: any) => {
      const { crateId, platform, customMessage } = args;
      const crateRef = db.collection(CRATES_COLLECTION).doc(crateId);

      // Get crate data
      const crateDoc = await crateRef.get();
      if (!crateDoc.exists) {
        throw new Error("Crate not found");
      }

      const crateData = crateDoc.data();
      const req = extra?.req as AuthenticatedRequest | undefined;
      const authInfo = extra?.authInfo;

      // Check if crate is public or user has access
      const userId = authInfo?.clientId ?? req?.user?.userId;
      const isPublic = crateData?.shared?.public || false;
      const isOwner = userId && crateData?.ownerId === userId;

      if (!isPublic && !isOwner) {
        throw new Error("Crate is not public and you don't have access to it");
      }

      // Generate share data
      const title = crateData?.title || `Crate ${crateId}`;
      const description = crateData?.description || "";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mcph.io";
      const crateUrl = `${baseUrl}/crate/${crateId}`;

      const shareUrls = generateShareUrls(
        crateId,
        title,
        description,
        crateUrl,
        customMessage,
      );

      // Return platform-specific or all platforms
      if (platform === "all") {
        return {
          content: [
            {
              type: "text",
              text:
                `Share URLs generated for crate "${title}" (${crateId}):\n\n` +
                `Twitter: ${shareUrls.twitter}\n` +
                `Reddit: ${shareUrls.reddit}\n` +
                `LinkedIn: ${shareUrls.linkedin}\n` +
                `Discord: Copy this message - ${shareUrls.discord}\n` +
                `Telegram: ${shareUrls.telegram}\n` +
                `Email: ${shareUrls.email}`,
            },
          ],
          crateId,
          title,
          shareUrls,
          message: customMessage || shareUrls.discord,
        };
      } else {
        const platformUrl = shareUrls[platform as keyof typeof shareUrls];
        const platformName =
          platform.charAt(0).toUpperCase() + platform.slice(1);

        return {
          content: [
            {
              type: "text",
              text:
                platform === "discord"
                  ? `${platformName} share message for crate "${title}": ${platformUrl}`
                  : `${platformName} share URL for crate "${title}": ${platformUrl}`,
            },
          ],
          crateId,
          title,
          platform,
          shareUrl: platformUrl,
          message: customMessage || shareUrls.discord,
        };
      }
    },
  );
}
