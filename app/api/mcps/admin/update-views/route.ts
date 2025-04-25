import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from 'types/database.types'; // Assuming you have this type definition

// Initialize Supabase Admin Client (use environment variables)
const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper function to check admin status
async function isAdmin(request: Request): Promise<boolean> {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return false;

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
        console.error('Admin check failed:', userError?.message);
        return false;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (profileError || !profile?.is_admin) {
        console.error('Admin profile check failed:', profileError?.message);
        return false;
    }

    return true;
}

export async function POST(request: Request) {
    try {
        // 1. Check if the user is an admin
        const isAdminUser = await isAdmin(request);
        if (!isAdminUser) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse the request body
        const { mcpId, views } = await request.json();

        // 3. Validate input
        if (!mcpId || typeof mcpId !== 'string') {
            return NextResponse.json({ error: 'Invalid MCP ID' }, { status: 400 });
        }
        if (views === undefined || typeof views !== 'number' || views < 0 || !Number.isInteger(views)) {
            return NextResponse.json({ error: 'Invalid views count. Must be a non-negative integer.' }, { status: 400 });
        }

        // 4. Update the MCP view count in the database
        const { error: updateError } = await supabaseAdmin
            .from('mcps')
            .update({ view_count: views })
            .eq('id', mcpId);

        if (updateError) {
            console.error('Error updating MCP views:', updateError);
            return NextResponse.json({ error: `Database error: ${updateError.message}` }, { status: 500 });
        }

        // 5. Return success response
        return NextResponse.json({ message: 'Views updated successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Error in update-views endpoint:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message || 'Unknown error'}` }, { status: 500 });
    }
}
