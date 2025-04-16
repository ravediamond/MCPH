import { API } from './app/config/constants';

export const config = {
    // Middleware will only run on API routes
    matcher: [
        // Match all paths starting with the public API path
        `${API.PUBLIC.BASE_PATH}/:path*`,
    ],
};