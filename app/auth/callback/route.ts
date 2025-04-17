import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../../../types/database.types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    // If there's no code, redirect to home page
    if (!code) {
        console.log('No code found in callback URL');
        return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    try {
        // Create a Supabase client using the route handler
        const cookiesInstance = cookies();
        const supabase = createRouteHandlerClient<Database>({
            cookies: () => cookiesInstance
        });

        console.log('Auth callback: Exchanging code for session');

        // Exchange code for session (this sets the cookies automatically)
        await supabase.auth.exchangeCodeForSession(code);

        console.log('Auth callback: Successfully exchanged code for session');

        // URL to redirect to after sign in process completes
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
        console.error('Error in auth callback:', error);
        return NextResponse.redirect(
            new URL(`/?error=Authentication failed`, requestUrl.origin)
        );
    }
}