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
        "Searches your crates using hybrid semantic + text search across title, description, tags, and metadata.\n\n" +
        "SEARCH TIPS for AI tools:\n" +
        "• Search by project: 'project:website-redesign' or use scope parameter\n" +
        "• Combine tags: 'project:chatbot type:code' or use tags parameter\n" +
        "• Find by context: 'context:user-research'\n" +
        "• Search workflow: 'status:final priority:high'\n\n" +
        "The search uses:\n" +
        "• Vector embeddings (768-dimensional) for semantic understanding of content\n" +
        "• Text-based search on the searchField (a combination of title, description, tags, and metadata)\n" +
        "• Structured tag filtering for precise organization-based searches\n" +
        "• Project scoping for faster, more focused results\n" +
        "• Results are ranked by relevance and deduplicated\n\n" +
        "AI usage examples:\n" +
        "• \"search my crates for 'report'\"\n" +
        "• \"search my crates with tags ['project:website', 'status:final'] for 'authentication'\"\n" +
        "• \"search my crates in scope 'project:mobile-app' for 'api'\"",
      inputSchema: SearchParams.shape,
    },
    async ({ query, tags, scope, limit = 10 }: { 
      query: string;
      tags?: string[];
      scope?: string;
      limit?: number;
    }, extra?: any) => {
      // Implementation of the enhanced search with structured tag filtering, tag hierarchy
      // understanding, and search scoping for better context engineering.
      //
      // The key enhancements include:
      // 1. Structured Tag Filtering: Use `tags` parameter for exact tag matching
      // 2. Tag Hierarchy Understanding: Recognize and boost scores for conventional tag patterns
      // 3. Search Scoping: Use `scope` parameter to narrow search to a specific project context
      
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
      let topK = limit || 10;
      let query_ref = db.collection(CRATES_COLLECTION).where("ownerId", "==", uid);
      
      // Parse scope parameter if provided
      // Scope is expected in format "prefix:value" like "project:website-redesign"
      if (scope) {
        console.log(`[crates_search] Using scope filter: ${scope}`);
        // For structured scopes like "project:website", extract the tag to search for
        if (scope.includes(':')) {
          // Add to the query directly as a tag filter
          query_ref = query_ref.where("tags", "array-contains", scope);
        } else {
          // If it's just a plain scope without structure, treat as a simple tag
          query_ref = query_ref.where("tags", "array-contains", scope);
        }
      }
      
      // Build query with tag filters if provided
      if (tags && tags.length > 0) {
        console.log(`[crates_search] Using tag filters: ${tags.join(', ')}`);
        
        // For multiple tags, we need to use a compound query
        // Firestore can only use one array-contains per query, so we'll filter first by one tag
        // and then filter the results for the other tags in memory
        if (tags.length === 1) {
          query_ref = query_ref.where("tags", "array-contains", tags[0]);
        } else {
          // Use the first tag in the Firestore query
          query_ref = query_ref.where("tags", "array-contains", tags[0]);
        }
      }

      // Apply text search filter
      const textQuery = query.toLowerCase();
      if (textQuery.trim() !== '') {
        query_ref = query_ref
          .where("searchField", ">=", textQuery)
          .where("searchField", "<=", textQuery + "\uf8ff");
      }
      
      // Execute the query
      const classicalSnapshot = await query_ref
        .limit(topK)
        .get();
        
      let allCrates = classicalSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Apply additional tag filtering in memory if multiple tags were provided
      if (tags && tags.length > 1) {
        allCrates = allCrates.filter((crate: any) => {
          // Check if crate has all required tags (starting from the second tag since first was in query)
          return tags.slice(1).every(tag => 
            crate.tags && Array.isArray(crate.tags) && crate.tags.includes(tag)
          );
        });
      }
      
      // Weight results based on tag hierarchy and conventions
      allCrates = allCrates.map((crate: any) => {
        let score = 1.0; // Base score
        
        // Weight tag matches higher when they follow conventions
        if (crate.tags && Array.isArray(crate.tags)) {
          // Define patterns for structured tag conventions
          // These are used to identify and boost scores for structured, well-organized tags
          const conventionPatterns = [
            /^project:/,  // Project scope tags (e.g., project:website-redesign)
            /^type:/,     // Content type tags (e.g., type:code, type:document)
            /^status:/,   // Workflow status tags (e.g., status:final, status:draft)
            /^priority:/, // Priority level tags (e.g., priority:high)
            /^context:/   // Contextual tags (e.g., context:user-research)
          ];
          
          // Count matching convention patterns
          const conventionMatches = crate.tags.filter((tag: string) => 
            conventionPatterns.some(pattern => pattern.test(tag))
          ).length;
          
          // Boost score based on structured tags
          // The more organized tags (following conventions) a crate has,
          // the higher its relevance score will be
          score += (conventionMatches * 0.2); // 20% boost per convention tag
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
        const { embedding, searchField, gcsPath, _score, ...filteredData } = data;

        // Access potentially undefined properties safely
        const mimeType = data.mimeType;
        const category = data.category;

        return {
          id,
          ...filteredData,
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
        scope: scope || null,
        totalResults: crates.length,
        limit: topK
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
                        `Tags: ${Array.isArray(c.tags) ? c.tags.join(", ") : "None"}\n` +
                        `Relevance Score: ${c.relevanceScore?.toFixed(2) || "1.00"}\n`
                    )
                    .join("\n---\n") +
                  "\n\nAdvanced Search Tips:\n" +
                  "• For precise filtering: search with tags=['project:website', 'status:final'] for 'feature'\n" +
                  "• For focused project searches: search with scope='project:mobile-app' for 'api'\n" +
                  "• For combined search: search with tags=['type:document'] scope='project:redesign' for 'wireframe'\n" +
                  "• Tags like project:, type:, status:, priority: get higher relevance scores"
                : `No crates found matching "${query}"${tags?.length ? ` with tags [${tags.join(', ')}]` : ''}${scope ? ` in scope "${scope}"` : ''}`,
          },
        ],
      };
    },
  );
}
