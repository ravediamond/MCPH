import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

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

        // Get mcpId and userId from request
        const { mcpId, userId } = await request.json();

        if (!mcpId) {
            return NextResponse.json({ error: 'MCP ID is required' }, { status: 400 });
        }

        // Check if the MCP exists
        const { data: mcp, error: mcpError } = await supabase
            .from('mcps')
            .select('*')
            .eq('id', mcpId)
            .single();

        if (mcpError || !mcp) {
            return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
        }

        // If userId is provided, check if the user exists
        if (userId) {
            const { data: targetUser, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (userError || !targetUser) {
                return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
            }
        }

        // Update the MCP with the new owner (or remove ownership if userId is empty)
        const updateData = {
            user_id: userId || null,
            claimed: userId ? true : false
        };

        const { error: updateError } = await supabase
            .from('mcps')
            .update(updateData)
            .eq('id', mcpId);

        if (updateError) {
            throw updateError;
        }

        // Log the action
        await (supabase as any).from('admin_logs').insert({
            action: 'override_mcp_ownership',
            admin_id: currentUser.id,
            details: {
                mcpId,
                previousOwnerId: mcp.user_id,
                newOwnerId: userId
            }
        });

        return NextResponse.json({
            success: true,
            message: userId
                ? 'MCP ownership has been updated successfully'
                : 'MCP ownership has been removed successfully'
        });
    } catch (error: any) {
        // Log the error
        try {
            await (supabase as any).from('error_logs').insert({
                type: 'Admin Override',
                message: 'Error overriding MCP ownership',
                details: error.message || JSON.stringify(error),
                stack: error.stack
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return NextResponse.json({
            error: 'An error occurred while updating MCP ownership',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}