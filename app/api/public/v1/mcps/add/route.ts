import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { fetchGithubReadme } from 'services/githubService';
import { MCP } from 'types/mcp';
import { validateApiKey } from 'utils/apiKeyValidation';

/**
 * Public API endpoint to add a new MCP
 * This endpoint allows for submission of MCPs via API with an API key
 * Follows REST principles and uses the same versioning as other public APIs
 */
export async function POST(request: NextRequest) {
    try {
        // Validate API key
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'API key is required'
            }, { status: 401 });
        }

        // Validate the API key - this will work with both admin and regular user keys
        const keyValidation = await validateApiKey(apiKey);
        if (!keyValidation.valid || !keyValidation.key) {
            return NextResponse.json({
                success: false,
                error: 'Invalid or expired API key'
            }, { status: 403 });
        }

        // Use the API key's user ID to link the MCP to the correct user
        const userId = keyValidation.key.user_id;

        // Parse request body
        const body = await request.json();

        // Validate required fields
        const { name, description, repository_url, version, author, tags } = body;
        if (!name || !repository_url || !version || !author) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: name, repository_url, version, and author'
            }, { status: 400 });
        }

        // Prepare the initial MCP object
        const mcpData: MCP = {
            name,
            description: description || '',
            repository_url,
            version,
            author,
            user_id: userId, // Set to the API key owner's user ID
            tags: tags || []
        };

        // Extract repository information
        let readme = '';
        let owner_username = '';
        let repository_name = '';
        const last_refreshed = new Date().toISOString();

        try {
            // Fetch GitHub README and owner username
            const githubData = await fetchGithubReadme(repository_url);
            readme = githubData.readme || '';
            owner_username = githubData.ownerUsername || '';

            // Extract repository name from URL
            const urlParts = repository_url.split('/');
            repository_name = urlParts[urlParts.length - 1] || '';
        } catch (e) {
            // Log the error but proceed with MCP creation
            console.error('GitHub fetch error:', e);
        }

        // Assign the fetched data
        mcpData.readme = readme;
        mcpData.last_refreshed = last_refreshed;
        mcpData.owner_username = owner_username;
        mcpData.repository_name = repository_name;

        // Insert the new MCP record in Supabase
        const { data, error } = await supabase
            .from('mcps')
            .insert(mcpData)
            .select()
            .single();

        if (error) {
            console.error('Database insert error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data
        }, { status: 201 });

    } catch (error) {
        console.error('Error processing MCP creation:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}