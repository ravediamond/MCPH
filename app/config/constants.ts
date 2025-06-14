export const API = {
  PUBLIC: {
    BASE_PATH: "/api",
    VERSION: "v1",
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
    DEFAULT_RATE_LIMIT: 30,
  },

  INTERNAL: {
    BASE_PATH: "/api/internal",
  },
};

/**
 * Data TTL (Time To Live) Constants
 * These constants are used for managing data expiration.
 */
export const DATA_TTL = {
  /** Fixed TTL value in days (simplified for v1) */
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
    // Simplified for v1 - always use default TTL
    const days = DATA_TTL.DEFAULT_DAYS;
    return baseTimestamp + days * 24 * 60 * 60 * 1000;
  },
};
