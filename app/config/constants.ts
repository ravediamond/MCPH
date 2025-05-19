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
    BASE_PATH: "/api",

    /** API version */
    VERSION: "v1",

    /** Maximum file upload size in bytes (default: 10MB) */
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024,

    /** Default rate limit for API requests (requests per minute) */
    DEFAULT_RATE_LIMIT: 30,
  },

  /**
   * Internal API endpoints configuration
   * These endpoints are used for internal services and require authentication.
   */
  INTERNAL: {
    /** Base path for internal API routes */
    BASE_PATH: "/api/internal",
  },
};

/**
 * Data TTL (Time To Live) Constants
 * These constants are used for managing data expiration.
 */
export const DATA_TTL = {
  /** Available TTL options in days */
  OPTIONS: [1, 7, 30],

  /** Default TTL in days */
  DEFAULT_DAYS: 30,

  /** Maximum TTL in days (for the current release) */
  MAX_DAYS: 30,

  /**
   * Converts TTL in days to seconds.
   * @param days TTL in days.
   * @returns TTL in seconds.
   */
  toSeconds: (days: number): number => days * 24 * 60 * 60,

  /**
   * Calculates the expiration timestamp.
   * @param baseTimestamp The base timestamp (e.g., upload time) in milliseconds since epoch.
   * @param ttlDays TTL in days. If not provided, or invalid, default TTL is used.
   * @returns Expiration timestamp in milliseconds since epoch.
   */
  getExpirationTimestamp: (baseTimestamp: number, ttlDays?: number): number => {
    const days =
      ttlDays &&
      DATA_TTL.OPTIONS.includes(ttlDays) &&
      ttlDays <= DATA_TTL.MAX_DAYS
        ? ttlDays
        : DATA_TTL.DEFAULT_DAYS;
    return baseTimestamp + days * 24 * 60 * 60 * 1000;
  },
};
