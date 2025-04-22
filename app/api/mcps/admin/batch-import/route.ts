import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { MCP } from 'types/mcp';

export async function POST(request: Request) {
    try {
        // Authenticate the user
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = session.user;

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

                // Parse GitHub repository URL to extract owner and repo name
                let ownerUsername = mcp.owner_username;
                let repositoryName = mcp.repository_name;

                if (!ownerUsername || !repositoryName) {
                    try {
                        const repoUrl = new URL(mcp.repository_url);
                        const pathParts = repoUrl.pathname.split('/').filter(Boolean);

                        if (pathParts.length >= 2 && (repoUrl.hostname === 'github.com' || repoUrl.hostname === 'www.github.com')) {
                            ownerUsername = pathParts[0];
                            repositoryName = pathParts[1];
                        }
                    } catch (error) {
                        // If URL parsing fails, we'll just continue with null values
                        console.error('Error parsing repository URL:', error);
                    }
                }

                // Format tags properly
                const formattedTags = mcp.tags || [];

                // Insert the MCP
                const { error: insertError } = await supabase
                    .from('mcps')
                    .insert({
                        name: mcp.name,
                        description: mcp.description || '',
                        repository_url: mcp.repository_url,
                        owner_username: ownerUsername,
                        repository_name: repositoryName,
                        version: mcp.version,
                        author: mcp.author,
                        tags: formattedTags,
                        user_id: mcp.user_id || null,
                        claimed: mcp.claimed !== undefined ? mcp.claimed : false,
                        is_mcph_owned: mcp.is_mcph_owned !== undefined ? mcp.is_mcph_owned : false,
                        deployment_url: mcp.deployment_url || null
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
    } catch (error) {
        console.error('Error in batch import:', error);
        return NextResponse.json({
            error: 'Failed to process batch import',
            details: (error as Error).message
        }, { status: 500 });
    }
}