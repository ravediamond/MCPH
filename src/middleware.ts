import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session } } = await supabase.auth.getSession()

    // Define public paths that don't require authentication
    const publicPaths = ['/', '/auth/signin']
    const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path)

    // If user is not authenticated and trying to access protected route
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // If user is authenticated and trying to access auth pages
    if (session && req.nextUrl.pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
}

// Configure which routes should be handled by the middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}