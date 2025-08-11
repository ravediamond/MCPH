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
        "Searches your crates using text-based search. The search covers title, description, and metadata fields.\n\n" +
        "SEARCH PARAMETERS:\n" +
        "• query: Search terms for content matching\n" +
        "• category: Filter by ecosystem category (optional)\n" +
        "• limit: Maximum results to return (1-50, default: 10)\n\n" +
        "CATEGORY FILTERING:\n" +
        "Filter by ecosystem categories:\n" +
        "• image: Visual content\n" +
        "• data: Actual data files\n" +
        "• data_source: Information access points\n" +
        "• visualization: Charts & graphs\n" +
        "• recipe: AI agent instructions\n" +
        "• knowledge: Documentation & guides\n" +
        "• tools: Available resources\n" +
        "• code: Code snippets & examples\n" +
        "• others: Everything else\n\n" +
        "SEARCH TIPS for AI tools:\n" +
        "• Filter by category: use category parameter for specific content types\n\n" +
        "The search uses:\n" +
        "• Text-based search on the searchField (a combination of title, description, and metadata)\n\n" +
        "AI usage examples:\n" +
        "• \"search my crates for 'report'\"\n" +
      inputSchema: SearchParams.shape,
    },
    async (
      {
        query,
        category,
        limit = 10,
      }: {
        query: string;
        category?: CrateCategory;
        limit?: number;
      },
      extra?: any,
    ) => {
      // Implementation of enhanced search with structured tag filtering

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

      console.log("[crates_search] Using UID for query:", uid);

      // Log service account usage for metrics
      if (uid === "__nobody__") {
        console.log(
          "[crates_search] Service account (API key only) access detected",
        );
      }

      // Simplified for v1 - text search only (no vector search)
      let topK = limit || 10;
      let query_ref = db
        .collection(CRATES_COLLECTION)
        .where("ownerId", "==", uid);

      // Add category filter if provided
      if (category) {
        console.log(`[crates_search] Filtering by category: ${category}`);
        query_ref = query_ref.where("category", "==", category);
      }

      // Apply text search filter
      const textQuery = query.toLowerCase();
      if (textQuery.trim() !== "") {
        query_ref = query_ref
          .where("searchField", ">=", textQuery)
          .where("searchField", "<=", textQuery + "\uf8ff");
      }

      // Execute the query
      const classicalSnapshot = await query_ref.limit(topK).get();

      let allCrates = classicalSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Pure text search case - handled by Firestore query
      if (textQuery.trim() !== "") {
        console.log(
          `[crates_search] Text search was handled by Firestore query`,
        );
      }

      // Sort results by title for consistent ordering
      allCrates.sort((a: any, b: any) => {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleA.localeCompare(titleB);
      });

      // Limit to topK results after in-memory filtering and scoring
      allCrates = allCrates.slice(0, topK);

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
        const { embedding, searchField, gcsPath, _score, ...filteredData } =
          data;

        // Access potentially undefined properties safely
        const mimeType = data.mimeType;
        const category = data.category;

        return {
          id,
          ...filteredData,
          contentType: mimeType, // Use safely extracted mimeType
          category: category, // Use safely extracted category
          expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null, // Include actual expiration date if set
        };
      });

      // Format the search metadata for display
      const searchMetadata = {
        query: textQuery,
        totalResults: crates.length,
        limit: topK,
      };

      return {
        crates,
        searchMetadata,
        content: [
          {
            type: "text",
            text:
              crates.length > 0
                ? `Found ${crates.length} crates matching your search criteria:\n\n` +
                  crates
                    .map(
                      (c) =>
                        `ID: ${c.id}\nTitle: ${c.title || "Untitled"}\n` +
                        `Description: ${c.description || "No description"}\n` +
                        `Owner: ${c.ownerId || "anonymous"}\n` +
                        `Category: ${c.category || "N/A"}\n` +
                        `Content Type: ${c.contentType || "N/A"}\n` +
                    )
                    .join("\n---\n")
                : `No crates found matching "${query}"`,
          },
        ],
      };
    },
  );
}
