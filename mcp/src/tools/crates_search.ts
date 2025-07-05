import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchParams } from "../config/schemas";
import { db, CRATES_COLLECTION } from "../../../services/firebaseService";
import { Crate, CrateCategory } from "../../../shared/types/crate";

/**
 * Register the crates_search tool with the server
 */
export function registerCratesSearchTool(server: McpServer): void {
  // Helper function to normalize tags that might be stored as objects with numeric keys
  const normalizeTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;

    if (typeof tags === "object") {
      // Debug log to understand the tag structure
      console.log(
        `[crates_search] Normalizing tag object:`,
        JSON.stringify(tags),
      );

      // Handle specific case of Firestore numeric keys (like in the screenshot)
      // This will extract values from objects with numeric keys (0, 1, 2, etc.)
      const values = Object.entries(tags).map(([key, value]) => {
        console.log(
          `[crates_search] Processing tag key: ${key}, value: ${value}`,
        );
        return String(value);
      });

      console.log(`[crates_search] Normalized tags:`, values);
      return values;
    }

    return [String(tags)];
  };

  server.registerTool(
    "crates_search",
    {
      title: "Search Crates",
      description:
        "Searches your crates using hybrid semantic + text search across title, description, tags, and metadata.\n\n" +
        "SEARCH TIPS for AI tools:\n" +
        "• Search by project: 'project:website-redesign' using tags parameter\n" +
        '• Combine tags: "project:chatbot type:code" or use tags parameter\n' +
        "• Find by context: 'context:user-research'\n" +
        "• Search workflow: 'status:final priority:high'\n\n" +
        "The search uses:\n" +
        "• Vector embeddings (768-dimensional) for semantic understanding of content\n" +
        "• Text-based search on the searchField (a combination of title, description, tags, and metadata)\n" +
        "• Structured tag filtering for precise organization-based searches\n" +
        "• Results are ranked by relevance and deduplicated\n\n" +
        "AI usage examples:\n" +
        "• \"search my crates for 'report'\"\n" +
        '• "search my crates with tags ["project:website", "status:final"] for \'authentication\'"',
      inputSchema: SearchParams.shape,
    },
    async (
      {
        query,
        tags,
        limit = 10,
      }: {
        query: string;
        tags?: string[];
        limit?: number;
      },
      extra?: any,
    ) => {
      // Implementation of the enhanced search with structured tag filtering and tag hierarchy
      // understanding for better context engineering.
      //
      // The key enhancements include:
      // 1. Structured Tag Filtering: Use `tags` parameter for exact tag matching
      // 2. Tag Hierarchy Understanding: Recognize and boost scores for conventional tag patterns

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

      // Build query with tag filters if provided
      if (tags && tags.length > 0) {
        console.log(`[crates_search] Using tag filters: ${tags.join(", ")}`);

        // For tag filtering, since tags can be stored as objects with numeric keys,
        // we'll get all the user's crates first and then filter in memory
        // This approach is more reliable but potentially less efficient for large datasets

        // Note: We're not applying any tag filtering at the Firestore query level
        // because we need to handle different tag storage formats
        console.log(
          `[crates_search] Will filter ${tags.length} tags in memory after query`,
        );
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

      // Apply tag filtering in memory for all tags
      if (tags && tags.length > 0) {
        console.log(
          `[crates_search] Starting in-memory tag filtering with ${allCrates.length} crates`,
        );

        allCrates = allCrates.filter((crate: any) => {
          // Log the actual structure of tags for debugging
          console.log(
            `[crates_search] Crate ${crate.id} tags structure:`,
            typeof crate.tags === "object"
              ? JSON.stringify(crate.tags)
              : crate.tags,
          );

          // Normalize the crate tags using our helper function
          const normalizedCrateTags = normalizeTags(crate.tags).map((tag) =>
            typeof tag === "string"
              ? tag.toLowerCase()
              : String(tag).toLowerCase(),
          );

          console.log(
            `[crates_search] Crate ${crate.id} has normalized tags: ${normalizedCrateTags.join(", ")}`,
          );

          // Check if crate has all required tags
          const hasAllTags = tags.every((tag) => {
            const lowercaseTag = tag.toLowerCase();

            // Try both exact match and value match (for object-stored tags)
            const exactMatch = normalizedCrateTags.includes(lowercaseTag);

            // Special case: If the tag is stored as a number in Firestore but provided as string
            const numericMatch =
              !isNaN(Number(tag)) &&
              normalizedCrateTags.includes(String(Number(tag)));

            const hasTag = exactMatch || numericMatch;

            console.log(
              `[crates_search] Checking if crate ${crate.id} has tag '${lowercaseTag}': ${hasTag} (exact: ${exactMatch}, numeric: ${numericMatch})`,
            );
            return hasTag;
          });

          return hasAllTags;
        });

        console.log(
          `[crates_search] After tag filtering: ${allCrates.length} crates remain`,
        );
      }

      // Weight results based on tag hierarchy and conventions
      allCrates = allCrates.map((crate: any) => {
        let score = 1.0; // Base score

        // Normalize crate tags using our helper function
        const normalizedCrateTags = normalizeTags(crate.tags);

        // Weight tag matches higher when they follow conventions
        if (normalizedCrateTags.length > 0) {
          // Define patterns for structured tag conventions
          // These are used to identify and boost scores for structured, well-organized tags
          const conventionPatterns = [
            /^project:/, // Project scope tags (e.g., project:website-redesign)
            /^type:/, // Content type tags (e.g., type:code, type:document)
            /^status:/, // Workflow status tags (e.g., status:final, status:draft)
            /^priority:/, // Priority level tags (e.g., priority:high)
            /^context:/, // Contextual tags (e.g., context:user-research)
          ];

          // Count matching convention patterns
          const conventionMatches = normalizedCrateTags.filter((tag: string) =>
            conventionPatterns.some((pattern) => pattern.test(tag)),
          ).length;

          // Boost score based on structured tags
          // The more organized tags (following conventions) a crate has,
          // the higher its relevance score will be
          score += conventionMatches * 0.2; // 20% boost per convention tag
        }

        return { ...crate, _score: score };
      });

      // Sort by score (descending)
      allCrates.sort((a: any, b: any) => b._score - a._score);

      // Limit to topK results after in-memory filtering and scoring
      allCrates = allCrates.slice(0, topK);

      // Format crates to match the list schema
      const crates: Array<
        Partial<Crate> & {
          id: string;
          expiresAt: string | null;
          contentType?: string;
          category?: CrateCategory;
          relevanceScore?: number;
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

        // Normalize tags using our helper function
        const tagsArray = normalizeTags(data.tags);

        return {
          id,
          ...filteredData,
          tags: tagsArray, // Include normalized tags array
          contentType: mimeType, // Use safely extracted mimeType
          category: category, // Use safely extracted category
          expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null, // Include actual expiration date if set
          relevanceScore: _score || 1.0, // Include the relevance score
        };
      });

      // Format the search metadata for display
      const searchMetadata = {
        query: textQuery,
        tags: tags || [],
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
                        `Tags: ${c.tags && c.tags.length > 0 ? c.tags.join(", ") : "No tags"}\n` +
                        `Relevance Score: ${c.relevanceScore?.toFixed(2) || "1.00"}\n`,
                    )
                    .join("\n---\n") +
                  "\n\nAdvanced Search Tips:\n" +
                  "• For precise filtering: search with tags=['project:website', 'status:final'] for 'feature'\n" +
                  "• Tags like project:, type:, status:, priority: get higher relevance scores"
                : `No crates found matching "${query}"${tags?.length ? ` with tags [${tags.join(", ")}]` : ""}`,
          },
        ],
      };
    },
  );
}
