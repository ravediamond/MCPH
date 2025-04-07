import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const supabase = createServerSupabaseClient({ req, res });

    // Check if we're dealing with a GET or POST request
    switch (req.method) {
        case 'GET':
            return handleGet(req, res, supabase);
        case 'POST':
            return handlePost(req, res, supabase);
        default:
            return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: any) {
    const { q, tag, limit = '50', offset = '0' } = req.query;

    let query = supabase.from('mcps').select('*');

    // Apply search query if provided
    if (q && typeof q === 'string') {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Filter by tag if provided
    if (tag && typeof tag === 'string') {
        query = query.contains('tags', [tag]);
    }

    // Apply pagination
    query = query
        .order('created_at', { ascending: false })
        .range(
            parseInt(offset as string),
            parseInt(offset as string) + parseInt(limit as string) - 1
        );

    const { data, error, count } = await query;

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
        mcps: data,
        count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
    });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, supabase: any) {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, description, deployment_url, documentation_url, version, author, tags } = req.body;

    // Validate required fields
    if (!name || !description || !deployment_url || !version || !author) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert new MCP
    const { data, error } = await supabase
        .from('mcps')
        .insert([
            {
                name,
                description,
                deployment_url,
                documentation_url,
                version,
                author,
                tags,
                user_id: session.user.id,
            },
        ])
        .select()
        .single();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
}
