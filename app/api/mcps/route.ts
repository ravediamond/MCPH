import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchGithubReadme } from 'services/githubService';
import { MCP } from 'types/mcp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate required fields
    const { name, description, repository_url, version, author, user_id, tags } = body;
    if (!name || !repository_url || !version || !author || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, repository_url, version, author, and user_id' },
        { status: 400 }
      );
    }

    // Prepare the initial MCP object
    const mcpData: MCP = {
      name,
      description: description || '',
      repository_url,
      version,
      author,
      user_id,
      tags: tags || []
    };

    let readme = '';
    let owner_username = '';
    const last_refreshed = new Date().toISOString();

    try {
      // Fetch GitHub README and owner username
      const githubData = await fetchGithubReadme(repository_url);
      readme = githubData.readme;
      owner_username = githubData.ownerUsername;
    } catch (e) {
      // Log the error but proceed with MCP creation
      console.error('GitHub fetch error:', e);
    }

    // Assign the fetched data
    mcpData.readme = readme;
    mcpData.last_refreshed = last_refreshed;
    mcpData.owner_username = owner_username;

    // Insert the new MCP record in Supabase
    const { data, error } = await supabase
      .from('mcps')
      .insert(mcpData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error processing MCP creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}