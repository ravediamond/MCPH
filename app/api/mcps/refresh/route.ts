import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchReadmeFromGitHub } from 'services/githubService';

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

        // Check if user is an admin or the owner of the MCP
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();

        // Get the MCP data
        const { data: mcp, error: mcpError } = await supabase
            .from('mcps')
            .select('*')
            .eq('id', mcpId)
            .single();

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
    try {
        await supabase.from('error_logs').insert({
            type,
            message,
            details: error.message || JSON.stringify(error),
            stack: error.stack
        });
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
}