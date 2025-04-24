import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchReadmeFromGitHub, invalidateGitHubCache } from 'services/githubService';
import { cache } from 'utils/cacheUtils';

// Cache key for recently refreshed MCPs to prevent duplicate refreshes
const createRecentlyRefreshedKey = (mcpId: string) => `recently-refreshed:${mcpId}`;
const REFRESH_COOLDOWN = 30 * 1000; // 30 seconds cooldown between refreshes

export async function POST(request: Request) {
    try {
        // Authenticate the user
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = session.user;
        const { mcpId } = await request.json();

        if (!mcpId) {
            return NextResponse.json({ error: 'MCP ID is required' }, { status: 400 });
        }

        // Check for refresh cooldown to prevent spamming the API
        const cooldownKey = createRecentlyRefreshedKey(mcpId);
        const recentlyRefreshed = cache.get(cooldownKey);

        if (recentlyRefreshed !== undefined && recentlyRefreshed !== null) {
            return NextResponse.json({
                success: false,
                error: 'This MCP was recently refreshed',
                details: 'Please wait a moment before refreshing again',
                cooldownRemaining: true
            }, { status: 429 });
        }

        // Get user profile and MCP data in parallel to reduce latency
        const [profileResponse, mcpResponse] = await Promise.all([
            supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', currentUser.id)
                .single(),

            supabase
                .from('mcps')
                .select('id, user_id, owner_username, repository_name, repository_url')
                .eq('id', mcpId)
                .single()
        ]);

        const profile = profileResponse.data;
        const mcp = mcpResponse.data;
        const mcpError = mcpResponse.error;

        if (mcpError || !mcp) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        // Check if user has permission to refresh this README
        if (!profile?.is_admin && mcp.user_id !== currentUser.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Extract repository info
        let owner = '';
        let repo = '';

        if (mcp.owner_username && mcp.repository_name) {
            owner = mcp.owner_username;
            repo = mcp.repository_name;
        } else {
            // Parse from repository_url as fallback
            try {
                const repoUrl = new URL(mcp.repository_url);
                const pathParts = repoUrl.pathname.split('/').filter(Boolean);
                if (repoUrl.hostname === 'github.com' && pathParts.length >= 2) {
                    owner = pathParts[0];
                    repo = pathParts[1];
                } else {
                    throw new Error('Unable to parse repository information');
                }
            } catch (e) {
                await logError('README refresh', `Failed to parse repository URL for MCP ${mcpId}`, e);
                return NextResponse.json({ error: 'Invalid repository URL format' }, { status: 400 });
            }
        }

        try {
            // Set the cooldown key early to prevent concurrent refresh requests
            cache.set(cooldownKey, true, { ttl: REFRESH_COOLDOWN });

            // Invalidate GitHub cache to ensure fresh data
            invalidateGitHubCache(owner, repo);

            // Fetch the README from GitHub
            const readme = await fetchReadmeFromGitHub(owner, repo);
            const lastRefreshed = new Date().toISOString();

            // Update the MCP with the new README and refresh timestamp
            const { error: updateError } = await supabase
                .from('mcps')
                .update({
                    readme,
                    last_refreshed: lastRefreshed,
                    owner_username: owner,
                    repository_name: repo
                })
                .eq('id', mcpId);

            if (updateError) {
                throw updateError;
            }

            return NextResponse.json({
                success: true,
                message: 'README refreshed successfully'
            });
        } catch (error: any) {
            // If there's an error, remove the cooldown to allow retries
            cache.delete(cooldownKey);

            // Check if this is a rate limit error
            if (error.message && error.message.includes('rate limit exceeded')) {
                // Log rate limit specifically
                await logError('GitHub Rate Limit', `Rate limit exceeded while refreshing MCP ${mcpId}`, error);

                // Extract reset time if available in the error message
                let resetTime = 'some time';
                const resetMatch = error.message.match(/Reset time: ([^.]+)/);
                if (resetMatch && resetMatch[1]) {
                    resetTime = resetMatch[1];
                }

                return NextResponse.json({
                    error: 'GitHub API rate limit exceeded',
                    details: `Please try again after ${resetTime}. This is a GitHub limitation.`,
                    isRateLimit: true
                }, { status: 429 }); // Use 429 Too Many Requests for rate limiting
            }

            await logError('README refresh', `Failed to fetch README for MCP ${mcpId}`, error);
            return NextResponse.json({
                error: 'Failed to fetch README from GitHub',
                details: error.message
            }, { status: 500 });
        }
    } catch (error: any) {
        await logError('README refresh', 'Unexpected error', error);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error.message
        }, { status: 500 });
    }
}

async function logError(type: string, message: string, error: any) {
    // Simple logging to console since error_logs table doesn't exist in DB schema
    console.error(`[${type}] ${message}:`, error);
}