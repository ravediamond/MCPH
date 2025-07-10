import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CratesGalleryParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { Crate, CrateCategory } from "../../../shared/types/crate";
import { z } from "zod";

/**
 * Register the crates_gallery tool with the server
 */
export function registerCratesGalleryTool(server: McpServer): void {
  server.registerTool(
    "crates_gallery",
    {
      title: "Gallery of Discoverable Crates",
      description:
        "Retrieves a paginated list of discoverable public crates for the gallery page. " +
        "Only returns crates that are both public and marked as discoverable.\n\n" +
        "PARAMETERS:\n" +
        "• limit: Number of crates to return (default: 12, max: 50)\n" +
        "• startAfter: ID of the last crate from previous page for pagination\n" +
        "• category: Filter by specific category (optional)\n\n" +
        "CATEGORIES:\n" +
        "• markdown, code, image, json, yaml, text, binary, feedback\n\n" +
        "RESPONSE FORMAT:\n" +
        "Returns crates with basic info (id, title, description, category, tags, createdAt, downloadCount)",
      inputSchema: CratesGalleryParams.shape,
    },
    async (args: z.infer<typeof CratesGalleryParams>, extra: any) => {
      const { limit = 12, startAfter, category } = args;

      try {
        // Build query for discoverable public crates
        let query = db
          .collection(CRATES_COLLECTION)
          .where("shared.public", "==", true)
          .where("shared.isDiscoverable", "==", true)
          .orderBy("createdAt", "desc")
          .limit(limit);

        // Add category filter if provided
        if (category) {
          query = query.where("category", "==", category);
        }

        // Add pagination if startAfter is provided
        if (startAfter) {
          const startAfterDoc = await db
            .collection(CRATES_COLLECTION)
            .doc(startAfter)
            .get();
          if (startAfterDoc.exists) {
            query = query.startAfter(startAfterDoc);
          }
        }

        const snapshot = await query.get();
        const crates: Partial<Crate>[] = [];

        for (const doc of snapshot.docs) {
          const crateData = doc.data() as Crate;

          // Return only essential fields for gallery display
          crates.push({
            id: crateData.id,
            title: crateData.title,
            description: crateData.description,
            category: crateData.category,
            tags: crateData.tags,
            createdAt: crateData.createdAt,
            downloadCount: crateData.downloadCount,
            ownerId: crateData.ownerId,
            size: crateData.size,
            fileName: crateData.fileName,
            mimeType: crateData.mimeType,
          });
        }

        const hasMore = snapshot.docs.length === limit;
        const lastCrateId =
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1].id
            : null;

        return {
          content: [
            {
              type: "text",
              text: `Found ${crates.length} discoverable crates${category ? ` in category ${category}` : ""}. ${hasMore ? "More results available." : "No more results."}`,
            },
          ],
          crates,
          pagination: {
            hasMore,
            lastCrateId,
            total: crates.length,
          },
        };
      } catch (error) {
        console.error("Error fetching gallery crates:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to fetch gallery crates: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
