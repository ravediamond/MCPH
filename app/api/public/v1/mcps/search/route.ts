import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';

/**
 * Public API endpoint to search for MCPs
 * This is an example of a public-facing API that's properly versioned
 * and follows REST principles
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const tags = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        // Start building our query
        let queryBuilder = supabase
            .from('mcps')
            .select(`
        id, 
        name, 
        description, 
        repository_url, 
        tags, 
        version,
        author,
        owner_username,
        repository_name,
        stars,
        avg_rating,
        review_count,
        view_count
      `);

        // Apply search filters if provided
        if (query && query.trim() !== '') {
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        }

        // Filter by tags if provided
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            queryBuilder = queryBuilder.contains('tags', tagArray);
        }

        // Apply pagination
        queryBuilder = queryBuilder
            .order('stars', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to search MCPs',
            }, { status: 500 });
        }

        // Get total count for pagination info
        const { count: totalCount } = await supabase
            .from('mcps')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            results: data,
            pagination: {
                total: totalCount || 0,
                offset,
                limit,
                hasMore: (offset + limit) < (totalCount || 0)
            }
        });
    } catch (error) {
        console.error('Unexpected error in MCP search:', error);
        return NextResponse.json({
            success: false,
            error: 'An unexpected error occurred',
        }, { status: 500 });
    }
}