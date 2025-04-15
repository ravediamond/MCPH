import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mcpId } = body;

        if (!mcpId) {
            return NextResponse.json(
                { error: 'MCP ID is required' },
                { status: 400 }
            );
        }

        // Increment the view count for the specified MCP
        const { data, error } = await supabase
            .from('mcps')
            .update({ view_count: supabase.rpc('increment_view_count', { row_id: mcpId }) })
            .eq('id', mcpId)
            .select('view_count')
            .single();

        if (error) {
            console.error('Error incrementing view count:', error);
            return NextResponse.json(
                { error: 'Failed to increment view count' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            viewCount: data.view_count
        });
    } catch (error) {
        console.error('Error processing view count:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}