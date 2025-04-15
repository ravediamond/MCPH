import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || 'starred';
        const limit = parseInt(url.searchParams.get('limit') || '5', 10);

        // For most starred MCPs
        if (type === 'starred') {
            const { data, error } = await supabase
                .from('mcps')
                .select('id, name, description, repository_url, tags, version, author, owner_username, repository_name, stars, avg_rating, review_count, view_count')
                .order('stars', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return NextResponse.json({ mcps: data });
        }
        // For trending MCPs - this will be based on star growth over time
        // Since we don't yet have historical star data, we'll use a combination of stars and recency
        else if (type === 'trending') {
            // Get date from 30 days ago
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Fetch recently updated MCPs that have stars
            const { data, error } = await supabase
                .from('mcps')
                .select('id, name, description, repository_url, tags, version, author, owner_username, repository_name, stars, avg_rating, review_count, view_count, last_repo_update')
                .gt('stars', 0) // Only MCPs with at least 1 star
                .gt('last_repo_update', thirtyDaysAgo.toISOString()) // Updated in the last 30 days
                // Order by a weighted combination of stars and recency (as a proxy for trending)
                .order('stars', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return NextResponse.json({ mcps: data });
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching featured MCPs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured MCPs' },
            { status: 500 }
        );
    }
}