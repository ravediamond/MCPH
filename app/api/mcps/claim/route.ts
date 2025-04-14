import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
    try {
        // Get the current authenticated user
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = session.user;
        const { mcpId } = await request.json();

        if (!mcpId) {
            return NextResponse.json({ error: 'MCP ID is required' }, { status: 400 });
        }

        // Get the MCP data
        const { data: mcpData, error: mcpError } = await supabase
            .from('mcps')
            .select('*')
            .eq('id', mcpId)
            .single();

        if (mcpError || !mcpData) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        // Get the user's GitHub identity
        const { data: identities, error: identityError } = await supabase
            .from('identities')
            .select('identity_data')
            .eq('user_id', currentUser.id)
            .eq('provider', 'github')
            .single();

        if (identityError || !identities) {
            return NextResponse.json({ error: 'GitHub identity not found' }, { status: 400 });
        }

        const githubUsername = identities.identity_data.user_name;

        // Check if the user's GitHub username matches the MCP owner_username
        if (githubUsername !== mcpData.owner_username) {
            return NextResponse.json({
                error: 'You are not the owner of this repository'
            }, { status: 403 });
        }

        // Update the MCP to mark it as claimed by the current user
        const { data: updatedMcp, error: updateError } = await supabase
            .from('mcps')
            .update({ user_id: currentUser.id, claimed: true })
            .eq('id', mcpId)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: 'Failed to claim MCP' }, { status: 500 });
        }

        return NextResponse.json({ success: true, mcp: updatedMcp });
    } catch (error) {
        console.error('Error claiming MCP:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}