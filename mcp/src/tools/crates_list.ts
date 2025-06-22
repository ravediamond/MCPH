import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCratesParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { Crate, CrateCategory } from "../../../shared/types/crate";

/**
 * Register the crates_list tool with the server
 */
export function registerCratesListTool(server: McpServer): void {
  server.registerTool(
    "crates_list",
    {
      title: "List Crates",
      description:
        "Lists all your crates (metadata, IDs, titles, descriptions, categories, tags, expiration). Crates are stored for 30 days.\n\n" +
        "Pagination support:\n" +
        "• limit: Number of crates to return per page (default: 20, max: 100)\n" +
        "• startAfter: Cursor-based pagination token (ID of last crate from previous page)\n" +
        "• Response includes lastCrateId and hasMore flags for pagination\n\n" +
        "AI usage examples:\n" +
        '• "list my crates"\n' +
        '• "show my recent crates"\n' +
        '• "show next page of my crates" (use startAfter from previous response)\n' +
        '• "list my first 10 crates" (use limit parameter)\n' +
        '• "show more crates after {lastCrateId}" (use startAfter parameter)',
      inputSchema: ListCratesParams.shape,
    },
    async (
      params: { limit?: number; startAfter?: string } = {},
      extra?: any,
    ) => {
      try {
        // Set default limit or use provided limit, capped at 100
        const limit = Math.min(params.limit || 20, 100);

        // Start with base query
        let query = db
          .collection(CRATES_COLLECTION)
          .where(
            "createdAt",
            ">",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ) // Filter to last 30 days
          .orderBy("createdAt", "desc");

        // Add cursor-based pagination if startAfter is provided
        if (params.startAfter) {
          try {
            const startAfterDoc = await db
              .collection(CRATES_COLLECTION)
              .doc(params.startAfter)
              .get();

            if (startAfterDoc.exists) {
              query = query.startAfter(startAfterDoc);
            } else {
              console.warn(
                `StartAfter document ${params.startAfter} not found`,
              );
            }
          } catch (error) {
            console.error("Error getting startAfter document:", error);
            // Continue without cursor if there was an error
          }
        }

        // Get one extra document to determine if there are more results
        const snapshot = await query.limit(limit + 1).get();

        // Check if there are more results
        const hasMore = snapshot.docs.length > limit;
        // Remove the extra document if we have more results
        const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

        const crates: Array<
          Partial<Crate> & {
            id: string;
            expiresAt: string | null;
            contentType?: string;
            category?: CrateCategory;
          }
        > = docs.map((doc: any) => {
          // Get document data properly
          const data = doc.data() as any;
          const id = doc.id;

          // Filter out unwanted properties using safe type casting
          const { embedding, searchField, gcsPath, ...filteredData } = data;

          // Access potentially undefined properties safely
          const mimeType = data.mimeType;
          const category = data.category;

          return {
            id: doc.id,
            ...filteredData,
            contentType: mimeType, // Add contentType
            category: category, // Add category
            expiresAt: null, // ttlDays is no longer supported
          };
        });

        return {
          crates,
          lastCrateId:
            hasMore && docs.length > 0 ? docs[docs.length - 1].id : null,
          hasMore,
          content: [
            {
              type: "text",
              text: crates
                .map(
                  (c) =>
                    `ID: ${c.id}\nTitle: ${c.title || "Untitled"}\n` +
                    `Description: ${c.description || "No description"}\n` +
                    `Category: ${c.category || "N/A"}\n` +
                    `Content Type: ${c.contentType || "N/A"}\n` +
                    `Tags: ${Array.isArray(c.tags) ? c.tags.join(", ") : "None"}\n`,
                )
                .join("\n---\n"),
            },
          ],
        };
      } catch (error) {
        console.error("Error listing crates:", error);
        throw new Error("Failed to retrieve crates");
      }
    },
  );
}
