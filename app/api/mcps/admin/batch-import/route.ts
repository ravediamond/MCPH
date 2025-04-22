import { NextResponse } from 'next/server';
import { supabase, createServiceRoleClient } from 'lib/supabaseClient';
import { MCP } from 'types/mcp';
import { createClient } from '@supabase/supabase-js';
import { fetchComprehensiveRepoData } from 'services/githubService';

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

            // Get MCPs data from request body
            const { mcps } = await request.json();

            if (!mcps || !Array.isArray(mcps) || mcps.length === 0) {
                return NextResponse.json({ error: 'Invalid MCPs data format' }, { status: 400 });
            }

            // Results tracking
            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            // Process each MCP
            for (const mcp of mcps) {
                try {
                    // Validate required fields
                    if (!mcp.name || !mcp.repository_url || !mcp.version || !mcp.author) {
                        results.failed++;
                        results.errors.push(`MCP "${mcp.name || 'unnamed'}" is missing required fields`);
                        continue;
                    }

                    // Create a copy of the MCP object for enrichment
                    const mcpData = { ...mcp };

                    // Fetch GitHub repository data
                    try {
                        console.log(`Fetching GitHub data for ${mcp.name} (${mcp.repository_url})`);
                        const repoData = await fetchComprehensiveRepoData(mcp.repository_url);

                        // Enrich the MCP with GitHub data
                        mcpData.readme = repoData.readme;
                        mcpData.owner_username = repoData.owner;
                        mcpData.repository_name = repoData.repo;
                        mcpData.stars = repoData.stars;
                        mcpData.forks = repoData.forks;
                        mcpData.open_issues = repoData.open_issues;
                        mcpData.last_repo_update = repoData.last_repo_update;
                        mcpData.languages = repoData.languages;
                        mcpData.last_refreshed = new Date().toISOString();

                        console.log(`GitHub data fetched for ${mcp.name}. Stars: ${repoData.stars}, Languages: ${repoData.languages.join(', ')}`);
                    } catch (e) {
                        console.error(`Error fetching GitHub data for ${mcp.name}:`, e);

                        // Extract basic owner/repo info if GitHub API fails
                        if (!mcpData.owner_username || !mcpData.repository_name) {
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
                        }
                    }

                    // Use supabaseAdmin to bypass RLS
                    const { error: insertError } = await supabaseAdmin
                        .from('mcps')
                        .insert({
                            name: mcpData.name,
                            description: mcpData.description || '',
                            repository_url: mcpData.repository_url,
                            owner_username: mcpData.owner_username,
                            repository_name: mcpData.repository_name,
                            version: mcpData.version,
                            author: mcpData.author,
                            tags: mcpData.tags || [],
                            user_id: mcpData.user_id || currentUser.id,
                            is_mcph_owned: mcpData.is_mcph_owned !== undefined ? mcpData.is_mcph_owned : false,
                            deployment_url: mcpData.deployment_url || null,
                            view_count: mcpData.view_count || 0,
                            readme: mcpData.readme || '',
                            stars: mcpData.stars || 0,
                            forks: mcpData.forks || 0,
                            open_issues: mcpData.open_issues || 0,
                            last_repo_update: mcpData.last_repo_update,
                            languages: mcpData.languages || [],
                            last_refreshed: mcpData.last_refreshed
                        });

                    if (insertError) {
                        throw insertError;
                    }

                    results.success++;
                } catch (error) {
                    console.error('Error importing MCP:', error);
                    results.failed++;
                    results.errors.push(`Failed to import MCP "${mcp.name || 'unnamed'}": ${(error as Error).message || 'Unknown error'}`);
                }
            }

            return NextResponse.json({
                message: `Import completed: ${results.success} MCPs imported successfully, ${results.failed} failed`,
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

            // Get MCPs data from request body
            const { mcps } = await request.json();

            if (!mcps || !Array.isArray(mcps) || mcps.length === 0) {
                return NextResponse.json({ error: 'Invalid MCPs data format' }, { status: 400 });
            }

            // Results tracking
            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            // Process each MCP
            for (const mcp of mcps) {
                try {
                    // Validate required fields
                    if (!mcp.name || !mcp.repository_url || !mcp.version || !mcp.author) {
                        results.failed++;
                        results.errors.push(`MCP "${mcp.name || 'unnamed'}" is missing required fields`);
                        continue;
                    }

                    // Create a copy of the MCP object for enrichment
                    const mcpData = { ...mcp };

                    // Fetch GitHub repository data
                    try {
                        console.log(`Fetching GitHub data for ${mcp.name} (${mcp.repository_url})`);
                        const repoData = await fetchComprehensiveRepoData(mcp.repository_url);

                        // Enrich the MCP with GitHub data
                        mcpData.readme = repoData.readme;
                        mcpData.owner_username = repoData.owner;
                        mcpData.repository_name = repoData.repo;
                        mcpData.stars = repoData.stars;
                        mcpData.forks = repoData.forks;
                        mcpData.open_issues = repoData.open_issues;
                        mcpData.last_repo_update = repoData.last_repo_update;
                        mcpData.languages = repoData.languages;
                        mcpData.last_refreshed = new Date().toISOString();

                        console.log(`GitHub data fetched for ${mcp.name}. Stars: ${repoData.stars}, Languages: ${repoData.languages.join(', ')}`);
                    } catch (e) {
                        console.error(`Error fetching GitHub data for ${mcp.name}:`, e);

                        // Extract basic owner/repo info if GitHub API fails
                        if (!mcpData.owner_username || !mcpData.repository_name) {
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
                        }
                    }

                    // Use supabaseAdmin to bypass RLS
                    const { error: insertError } = await supabaseAdmin
                        .from('mcps')
                        .insert({
                            name: mcpData.name,
                            description: mcpData.description || '',
                            repository_url: mcpData.repository_url,
                            owner_username: mcpData.owner_username,
                            repository_name: mcpData.repository_name,
                            version: mcpData.version,
                            author: mcpData.author,
                            tags: mcpData.tags || [],
                            user_id: mcpData.user_id || currentUser.id,
                            is_mcph_owned: mcpData.is_mcph_owned !== undefined ? mcpData.is_mcph_owned : false,
                            deployment_url: mcpData.deployment_url || null,
                            view_count: mcpData.view_count || 0,
                            readme: mcpData.readme || '',
                            stars: mcpData.stars || 0,
                            forks: mcpData.forks || 0,
                            open_issues: mcpData.open_issues || 0,
                            last_repo_update: mcpData.last_repo_update,
                            languages: mcpData.languages || [],
                            last_refreshed: mcpData.last_refreshed
                        });

                    if (insertError) {
                        throw insertError;
                    }

                    results.success++;
                } catch (error) {
                    console.error('Error importing MCP:', error);
                    results.failed++;
                    results.errors.push(`Failed to import MCP "${mcp.name || 'unnamed'}": ${(error as Error).message || 'Unknown error'}`);
                }
            }

            return NextResponse.json({
                message: `Import completed: ${results.success} MCPs imported successfully, ${results.failed} failed`,
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