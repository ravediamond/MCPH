export const README_REFRESH_THRESHOLD_MS =
  process.env.README_REFRESH_THRESHOLD_MS
    ? Number(process.env.README_REFRESH_THRESHOLD_MS)
    : 24 * 60 * 60 * 1000;

// API versioning and access constants
export const API = {
  // Internal API routes (used only by the web app)
  INTERNAL: {
    BASE_PATH: '/api',
  },
  // Public API routes (exposed to external consumers)
  PUBLIC: {
    BASE_PATH: '/api/public',
    VERSION: 'v1',
    get VERSIONED_PATH() {
      return `${this.BASE_PATH}/${this.VERSION}`;
    }
  }
};