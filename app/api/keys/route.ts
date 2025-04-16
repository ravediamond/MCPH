import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ApiKey, CreateApiKeyRequest } from 'types/apiKey';
import { invalidateApiKeyCache } from 'utils/apiKeyValidation';

// GET endpoint to list API keys for the current user
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all API keys for the current user
        const { data, error } = await supabase
            .from('api_keys')
            .select('id, name, created_at, expires_at, last_used_at, is_active, description, scopes, is_admin_key')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching API keys:', error);
            return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
        }

        return NextResponse.json({ apiKeys: data });
    } catch (error: any) {
        console.error('Unexpected error fetching API keys:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// POST endpoint to create a new API key
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get request data
        const body: CreateApiKeyRequest = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
        }

        // Check if user is an admin (for admin keys)
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        const isAdmin = profile?.is_admin === true;

        // Determine if this should be an admin key based on the route it was created from
        // and if the user has admin privileges
        const isAdminKey = body.isAdminKey && isAdmin;

        // If trying to create an admin key but user is not an admin
        if (body.isAdminKey && !isAdmin) {
            return NextResponse.json({
                error: 'Only administrators can create admin API keys'
            }, { status: 403 });
        }

        // Get forwarded IP if available, or use a fallback
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

        // Generate a secure API key using our database function
        const { data: keyData, error: keyError } = await supabase.rpc('generate_api_key');

        if (keyError || !keyData) {
            console.error('Error generating API key:', keyError);
            return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
        }

        // Store newly generated key (we'll only send the full key to the client once)
        const apiKey = keyData;

        // Default scopes if none provided
        const scopes = body.scopes || ['read'];

        // Insert the new API key record
        const { data: insertedKey, error: insertError } = await supabase
            .from('api_keys')
            .insert({
                user_id: session.user.id,
                name: body.name,
                description: body.description || null,
                expires_at: body.expires_at || null,
                scopes: scopes,
                api_key: apiKey,
                created_from_ip: ip,
                is_admin_key: isAdminKey
            })
            .select('id, name, created_at, expires_at, is_active, description, scopes, is_admin_key')
            .single();

        if (insertError) {
            console.error('Error inserting API key:', insertError);
            return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
        }

        // Return the new API key with the plain text key (only shown once)
        return NextResponse.json({
            success: true,
            message: 'API key created successfully',
            apiKey: insertedKey,
            plainTextKey: apiKey
        }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error creating API key:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// DELETE endpoint to revoke/delete API key
export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get key ID from URL search params
        const searchParams = request.nextUrl.searchParams;
        const keyId = searchParams.get('id');

        if (!keyId) {
            return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
        }

        // Check if the user is the owner of the API key or an admin
        const { data: apiKey, error: fetchError } = await supabase
            .from('api_keys')
            .select('id, user_id, api_key')  // Also fetch the api_key field to invalidate cache
            .eq('id', keyId)
            .single();

        if (fetchError || !apiKey) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }

        // Check if the user has permission to delete this key
        const isOwner = apiKey.user_id === session.user.id;
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
        const isAdmin = profile?.is_admin === true;

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Delete the API key
        const { error: deleteError } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', keyId);

        if (deleteError) {
            console.error('Error deleting API key:', deleteError);
            return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
        }

        // Invalidate the cache for this API key
        if (apiKey.api_key) {
            invalidateApiKeyCache(apiKey.api_key);
        }

        return NextResponse.json({
            success: true,
            message: 'API key deleted successfully'
        });
    } catch (error: any) {
        console.error('Unexpected error deleting API key:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}