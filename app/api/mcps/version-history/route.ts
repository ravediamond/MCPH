import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const mcpId = url.searchParams.get('mcpId');

        if (!mcpId) {
            return NextResponse.json({
                error: 'Missing required parameter: mcpId'
            }, { status: 400 });
        }

        // Fix the createRouteHandlerClient call to pass cookies as a function
        const supabase = createRouteHandlerClient({ cookies });

        // Check if the MCP exists
        const { data: mcp, error: mcpError } = await supabase
            .from('mcps')
            .select('id')
            .eq('id', mcpId)
            .single();

        if (mcpError) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        // Fetch version history for the MCP without the join that might be causing issues
        const { data: versionHistory, error: historyError } = await supabase
            .from('mcp_versions')
            .select(`
                id, 
                created_at, 
                version, 
                change_summary, 
                change_details,
                changed_by
            `)
            .eq('mcp_id', mcpId)
            .order('created_at', { ascending: false });

        if (historyError) {
            console.error('Error fetching version history:', historyError);
            return NextResponse.json({
                error: 'Failed to fetch version history'
            }, { status: 500 });
        }

        // If version history is found, fetch user information separately
        const versionHistoryWithUserInfo = await Promise.all(
            (versionHistory || []).map(async (version) => {
                if (version.changed_by) {
                    const { data: userData, error: userError } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', version.changed_by)
                        .single();

                    if (!userError && userData) {
                        return {
                            ...version,
                            user: userData
                        };
                    }
                }
                return {
                    ...version,
                    user: null
                };
            })
        );

        return NextResponse.json({ versionHistory: versionHistoryWithUserInfo });
    } catch (error) {
        console.error('Error fetching MCP version history:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}