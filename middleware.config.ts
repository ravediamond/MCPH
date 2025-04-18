import { API } from './app/config/constants';

export const config = {
    // Run middleware on both API routes and regular pages where auth might be needed
    matcher: [
        // Match all paths starting with the public API path
        `${API.PUBLIC.BASE_PATH}/:path*`,
        // Match authenticated pages that need session cookies
        '/dashboard/:path*',
        '/profile/:path*',
        '/admin/:path*',
        // Also run on the root path for login/signup
        '/',
        // IMPORTANT: Exclude auth callback route from middleware
        '/((?!auth/callback).*)',
    ],
};