import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // If query parameter is empty or missing, return all MCPs.
    let queryBuilder = supabase.from('mcps').select('*');

    if (q && q.trim() !== '') {
        queryBuilder = queryBuilder.ilike('name', `%${q}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        return NextResponse.json(
            { message: 'Search failed', error },
            { status: 500 }
        );
    }

    return NextResponse.json({ results: data });
}