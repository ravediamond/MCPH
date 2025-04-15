import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const mcpId = url.searchParams.get('mcpId');

        if (!mcpId) {
            return NextResponse.json({
                error: 'Missing required parameter: mcpId'
            }, { status: 400 });
        }

        // Check if the MCP exists
        const { data: mcp, error: mcpError } = await supabase
            .from('mcps')
            .select('id')
            .eq('id', mcpId)
            .single();

        if (mcpError) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        // Fetch version history for the MCP
        const { data: versionHistory, error: historyError } = await supabase
            .from('mcp_versions')
            .select(`
        id, 
        created_at, 
        version, 
        change_summary, 
        change_details,
        changed_by,
        user:changed_by (email)
      `)
            .eq('mcp_id', mcpId)
            .order('created_at', { ascending: false });

        if (historyError) {
            return NextResponse.json({
                error: 'Failed to fetch version history'
            }, { status: 500 });
        }

        return NextResponse.json({ versionHistory });
    } catch (error) {
        console.error('Error fetching MCP version history:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}