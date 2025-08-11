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
        "Searches your crates using text-based search. The search covers title, description, tags, and metadata fields.\n\n" +
        "SEARCH PARAMETERS:\n" +
        "• query: Search terms for content matching\n" +
        "• tags: Array of tags to filter by (optional)\n" +
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
        "• Search by project: 'project:website-redesign' using tags parameter\n" +
        '• Combine tags: "project:chatbot type:code" or use tags parameter\n' +
        "• Filter by category: use category parameter for specific content types\n\n" +
        "The search uses:\n" +
        "• Text-based search on the searchField (a combination of title, description, tags, and metadata)\n" +
        "• Structured tag filtering for precise organization-based searches\n\n" +
        "AI usage examples:\n" +
        "• \"search my crates for 'report'\"\n" +
        '• "search my crates with tags ["project:website", "status:final"] for \'authentication\'"',
      inputSchema: SearchParams.shape,
    },
    async (
      {
        query,
        tags,
        category,
        limit = 10,
      }: {
        query: string;
        tags?: string[];
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

      // Apply text search filter only if no tags are specified
      // When tags are provided, we need to do in-memory filtering anyway,
      // so we skip the text search at the Firestore level to avoid missing results
      // where the query text exists only in tags but not in title/description/metadata
      const textQuery = query.toLowerCase();
      if (textQuery.trim() !== "" && (!tags || tags.length === 0)) {
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

      // Apply text search in memory if we skipped it at Firestore level due to tags
      if (textQuery.trim() !== "" && tags && tags.length > 0) {
        console.log(
          `[crates_search] Applying text search in memory due to tag filtering`,
        );
      }

      // Apply tag filtering and text search in memory when tags are provided
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

          // When tags are provided AND there's a text query, also check if the text matches
          // Check searchField OR check if text exists in normalized tags
          if (hasAllTags && textQuery.trim() !== "") {
            const searchField = (crate.searchField || "").toLowerCase();
            const textInSearchField = searchField.includes(textQuery);
            const textInTags = normalizedCrateTags.some((tag) =>
              tag.includes(textQuery),
            );

            console.log(
              `[crates_search] Crate ${crate.id} text match check: query='${textQuery}' searchField='${textInSearchField}' tags='${textInTags}'`,
            );

            return textInSearchField || textInTags;
          }

          return hasAllTags;
        });

        console.log(
          `[crates_search] After tag filtering: ${allCrates.length} crates remain`,
        );
      } else if (textQuery.trim() !== "" && (!tags || tags.length === 0)) {
        // Pure text search case - this should have been handled by Firestore query
        // but we include this for completeness and debugging
        console.log(
          `[crates_search] Text-only search was handled by Firestore query`,
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
                        `Tags: ${c.tags && c.tags.length > 0 ? c.tags.join(", ") : "No tags"}\n`,
                    )
                    .join("\n---\n")
                : `No crates found matching "${query}"${tags?.length ? ` with tags [${tags.join(", ")}]` : ""}`,
          },
        ],
      };
    },
  );
}
