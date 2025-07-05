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
        "Lists all your crates with metadata, IDs, titles, descriptions, categories, and tags. Use this to discover existing organizational patterns and tag conventions in your crates before uploading new content.\n\n" +
        "AI USAGE: Review existing tags to maintain consistent project/type/context naming conventions.\n\n" +
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

        // Implementation of the fix according to the ticket
        // The ctxUser might be in extra.req.auth or extra.authInfo depending on flow
        let uid = "__nobody__"; // sentinel that never matches "" in DB

        // Check for auth info in various possible locations
        const authInfo = extra?.authInfo;
        const reqAuth = extra?.req?.auth;

        // If we have a valid UID from client ID in either source, use it
        if (authInfo && authInfo.clientId && authInfo.clientId !== "") {
          uid = authInfo.clientId; // real end-user filter from authInfo
        } else if (reqAuth && reqAuth.clientId && reqAuth.clientId !== "") {
          uid = reqAuth.clientId; // real end-user filter from req.auth
        }

        // Ensure we have a valid value for the query
        if (!uid || uid === undefined) {
          uid = "__nobody__"; // Fallback to sentinel if somehow uid is undefined
        }

        console.log("[crates_list] Using UID for query:", uid);

        // Log service account usage for metrics
        if (uid === "__nobody__") {
          console.log(
            "[crates_list] Service account (API key only) access detected",
          );
        }

        // Start with base query
        let query = db
          .collection(CRATES_COLLECTION)
          .where("ownerId", "==", uid) // Apply owner filter
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

        // No need to post-filter since we're using the sentinel value approach
        const docs = snapshot.docs;

        // Check if there are more results
        const hasMore = docs.length > limit;
        // Remove the extra document if we have more results
        const docsToUse = hasMore ? docs.slice(0, limit) : docs;

        const crates: Array<
          Partial<Crate> & {
            id: string;
            expiresAt: string | null;
            contentType?: string;
            category?: CrateCategory;
          }
        > = docsToUse.map((doc: any) => {
          // Get document data properly
          const data = doc.data() as any;
          const id = doc.id;

          // Filter out unwanted properties using safe type casting
          const { embedding, searchField, gcsPath, ...filteredData } = data;

          // Access potentially undefined properties safely
          const mimeType = data.mimeType;
          const category = data.category;

          // Convert tags object to array if it's not already an array
          let tagsArray = data.tags;
          if (
            data.tags &&
            !Array.isArray(data.tags) &&
            typeof data.tags === "object"
          ) {
            tagsArray = Object.values(data.tags);
          }

          return {
            id: doc.id,
            ...filteredData,
            tags: tagsArray, // Include normalized tags array
            contentType: mimeType, // Add contentType
            category: category, // Add category
            expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null, // Include actual expiration date if set
          };
        });

        return {
          crates,
          lastCrateId:
            hasMore && docsToUse.length > 0
              ? docsToUse[docsToUse.length - 1].id
              : null,
          hasMore,
          content: [
            {
              type: "text",
              text: crates
                .map(
                  (c) =>
                    `ID: ${c.id}\nTitle: ${c.title || "Untitled"}\n` +
                    `Description: ${c.description || "No description"}\n` +
                    `Owner: ${c.ownerId || "anonymous"}\n` +
                    `Category: ${c.category || "N/A"}\n` +
                    `Content Type: ${c.contentType || "N/A"}\n` +
                    `Tags: ${c.tags && (Array.isArray(c.tags) ? c.tags.length > 0 : Object.keys(c.tags).length > 0) ? (Array.isArray(c.tags) ? c.tags : Object.values(c.tags)).join(", ") : "No tags"}\n`,
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
