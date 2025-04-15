import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

        // Fix the createRouteHandlerClient call to pass cookies as a function
        const supabase = createRouteHandlerClient({ cookies });

        // First get the current view count
        const { data: mcpData, error: fetchError } = await supabase
            .from('mcps')
            .select('view_count')
            .eq('id', mcpId)
            .single();

        if (fetchError) {
            console.error('Error fetching MCP:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch MCP data' },
                { status: 500 }
            );
        }

        // Calculate new view count
        const currentViewCount = mcpData.view_count || 0;
        const newViewCount = currentViewCount + 1;

        // Update the view count directly instead of using RPC
        const { data, error } = await supabase
            .from('mcps')
            .update({ view_count: newViewCount })
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