import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import lunr from 'lunr';
import { CACHE_REGIONS } from 'utils/cacheUtils';

// Initialize Upstash Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Cache TTL for search results (5 minutes)
const SEARCH_CACHE_TTL = 5 * 60;

export async function GET(request: Request) {
    const requestId = Math.random().toString(36).substring(2, 10);
    console.log(`[${requestId}] API Lunr Search request received:`, new URL(request.url).toString());

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // Add pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    console.log(`[${requestId}] Lunr Search params: query="${q || ''}", page=${page}, limit=${limit}`);

    // Limit to reasonable values to prevent abuse
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    const validatedPage = Math.max(page, 1);

    // Calculate offset for pagination
    const offset = (validatedPage - 1) * validatedLimit;

    try {
        // Attempt to load the Lunr index from Upstash
        const serializedIndex = await redis.get(`${CACHE_REGIONS.SEARCH}:lunr-index`) as string;
        const serializedDocs = await redis.get(`${CACHE_REGIONS.SEARCH}:lunr-documents`) as string;
        const indexMeta = await redis.get(`${CACHE_REGIONS.SEARCH}:lunr-meta`) as string;

        // If the index or documents don't exist, fall back to regular search
        if (!serializedIndex || !serializedDocs) {
            console.log(`[${requestId}] Lunr index not found in Upstash, redirecting to regular search`);
            return NextResponse.redirect(new URL(`/api/search?q=${q || ''}&page=${page}&limit=${limit}`, request.url));
        }

        // Load the Lunr index
        const index = lunr.Index.load(JSON.parse(serializedIndex));
        const documents = JSON.parse(serializedDocs);
        const meta = indexMeta ? JSON.parse(indexMeta) : { lastUpdated: 'unknown', documentCount: 0 };

        let results = [];
        let totalResults = 0;

        // If there's a query, search with Lunr
        if (q && q.trim() !== '') {
            try {
                // Perform the search with Lunr
                const searchResults = index.search(q);
                totalResults = searchResults.length;

                // Apply pagination to the results
                const paginatedResults = searchResults.slice(offset, offset + validatedLimit);

                // Map search results to full documents
                results = paginatedResults.map(result => {
                    const doc = documents[result.ref];
                    return {
                        ...doc,
                        score: result.score,
                        matches: result.matchData.metadata
                    };
                });

                console.log(`[${requestId}] Lunr search found ${totalResults} results (showing page ${validatedPage})`);
            } catch (searchError) {
                console.error(`[${requestId}] Lunr search error:`, searchError);
                // Fall back to returning all documents if the search query fails
                console.log(`[${requestId}] Invalid search query, falling back to all documents`);

                // Get all document IDs and apply sorting and pagination
                const allIds = Object.keys(documents);
                totalResults = allIds.length;

                // Sort by stars (descending)
                const sortedIds = allIds.sort((a, b) => {
                    return (documents[b].stars || 0) - (documents[a].stars || 0);
                });

                // Apply pagination
                const paginatedIds = sortedIds.slice(offset, offset + validatedLimit);

                // Get full documents for the paginated IDs
                results = paginatedIds.map(id => documents[id]);
            }
        } else {
            // No query provided, return all documents sorted by stars
            const allIds = Object.keys(documents);
            totalResults = allIds.length;

            // Sort by stars (descending)
            const sortedIds = allIds.sort((a, b) => {
                return (documents[b].stars || 0) - (documents[a].stars || 0);
            });

            // Apply pagination
            const paginatedIds = sortedIds.slice(offset, offset + validatedLimit);

            // Get full documents for the paginated IDs
            results = paginatedIds.map(id => documents[id]);
        }

        // Return the search results
        const response = {
            success: true,
            searchType: 'lunr',
            results,
            indexInfo: {
                lastUpdated: meta.lastUpdated,
                documentCount: meta.documentCount
            },
            pagination: {
                total: totalResults,
                page: validatedPage,
                limit: validatedLimit,
                pages: Math.ceil(totalResults / validatedLimit),
                hasNext: offset + validatedLimit < totalResults,
                hasPrev: validatedPage > 1
            }
        };

        console.log(`[${requestId}] Response ready to be returned to client`);
        return NextResponse.json(response);

    } catch (error) {
        console.error(`[${requestId}] Unexpected error in lunr search endpoint:`, error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error with Lunr search',
                error: String(error),
                fallback: true,
                redirectUrl: `/api/search?q=${q || ''}&page=${page}&limit=${limit}`
            },
            { status: 500 }
        );
    }
}