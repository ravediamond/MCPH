import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const supabase = createServerSupabaseClient({ req, res });
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid MCP ID' });
    }

    switch (req.method) {
        case 'GET':
            return handleGet(id, res, supabase);
        case 'PUT':
            return handlePut(id, req, res, supabase);
        case 'DELETE':
            return handleDelete(id, res, supabase);
        default:
            return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleGet(id: string, res: NextApiResponse, supabase: any) {
    const { data, error } = await supabase
        .from('mcps')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return res.status(404).json({ error: 'MCP not found' });
    }

    return res.status(200).json(data);
}

async function handlePut(
    id: string,
    req: NextApiRequest,
    res: NextApiResponse,
    supabase: any
) {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current MCP to check ownership
    const { data: mcp, error: fetchError } = await supabase
        .from('mcps')
        .select('user_id')
        .eq('id', id)
        .single();

    if (fetchError || !mcp) {
        return res.status(404).json({ error: 'MCP not found' });
    }

    // Verify ownership
    if (mcp.user_id !== session.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this MCP' });
    }

    const { name, description, deployment_url, documentation_url, version, author, tags } = req.body;

    // Validate required fields
    if (!name || !description || !deployment_url || !version || !author) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update MCP
    const { data, error } = await supabase
        .from('mcps')
        .update({
            name,
            description,
            deployment_url,
            documentation_url,
            version,
            author,
            tags,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
}

async function handleDelete(id: string, res: NextApiResponse, supabase: any) {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current MCP to check ownership
    const { data: mcp, error: fetchError } = await supabase
        .from('mcps')
        .select('user_id')
        .eq('id', id)
        .single();

    if (fetchError || !mcp) {
        return res.status(404).json({ error: 'MCP not found' });
    }

    // Verify ownership
    if (mcp.user_id !== session.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this MCP' });
    }

    // Delete MCP
    const { error } = await supabase
        .from('mcps')
        .delete()
        .eq('id', id);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(204).end();
}
