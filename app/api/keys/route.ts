import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ApiKey, CreateApiKeyRequest } from 'types/apiKey';
import type { Database } from 'types/database.types';

// GET endpoint to list API keys for the current user
export async function GET(request: NextRequest) {
    console.log('[API] GET /api/keys - Request received');
    try {
        // Log request headers for debugging
        console.log('[API] Request headers:', Object.fromEntries(request.headers.entries()));

        // Using the createRouteHandlerClient with properly handled cookies
        const supabase = createRouteHandlerClient<Database>({ cookies });

        console.log('[API] Supabase client created');

        // Check if user is authenticated - with better error handling
        console.log('[API] Checking authentication session');
        const { data, error: authError } = await supabase.auth.getSession();
        const session = data?.session;

        if (authError) {
            console.error('[API] Authentication error:', authError);
            return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
        }

        if (!session) {
            console.error('[API] No session found');
            return NextResponse.json({ error: 'Unauthorized', details: 'No session found' }, { status: 401 });
        }

        console.log('[API] User authenticated successfully. User ID:', session.user.id);

        // Get all API keys for the current user
        console.log('[API] Fetching API keys for user');
        const { data: apiKeys, error } = await supabase
            .from('api_keys')
            .select('id, name, created_at, expires_at, last_used_at, is_active, description, is_admin_key')
            .eq('user_id', session.user.id as string)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching API keys:', error);
            return NextResponse.json({ error: 'Failed to fetch API keys', details: error.message }, { status: 500 });
        }

        console.log('[API] Successfully fetched API keys. Count:', apiKeys ? apiKeys.length : 0);
        return NextResponse.json({ apiKeys });
    } catch (error: any) {
        console.error('[API] Unexpected error fetching API keys:', error);
        // Log stack trace for better debugging
        console.error('[API] Stack trace:', error.stack);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error.message || String(error)
        }, { status: 500 });
    }
}

// POST endpoint to create a new API key
export async function POST(request: NextRequest) {
    console.log('[API] POST /api/keys - Request received');
    try {
        console.log('[API] Using cookies for authentication (POST)');

        // Using the createRouteHandlerClient with properly handled cookies
        const supabase = createRouteHandlerClient<Database>({ cookies });

        console.log('[API] Supabase client created');

        // Check if user is authenticated
        console.log('[API] Checking authentication for API key creation');
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError) {
            console.error('[API] Authentication error during key creation:', authError);
            return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
        }

        if (!session) {
            console.error('[API] No session found during key creation');
            return NextResponse.json({ error: 'Unauthorized', details: 'No session found' }, { status: 401 });
        }

        console.log('[API] User authenticated for key creation. User ID:', session.user.id);

        // Check if user is an admin - required to create API keys
        console.log('[API] Checking if user is admin');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('[API] Error fetching user profile:', profileError);
            return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
        }

        const isAdmin = profile?.is_admin === true;
        console.log('[API] User admin status:', isAdmin);

        // Only allow admins to create API keys
        if (!isAdmin) {
            console.warn('[API] Non-admin user attempted to create API key');
            return NextResponse.json({
                error: 'Only administrators can create API keys'
            }, { status: 403 });
        }

        // Get request data
        const body: CreateApiKeyRequest = await request.json();
        console.log('[API] Request body received:', { name: body.name, hasDescription: !!body.description, expiresAt: body.expires_at, isAdminKey: body.is_admin_key });

        if (!body.name) {
            console.error('[API] Missing required field: name');
            return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
        }

        // Determine if this should be an admin key
        const isAdminKey = body.is_admin_key || false;

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

        // Insert the new API key record
        const { data: insertedKey, error: insertError } = await supabase
            .from('api_keys')
            .insert({
                user_id: session.user.id,
                name: body.name,
                description: body.description || null,
                expires_at: body.expires_at || null,
                api_key: apiKey,
                created_from_ip: ip,
                is_admin_key: isAdminKey
            })
            .select('id, name, created_at, expires_at, is_active, description, is_admin_key')
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
        console.error('[API] Unexpected error creating API key:', error);
        console.error('[API] Stack trace:', error.stack);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error.message || String(error)
        }, { status: 500 });
    }
}

// DELETE endpoint to revoke/delete API key
export async function DELETE(request: NextRequest) {
    console.log('[API] DELETE /api/keys - Request received');
    try {
        console.log('[API] Using cookies for authentication (DELETE)');

        // Using the createRouteHandlerClient with properly handled cookies
        const supabase = createRouteHandlerClient<Database>({ cookies });

        console.log('[API] Supabase client created');

        // Check if user is authenticated
        console.log('[API] Checking authentication for key deletion');
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError) {
            console.error('[API] Authentication error during key deletion:', authError);
            return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
        }

        if (!session) {
            console.error('[API] No session found during key deletion');
            return NextResponse.json({ error: 'Unauthorized', details: 'No session found' }, { status: 401 });
        }

        console.log('[API] User authenticated for key deletion. User ID:', session.user.id);

        // Get key ID from URL search params
        const searchParams = request.nextUrl.searchParams;
        const keyId = searchParams.get('id');

        if (!keyId) {
            return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
        }

        // Check if the user is the owner of the API key or an admin
        const { data: apiKey, error: fetchError } = await supabase
            .from('api_keys')
            .select('id, user_id')
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

        return NextResponse.json({
            success: true,
            message: 'API key deleted successfully'
        });
    } catch (error: any) {
        console.error('[API] Unexpected error deleting API key:', error);
        console.error('[API] Stack trace:', error.stack);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error.message || String(error)
        }, { status: 500 });
    }
}