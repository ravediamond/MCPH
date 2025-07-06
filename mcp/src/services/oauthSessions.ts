import { randomBytes } from "crypto";

interface OAuthSession {
  authorizationCode: string;
  firebaseToken: string;
  state: string;
  clientId: string;
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

// Simple in-memory storage for OAuth sessions
const oauthSessions = new Map<string, OAuthSession>();

// Cleanup interval (run every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a secure authorization code
 */
export function generateAuthorizationCode(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Generate a secure state parameter
 */
export function generateState(): string {
  return randomBytes(16).toString("base64url");
}

/**
 * Store OAuth session with authorization code
 */
export function storeOAuthSession(
  authorizationCode: string,
  firebaseToken: string,
  state: string,
  clientId: string,
  redirectUri: string,
): void {
  const now = new Date();
  const session: OAuthSession = {
    authorizationCode,
    firebaseToken,
    state,
    clientId,
    redirectUri,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TIMEOUT),
  };

  oauthSessions.set(authorizationCode, session);
  console.log(
    `[OAuth] Stored session for code: ${authorizationCode.substring(0, 8)}...`,
  );
}

/**
 * Retrieve and consume OAuth session by authorization code
 */
export function consumeOAuthSession(
  authorizationCode: string,
): OAuthSession | null {
  const session = oauthSessions.get(authorizationCode);

  if (!session) {
    console.log(
      `[OAuth] Session not found for code: ${authorizationCode.substring(0, 8)}...`,
    );
    return null;
  }

  // Check if session has expired
  if (new Date() > session.expiresAt) {
    oauthSessions.delete(authorizationCode);
    console.log(
      `[OAuth] Session expired for code: ${authorizationCode.substring(0, 8)}...`,
    );
    return null;
  }

  // Remove session after consumption (one-time use)
  oauthSessions.delete(authorizationCode);
  console.log(
    `[OAuth] Consumed session for code: ${authorizationCode.substring(0, 8)}...`,
  );

  return session;
}

/**
 * Validate state parameter
 */
export function validateState(state: string, expectedState: string): boolean {
  return state === expectedState;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions(): void {
  const now = new Date();
  let cleanedCount = 0;

  for (const [code, session] of oauthSessions.entries()) {
    if (now > session.expiresAt) {
      oauthSessions.delete(code);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[OAuth] Cleaned up ${cleanedCount} expired sessions`);
  }
}

/**
 * Start periodic cleanup of expired sessions
 */
export function startOAuthSessionCleanup(): void {
  setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);
  console.log("[OAuth] Started session cleanup interval");
}

/**
 * Get session statistics (for debugging)
 */
export function getOAuthSessionStats(): {
  total: number;
  expired: number;
  active: number;
} {
  const now = new Date();
  let expired = 0;
  let active = 0;

  for (const session of oauthSessions.values()) {
    if (now > session.expiresAt) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: oauthSessions.size,
    expired,
    active,
  };
}
