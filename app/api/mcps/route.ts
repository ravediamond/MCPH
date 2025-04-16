import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchGithubReadme, fetchRepoDetails } from 'services/githubService';
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

    // Validate GitHub URL format
    if (!repository_url.match(/^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/i)) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL format' },
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

    // Extract owner and repo name from the URL
    const parsedUrl = new URL(repository_url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const owner_username = pathParts[0];
    const repository_name = pathParts[1];

    // Store these early so we have them even if GitHub API calls fail
    mcpData.owner_username = owner_username;
    mcpData.repository_name = repository_name;
    mcpData.last_refreshed = new Date().toISOString();

    try {
      // Fetch GitHub data in parallel for better performance
      const [readmeResponse, repoDetailsResponse] = await Promise.allSettled([
        fetchGithubReadme(repository_url, owner_username, repository_name),
        fetchRepoDetails(owner_username, repository_name)
      ]);

      // Handle README fetch results
      if (readmeResponse.status === 'fulfilled') {
        mcpData.readme = readmeResponse.value.readme;
      } else {
        console.error('GitHub README fetch error:', readmeResponse.reason);
        mcpData.readme = ''; // Set empty readme if fetch fails
      }

      // Handle repo details fetch results
      if (repoDetailsResponse.status === 'fulfilled') {
        const repoDetails = repoDetailsResponse.value;
        mcpData.stars = repoDetails.stargazers_count || 0;
        mcpData.forks = repoDetails.forks_count || 0;
        mcpData.open_issues = repoDetails.open_issues_count || 0;
        mcpData.last_repo_update = repoDetails.updated_at;
      } else {
        console.error('GitHub repo details fetch error:', repoDetailsResponse.reason);
      }
    } catch (e) {
      // Log the error but proceed with MCP creation using the data we already have
      console.error('GitHub API error:', e);
    }

    // Insert the new MCP record in Supabase
    const { data, error } = await supabase
      .from('mcps')
      .insert(mcpData)
      .select()
      .single();

    if (error) {
      // Check for duplicate repository_url constraint
      if (error.code === '23505' && error.message.includes('repository_url')) {
        return NextResponse.json(
          { error: 'An MCP with this GitHub repository URL already exists' },
          { status: 409 }
        );
      }

      console.error('Database insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Schedule a background task to refresh GitHub data if initial fetch failed
    if (!mcpData.stars && data.id) {
      try {
        // Use a background fetch to get stars count, but don't wait for it
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcps/refresh-stars?apiKey=${process.env.STARS_UPDATE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mcpIds: [data.id] })
        }).catch(err => console.error('Failed to schedule refresh for new MCP:', err));
      } catch (e) {
        console.error('Failed to schedule background refresh:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'MCP created successfully',
      mcp: data
    }, { status: 201 });
  } catch (error) {
    console.error('Error processing MCP creation:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}