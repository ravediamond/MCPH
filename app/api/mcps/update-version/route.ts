import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user;
    const { mcpId, version, changeSummary, changeDetails } = await request.json();

    if (!mcpId || !version) {
      return NextResponse.json({ 
        error: 'Missing required fields: mcpId and version are required' 
      }, { status: 400 });
    }

    // Validate that version follows semver format (already enforced by DB constraints)
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      return NextResponse.json({
        error: 'Version must follow semantic versioning format (e.g., 1.0.0)'
      }, { status: 400 });
    }

    // Check if the MCP exists and if the user is the owner
    const { data: mcp, error: mcpError } = await supabase
      .from('mcps')
      .select('*')
      .eq('id', mcpId)
      .single();

    if (mcpError || !mcp) {
      return NextResponse.json({ error: 'MCP not found' }, { status: 404 });
    }

    // Check if user is the MCP owner or an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUser.id)
      .single();

    const isAdmin = profile?.is_admin || false;
    const isOwner = mcp.user_id === currentUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ 
        error: 'You do not have permission to update this MCP'
      }, { status: 403 });
    }

    // Begin a transaction to update both the MCP version and add a version history entry
    const { data: updatedMcp, error: updateError } = await supabase
      .from('mcps')
      .update({ version })
      .eq('id', mcpId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update MCP version'
      }, { status: 500 });
    }

    // Add entry to version history
    const { error: historyError } = await supabase
      .from('mcp_versions')
      .insert({
        mcp_id: mcpId,
        version,
        change_summary: changeSummary || 'Version updated',
        change_details: changeDetails || '',
        changed_by: currentUser.id
      });

    if (historyError) {
      console.error('Error adding version history:', historyError);
      return NextResponse.json({ 
        warning: 'MCP version updated but failed to record in version history',
        mcp: updatedMcp
      }, { status: 207 }); // 207 Multi-Status to indicate partial success
    }

    // Fetch version history for the MCP
    const { data: versionHistory } = await supabase
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

    return NextResponse.json({
      mcp: updatedMcp,
      versionHistory
    });
  } catch (error) {
    console.error('Error updating MCP version:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}