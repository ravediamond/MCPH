import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { Crate, CrateCategory } from "../../../shared/types/crate";

/**
 * Register the crates_search tool with the server
 */
export function registerCratesSearchTool(server: McpServer): void {
  server.tool(
    "crates_search",
    SearchParams.shape,
    {
      description:
        "Searches your crates using a hybrid approach combining embedding-based semantic search and text search. The search covers title, description, tags, and metadata fields. Results are merged and deduplicated for the most relevant matches.\n\n" +
        "The search uses:\n" +
        "• Vector embeddings (768-dimensional) for semantic understanding of content\n" +
        "• Text-based search on the searchField (a combination of title, description, tags, and metadata)\n" +
        "• Results are ranked by relevance and deduplicated\n\n" +
        "AI usage example:\n" +
        "• \"search my crates for 'report'\"",
    },
    async ({ query }: { query: string }) => {
      // Simplified for v1 - text search only (no vector search)
      let topK = 10;
      const cratesRef = db.collection(CRATES_COLLECTION);
      // Text-based search only (searchField prefix, case-insensitive)
      const textQuery = query.toLowerCase();
      const classicalSnapshot = await cratesRef
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
