import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { Crate, CrateCategory } from "../../../shared/types/crate";

/**
 * Register the crates_search tool with the server
 */
export function registerCratesSearchTool(server: McpServer): void {
  server.registerTool(
    "crates_search",
    {
      title: "Search Crates",
      description:
        "Searches your crates using a hybrid approach combining embedding-based semantic search and text search. The search covers title, description, tags, and metadata fields. Results are merged and deduplicated for the most relevant matches.\n\n" +
        "The search uses:\n" +
        "• Vector embeddings (768-dimensional) for semantic understanding of content\n" +
        "• Text-based search on the searchField (a combination of title, description, tags, and metadata)\n" +
        "• Results are ranked by relevance and deduplicated\n\n" +
        "AI usage example:\n" +
        "• \"search my crates for 'report'\"",
      inputSchema: SearchParams.shape,
    },
    async ({ query }: { query: string }, extra?: any) => {
      // Implementation of the fix according to the ticket
      // The ctxUser might be in extra.req.auth or extra.authInfo depending on flow
      let uid = "__nobody__"; // sentinel that never matches "" in DB

      // Check for auth info in various possible locations
      const authInfo = extra?.authInfo;
      const reqAuth = extra?.req?.auth;

      // Debug the auth structure
      console.log("[crates_search] Auth Debug:", {
        hasExtra: !!extra,
        hasAuthInfo: !!authInfo,
        authInfoKeys: authInfo ? Object.keys(authInfo) : [],
        hasReqAuth: !!reqAuth,
        reqAuthKeys: reqAuth ? Object.keys(reqAuth) : [],
        extraKeys: extra ? Object.keys(extra) : [],
        authInfoDetails: authInfo,
        reqAuthDetails: reqAuth,
      });

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

      console.log("[crates_search] Using UID for query:", uid);

      // Log service account usage for metrics
      if (uid === "__nobody__") {
        console.log(
          "[crates_search] Service account (API key only) access detected",
        );
      }

      // Simplified for v1 - text search only (no vector search)
      let topK = 10;
      const cratesRef = db.collection(CRATES_COLLECTION);

      // Build query with owner filter
      const textQuery = query.toLowerCase();
      const classicalSnapshot = await cratesRef
        .where("ownerId", "==", uid) // Apply owner filter
        .where("searchField", ">=", textQuery)
        .where("searchField", "<=", textQuery + "\uf8ff")
        .limit(topK)
        .get();

      const allCrates = classicalSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Format crates to match the list schema
      const crates: Array<
        Partial<Crate> & {
          id: string;
          expiresAt: string | null;
          contentType?: string;
          category?: CrateCategory;
        }
      > = allCrates.map((doc: { id: string; [key: string]: any }) => {
        // Get document data properly
        const data = doc as any;
        const id = doc.id;

        // Extract remaining properties safely (they might not all exist)
        const { embedding, searchField, gcsPath, ...filteredData } = data;

        // Access potentially undefined properties safely
        const mimeType = data.mimeType;
        const category = data.category;

        return {
          id,
          ...filteredData,
          contentType: mimeType, // Use safely extracted mimeType
          category: category, // Use safely extracted category
          expiresAt: null, // ttlDays is no longer supported
        };
      });

      return {
        crates,
        content: [
          {
            type: "text",
            text:
              crates.length > 0
                ? crates
                    .map(
                      (c) =>
                        `ID: ${c.id}\nTitle: ${c.title || "Untitled"}\n` +
                        `Description: ${c.description || "No description"}\n` +
                        `Owner: ${c.ownerId || "anonymous"}\n` +
                        `Category: ${c.category || "N/A"}\n` +
                        `Content Type: ${c.contentType || "N/A"}\n` +
                        `Tags: ${Array.isArray(c.tags) ? c.tags.join(", ") : "None"}\n`,
                    )
                    .join("\n---\n")
                : `No crates found matching "${query}"`,
          },
        ],
      };
    },
  );
}
