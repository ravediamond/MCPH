import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with direct URL and key access
// This approach doesn't require cookies/auth which can be problematic
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

        // Create a direct Supabase client with admin privileges
        // This bypasses authentication issues that might prevent updates
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Call the database function to increment the view count
        const { data, error } = await supabase.rpc('increment_view_count', { row_id: mcpId });

        if (error) {
            console.error('Error incrementing view count with RPC:', error);

            // First, get the current view count
            const { data: mcpData, error: fetchError } = await supabase
                .from('mcps')
                .select('view_count')
                .eq('id', mcpId)
                .single();

            if (fetchError) {
                console.error('Error fetching MCP for view count update:', fetchError);
                return NextResponse.json(
                    { error: 'Failed to fetch MCP data' },
                    { status: 500 }
                );
            }

            // Calculate new view count
            const currentViewCount = mcpData.view_count || 0;
            const newViewCount = currentViewCount + 1;

            // Fallback: try direct update if RPC fails
            const { data: updateData, error: updateError } = await supabase
                .from('mcps')
                .update({ view_count: newViewCount })
                .eq('id', mcpId)
                .select('view_count')
                .single();

            if (updateError) {
                console.error('Error with direct view count update:', updateError);
                return NextResponse.json(
                    { error: 'Failed to increment view count' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                viewCount: updateData.view_count
            });
        }

        return NextResponse.json({
            success: true,
            viewCount: data
        });
    } catch (error) {
        console.error('Error processing view count:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}