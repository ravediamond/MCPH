import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceRoleClient } from '@/lib/supabaseClient';
import { MCP } from 'types/mcp';
import { createClient } from '@supabase/supabase-js';
import { fetchComprehensiveRepoData } from 'services/githubService';
import { githubRateLimiter } from 'utils/githubRateLimiter';

// Define the batch size for processing MCPs
const DEFAULT_BATCH_SIZE = 3;

export async function POST(request: Request) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        let session;

        // Create a service role client that can bypass RLS
        const supabaseAdmin = createServiceRoleClient();

        // If Authorization header is present, use it to get the session
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.replace('Bearer ', '');

            // Create a special supabase client with the access token
            const supabaseWithAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                }
            );

            const { data, error } = await supabaseWithAuth.auth.getUser();
            if (error || !data.user) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            // Use the user from the token
            const currentUser = data.user;

            // Check if user is an admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', currentUser.id)
                .single();

            if (profileError || !profile?.is_admin) {
                return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
            }

            // Get MCPs data and overwrite flag from request body
            const { mcps, overwrite } = await request.json();

            if (!mcps || !Array.isArray(mcps) || mcps.length === 0) {
                return NextResponse.json({ error: 'Invalid MCPs data format' }, { status: 400 });
            }

            // Log GitHub rate limit info at the start
            const rateLimitInfo = githubRateLimiter.getRateLimitInfo();
            console.log(`Starting batch import with ${mcps.length} MCPs. GitHub rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining. Reset at ${rateLimitInfo.resetTime}`);

            // Results tracking
            const results = {
                success: 0,
                skipped: 0,
                updated: 0, // For tracking overwritten MCPs
                failed: 0,
                errors: [] as string[]
            };

            // Process MCPs in small batches to respect API limits
            const batchSize = Math.min(DEFAULT_BATCH_SIZE, mcps.length);
            const numBatches = Math.ceil(mcps.length / batchSize);

            console.log(`Will process MCPs in ${numBatches} batches of ${batchSize} each`);

            // Process each batch
            for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
                const startIdx = batchIndex * batchSize;
                const endIdx = Math.min(startIdx + batchSize, mcps.length);
                const batch = mcps.slice(startIdx, endIdx);

                console.log(`Processing batch ${batchIndex + 1}/${numBatches} with ${batch.length} MCPs`);

                // Process each MCP in the batch concurrently
                const batchPromises = batch.map(async (mcp) => {
                    try {
                        // Validate required fields
                        if (!mcp.name || !mcp.repository_url || !mcp.author) {
                            results.failed++;
                            results.errors.push(`MCP "${mcp.name || 'unnamed'}" is missing required fields`);
                            return;
                        }

                        // --- Check if MCP already exists ---
                        const { data: existingMcp, error: checkError } = await supabaseAdmin
                            .from('mcps')
                            .select('id')
                            .eq('repository_url', mcp.repository_url)
                            .maybeSingle();

                        if (checkError) {
                            console.error('Error checking for existing MCP:', checkError);
                            results.failed++;
                            results.errors.push(`Error checking existence for MCP "${mcp.name}": ${checkError.message}`);
                            return; // Skip this MCP if check fails
                        }

                        // Create a copy of the MCP object for enrichment
                        const mcpData = { ...mcp };

                        // Extract basic owner/repo info from URL regardless of GitHub API
                        try {
                            const repoUrl = new URL(mcp.repository_url);
                            const pathParts = repoUrl.pathname.split('/').filter(Boolean);

                            if (pathParts.length >= 2 && (repoUrl.hostname === 'github.com' || repoUrl.hostname === 'www.github.com')) {
                                mcpData.owner_username = pathParts[0];
                                mcpData.repository_name = pathParts[1];
                            }
                        } catch (error) {
                            console.error('Error parsing repository URL:', error);
                        }

                        // Try to fetch GitHub data but continue if it fails
                        try {
                            console.log(`Fetching GitHub data for ${mcp.name} (${mcp.repository_url})`);

                            // Use our new rate-limited API fetch
                            const repoData = await fetchComprehensiveRepoData(mcp.repository_url);

                            // Enrich the MCP with GitHub data
                            mcpData.readme = repoData.readme;
                            mcpData.owner_username = repoData.owner || mcpData.owner_username;
                            mcpData.repository_name = repoData.repo || mcpData.repository_name;
                            mcpData.stars = repoData.stars;
                            mcpData.forks = repoData.forks;
                            mcpData.open_issues = repoData.open_issues;
                            mcpData.last_repo_update = repoData.last_repo_update;
                            mcpData.last_refreshed = new Date().toISOString();

                            console.log(`GitHub data fetched for ${mcp.name}. Stars: ${repoData.stars}`);
                        } catch (e) {
                            console.error(`Error fetching GitHub data for ${mcp.name}:`, e);
                            // Continue with import despite GitHub API errors
                            results.errors.push(`Warning for "${mcp.name}": Could not fetch complete GitHub data - ${(e as Error).message || 'Unknown error'}`);
                        }

                        // Handle based on existence and overwrite flag
                        if (existingMcp) {
                            // MCP exists - either update it or skip based on overwrite flag
                            if (overwrite) {
                                // Update the existing MCP
                                const { error: updateError } = await supabaseAdmin
                                    .from('mcps')
                                    .update({
                                        name: mcpData.name,
                                        description: mcpData.description || '',
                                        repository_url: mcpData.repository_url,
                                        owner_username: mcpData.owner_username,
                                        repository_name: mcpData.repository_name,
                                        author: mcpData.author,
                                        tags: mcpData.tags || [],
                                        user_id: mcpData.user_id || currentUser.id,
                                        is_mcph_owned: mcpData.is_mcph_owned !== undefined ? mcpData.is_mcph_owned : false,
                                        view_count: mcpData.view_count || 0,
                                        readme: mcpData.readme || '',
                                        stars: mcpData.stars || 0,
                                        forks: mcpData.forks || 0,
                                        open_issues: mcpData.open_issues || 0,
                                        last_repo_update: mcpData.last_repo_update,
                                        last_refreshed: mcpData.last_refreshed
                                    } as any)
                                    .eq('id', existingMcp.id);

                                if (updateError) {
                                    throw updateError;
                                }

                                results.updated++;
                            } else {
                                // Skip if the MCP exists and overwrite is false
                                results.skipped++;
                                results.errors.push(`MCP "${mcp.name}" already exists (URL: ${mcp.repository_url}). Skipped.`);
                            }
                        } else {
                            // Insert new MCP
                            const { error: insertError } = await supabaseAdmin
                                .from('mcps')
                                .insert({
                                    name: mcpData.name,
                                    description: mcpData.description || '',
                                    repository_url: mcpData.repository_url,
                                    owner_username: mcpData.owner_username,
                                    repository_name: mcpData.repository_name,
                                    author: mcpData.author,
                                    tags: mcpData.tags || [],
                                    user_id: mcpData.user_id || currentUser.id,
                                    is_mcph_owned: mcpData.is_mcph_owned !== undefined ? mcpData.is_mcph_owned : false,
                                    view_count: mcpData.view_count || 0,
                                    readme: mcpData.readme || '',
                                    stars: mcpData.stars || 0,
                                    forks: mcpData.forks || 0,
                                    open_issues: mcpData.open_issues || 0,
                                    last_repo_update: mcpData.last_repo_update,
                                    last_refreshed: mcpData.last_refreshed
                                } as any);

                            if (insertError) {
                                throw insertError;
                            }

                            results.success++;
                        }
                    } catch (error) {
                        console.error('Error importing MCP:', error);
                        results.failed++;
                        results.errors.push(`Failed to import MCP "${mcp.name || 'unnamed'}": ${(error as Error).message || 'Unknown error'}`);
                    }
                });

                // Wait for all MCPs in this batch to complete before moving to next batch
                await Promise.all(batchPromises);

                // Log batch completion status
                console.log(`Completed batch ${batchIndex + 1}/${numBatches}. Current results: ${results.success} imported, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);

                // Log current GitHub API rate limit 
                const currentLimitInfo = githubRateLimiter.getRateLimitInfo();
                console.log(`GitHub API rate limit after batch: ${currentLimitInfo.remaining}/${currentLimitInfo.limit} requests remaining`);

                // If this isn't the last batch, wait a moment before processing the next one
                if (batchIndex < numBatches - 1) {
                    // If we're getting close to rate limits, add a small delay between batches
                    if (githubRateLimiter.isApproachingLimit()) {
                        const delayMs = 2000; // 2 seconds between batches when approaching limit
                        console.log(`Approaching GitHub API rate limit, waiting ${delayMs}ms before next batch`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                }
            }

            return NextResponse.json({
                message: `Import completed: ${results.success} MCPs imported, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`,
                results
            });
        } else {
            // Try to get session the regular way if no Authorization header is present
            const { data: { session: regularSession }, error: authError } = await supabase.auth.getSession();
            if (authError || !regularSession) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const currentUser = regularSession.user;

            // Check if user is an admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', currentUser.id)
                .single();

            if (profileError || !profile?.is_admin) {
                return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
            }

            // Get MCPs data and overwrite flag from request body
            const { mcps, overwrite } = await request.json();

            if (!mcps || !Array.isArray(mcps) || mcps.length === 0) {
                return NextResponse.json({ error: 'Invalid MCPs data format' }, { status: 400 });
            }

            // Log GitHub rate limit info at the start
            const rateLimitInfo = githubRateLimiter.getRateLimitInfo();
            console.log(`Starting batch import with ${mcps.length} MCPs. GitHub rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining. Reset at ${rateLimitInfo.resetTime}`);

            // Results tracking
            const results = {
                success: 0,
                skipped: 0,
                updated: 0, // For tracking overwritten MCPs
                failed: 0,
                errors: [] as string[]
            };

            // Process MCPs in small batches to respect API limits
            const batchSize = Math.min(DEFAULT_BATCH_SIZE, mcps.length);
            const numBatches = Math.ceil(mcps.length / batchSize);

            console.log(`Will process MCPs in ${numBatches} batches of ${batchSize} each`);

            // Process each batch
            for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
                const startIdx = batchIndex * batchSize;
                const endIdx = Math.min(startIdx + batchSize, mcps.length);
                const batch = mcps.slice(startIdx, endIdx);

                console.log(`Processing batch ${batchIndex + 1}/${numBatches} with ${batch.length} MCPs`);

                // Process each MCP in the batch concurrently
                const batchPromises = batch.map(async (mcp) => {
                    try {
                        // Validate required fields
                        if (!mcp.name || !mcp.repository_url || !mcp.author) {
                            results.failed++;
                            results.errors.push(`MCP "${mcp.name || 'unnamed'}" is missing required fields`);
                            return;
                        }

                        // --- Check if MCP already exists ---
                        const { data: existingMcp, error: checkError } = await supabaseAdmin
                            .from('mcps')
                            .select('id')
                            .eq('repository_url', mcp.repository_url)
                            .maybeSingle();

                        if (checkError) {
                            console.error('Error checking for existing MCP:', checkError);
                            results.failed++;
                            results.errors.push(`Error checking existence for MCP "${mcp.name}": ${checkError.message}`);
                            return; // Skip this MCP if check fails
                        }

                        // Create a copy of the MCP object for enrichment
                        const mcpData = { ...mcp };

                        // Extract basic owner/repo info from URL regardless of GitHub API
                        try {
                            const repoUrl = new URL(mcp.repository_url);
                            const pathParts = repoUrl.pathname.split('/').filter(Boolean);

                            if (pathParts.length >= 2 && (repoUrl.hostname === 'github.com' || repoUrl.hostname === 'www.github.com')) {
                                mcpData.owner_username = pathParts[0];
                                mcpData.repository_name = pathParts[1];
                            }
                        } catch (error) {
                            console.error('Error parsing repository URL:', error);
                        }

                        // Try to fetch GitHub data but continue if it fails
                        try {
                            console.log(`Fetching GitHub data for ${mcp.name} (${mcp.repository_url})`);

                            // Use our new rate-limited API fetch
                            const repoData = await fetchComprehensiveRepoData(mcp.repository_url);

                            // Enrich the MCP with GitHub data
                            mcpData.readme = repoData.readme;
                            mcpData.owner_username = repoData.owner || mcpData.owner_username;
                            mcpData.repository_name = repoData.repo || mcpData.repository_name;
                            mcpData.stars = repoData.stars;
                            mcpData.forks = repoData.forks;
                            mcpData.open_issues = repoData.open_issues;
                            mcpData.last_repo_update = repoData.last_repo_update;
                            mcpData.last_refreshed = new Date().toISOString();

                            console.log(`GitHub data fetched for ${mcp.name}. Stars: ${repoData.stars}`);
                        } catch (e) {
                            console.error(`Error fetching GitHub data for ${mcp.name}:`, e);
                            // Continue with import despite GitHub API errors
                            results.errors.push(`Warning for "${mcp.name}": Could not fetch complete GitHub data - ${(e as Error).message || 'Unknown error'}`);
                        }

                        // Handle based on existence and overwrite flag
                        if (existingMcp) {
                            // MCP exists - either update it or skip based on overwrite flag
                            if (overwrite) {
                                // Update the existing MCP
                                const { error: updateError } = await supabaseAdmin
                                    .from('mcps')
                                    .update({
                                        name: mcpData.name,
                                        description: mcpData.description || '',
                                        repository_url: mcpData.repository_url,
                                        owner_username: mcpData.owner_username,
                                        repository_name: mcpData.repository_name,
                                        author: mcpData.author,
                                        tags: mcpData.tags || [],
                                        user_id: mcpData.user_id || currentUser.id,
                                        is_mcph_owned: mcpData.is_mcph_owned !== undefined ? mcpData.is_mcph_owned : false,
                                        view_count: mcpData.view_count || 0,
                                        readme: mcpData.readme || '',
                                        stars: mcpData.stars || 0,
                                        forks: mcpData.forks || 0,
                                        open_issues: mcpData.open_issues || 0,
                                        last_repo_update: mcpData.last_repo_update,
                                        last_refreshed: mcpData.last_refreshed
                                    } as any)
                                    .eq('id', existingMcp.id);

                                if (updateError) {
                                    throw updateError;
                                }

                                results.updated++;
                            } else {
                                // Skip if the MCP exists and overwrite is false
                                results.skipped++;
                                results.errors.push(`MCP "${mcp.name}" already exists (URL: ${mcp.repository_url}). Skipped.`);
                            }
                        } else {
                            // Insert new MCP
                            const { error: insertError } = await supabaseAdmin
                                .from('mcps')
                                .insert({
                                    name: mcpData.name,
                                    description: mcpData.description || '',
                                    repository_url: mcpData.repository_url,
                                    owner_username: mcpData.owner_username,
                                    repository_name: mcpData.repository_name,
                                    author: mcpData.author,
                                    tags: mcpData.tags || [],
                                    user_id: mcpData.user_id || currentUser.id,
                                    is_mcph_owned: mcpData.is_mcph_owned !== undefined ? mcpData.is_mcph_owned : false,
                                    view_count: mcpData.view_count || 0,
                                    readme: mcpData.readme || '',
                                    stars: mcpData.stars || 0,
                                    forks: mcpData.forks || 0,
                                    open_issues: mcpData.open_issues || 0,
                                    last_repo_update: mcpData.last_repo_update,
                                    last_refreshed: mcpData.last_refreshed
                                } as any);

                            if (insertError) {
                                throw insertError;
                            }

                            results.success++;
                        }
                    } catch (error) {
                        console.error('Error importing MCP:', error);
                        results.failed++;
                        results.errors.push(`Failed to import MCP "${mcp.name || 'unnamed'}": ${(error as Error).message || 'Unknown error'}`);
                    }
                });

                // Wait for all MCPs in this batch to complete before moving to next batch
                await Promise.all(batchPromises);

                // Log batch completion status
                console.log(`Completed batch ${batchIndex + 1}/${numBatches}. Current results: ${results.success} imported, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);

                // Log current GitHub API rate limit 
                const currentLimitInfo = githubRateLimiter.getRateLimitInfo();
                console.log(`GitHub API rate limit after batch: ${currentLimitInfo.remaining}/${currentLimitInfo.limit} requests remaining`);

                // If this isn't the last batch, wait a moment before processing the next one
                if (batchIndex < numBatches - 1) {
                    // If we're getting close to rate limits, add a small delay between batches
                    if (githubRateLimiter.isApproachingLimit()) {
                        const delayMs = 2000; // 2 seconds between batches when approaching limit
                        console.log(`Approaching GitHub API rate limit, waiting ${delayMs}ms before next batch`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                }
            }

            return NextResponse.json({
                message: `Import completed: ${results.success} MCPs imported, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`,
                results
            });
        }
    } catch (error) {
        console.error('Error in batch import:', error);
        return NextResponse.json({
            error: 'Failed to process batch import',
            details: (error as Error).message
        }, { status: 500 });
    }
}