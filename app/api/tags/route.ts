import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/tags
 * Retrieves all available tags, optionally filtered by category
 * Query parameters:
 * - category: Filter tags by category name (optional)
 */
export async function GET(request: Request) {
    try {
        // Get the URL to extract query parameters
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Start building the query
        let query = supabase
            .from('tags')
            .select('*, tag_category:tag_categories(id, name, description)');

        // Add category filter if provided
        if (category) {
            query = query.filter('tag_category.name', 'eq', category);
        }

        // Order results by category name and then tag name
        const { data, error } = await query.order('name');

        if (error) {
            console.error('Error fetching tags:', error);
            return NextResponse.json(
                { error: 'Failed to retrieve tags' },
                { status: 500 }
            );
        }

        // Transform the data to a more suitable format
        const formattedTags = data.map(tag => ({
            id: tag.id,
            name: tag.name,
            description: tag.description,
            icon: tag.icon,
            category: tag.tag_category?.name || null,
            categoryId: tag.category_id
        }));

        return NextResponse.json(formattedTags);
    } catch (error) {
        console.error('Unexpected error in tags API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}