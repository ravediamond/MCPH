// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createServiceRoleClient } from 'lib/supabaseClient';
import { MCP } from 'types/mcp'; // Kept for now, can be removed if not used elsewhere in this file after changes

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Define a local interface for the data structure we expect from Supabase
interface McpSitemapData {
    id: string; // Assuming 'id' is always present and a string for URL generation
    updated_at: string | null; // 'updated_at' can be a string or null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createServiceRoleClient();

    // Fetch dynamic MCP routes
    const { data: mcpsData, error } = await supabase
        .from('mcps')
        .select('id, updated_at')
        .eq('approved', true);

    if (error) {
        console.error('Error fetching MCPs for sitemap:', error);
        // Decide how to handle the error, maybe return only static routes or an empty array for mcpRoutes
    }

    const mcpRoutes = (mcpsData as McpSitemapData[] | null)?.map((mcp: McpSitemapData) => {
        // Ensure mcp.id is present for the URL
        if (!mcp.id) {
            return null; // Skip if id is missing, will be filtered out
        }
        return {
            url: `${BASE_URL}/mcp/${mcp.id}`,
            lastModified: mcp.updated_at ? new Date(mcp.updated_at) : new Date(), // Handles null updated_at by using current date
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        };
    }).filter(Boolean) as MetadataRoute.Sitemap // Filter out any nulls from map and assert type
        || []; // Fallback to empty array if mcpsData is null or map results in issues


    // Define static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
        { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
        { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
        { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
        { url: `${BASE_URL}/docs/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
        { url: `${BASE_URL}/docs/local-usage`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
        { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
        { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    ];

    return [
        ...staticRoutes,
        ...mcpRoutes,
    ];
}
