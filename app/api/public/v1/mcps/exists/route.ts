import { NextRequest, NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { validateApiKey } from 'utils/apiKeyValidation';

/**
 * Public API endpoint to check if an MCP already exists
 * This endpoint allows clients to verify if an MCP with a specific repository URL 
 * is already in the database before attempting to add it
 * Requires a valid API key but does not require admin privileges
 */
export async function GET(request: NextRequest) {
    try {
        // Extract query parameter
        const url = new URL(request.url);
        const repoUrl = url.searchParams.get('repo_url');

        // Validate repository URL parameter
        if (!repoUrl) {
            return NextResponse.json({
                success: false,
                error: 'Repository URL is required'
            }, { status: 400 });
        }

        // Validate API key
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'API key is required'
            }, { status: 401 });
        }

        // Validate the API key - standard validation, no admin required
        const keyValidation = await validateApiKey(apiKey);
        if (!keyValidation.valid || !keyValidation.key) {
            return NextResponse.json({
                success: false,
                error: keyValidation.error || 'Invalid or expired API key'
            }, { status: 403 });
        }

        // Normalize repository URL for comparison (remove trailing slashes)
        const normalizedRepoUrl = repoUrl.replace(/\/+$/, '');

        // Query the database to see if an MCP with this repository URL exists
        const { data, error } = await supabase
            .from('mcps')
            .select('id, name, repository_url, version, created_at')
            .ilike('repository_url', `${normalizedRepoUrl}%`);

        if (error) {
            console.error('Database query error:', error);
            return NextResponse.json({
                success: false,
                error: 'Error checking repository existence'
            }, { status: 500 });
        }

        // Check if any MCPs were found with the given repository URL
        // We filter in code to perform an exact match after case-insensitive query
        const exists = data.some(mcp =>
            mcp.repository_url.toLowerCase().replace(/\/+$/, '') === normalizedRepoUrl.toLowerCase()
        );

        // Return the result
        return NextResponse.json({
            success: true,
            exists,
            // If exists, include the matching MCP details
            ...(exists && {
                mcp: data.find(mcp =>
                    mcp.repository_url.toLowerCase().replace(/\/+$/, '') === normalizedRepoUrl.toLowerCase()
                )
            })
        });

    } catch (error) {
        console.error('Error checking MCP existence:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}