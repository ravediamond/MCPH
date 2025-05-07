/**
 * API Constants
 * These constants are used for API route configuration and middleware.
 */
export const API = {
    /**
     * Public API endpoints configuration
     * These endpoints are exposed to the public and may require API key authentication.
     */
    PUBLIC: {
        /** Base path for all public API routes */
        BASE_PATH: '/api',

        /** API version */
        VERSION: 'v1',

        /** Maximum file upload size in bytes (default: 10MB) */
        MAX_UPLOAD_SIZE: 10 * 1024 * 1024,

        /** Default rate limit for API requests (requests per minute) */
        DEFAULT_RATE_LIMIT: 30
    },

    /**
     * Internal API endpoints configuration
     * These endpoints are used for internal services and require authentication.
     */
    INTERNAL: {
        /** Base path for internal API routes */
        BASE_PATH: '/api/internal'
    }
};