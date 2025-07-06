import { randomBytes } from "crypto";
import { db } from "../../../services/firebaseService";

interface OAuthSession {
  authorizationCode: string;
  firebaseToken: string;
  state: string;
  clientId: string;
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

interface RegisteredClient {
  clientId: string;
  clientSecret?: string;
  clientName: string;
  clientUri?: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  scope: string;
  clientIdIssuedAt: number;
  createdAt: Date;
}

// Simple in-memory storage for OAuth sessions (keeping sessions in memory for now)
const oauthSessions = new Map<string, OAuthSession>();

// Collections for Firestore persistence
const OAUTH_CLIENTS_COLLECTION = "oauthClients";

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
 * Generate a secure client ID
 */
export function generateClientId(): string {
  return `mcp_${randomBytes(16).toString("base64url")}`;
}

/**
 * Generate a secure client secret
 */
export function generateClientSecret(): string {
  return randomBytes(32).toString("base64url");
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
 * Register a new OAuth client
 */
export async function registerClient(
  clientName: string,
  clientUri?: string,
  redirectUris?: string[],
  grantTypes?: string[],
  responseTypes?: string[],
  scope?: string,
): Promise<RegisteredClient> {
  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const now = new Date();

  const client: RegisteredClient = {
    clientId,
    clientSecret,
    clientName,
    clientUri,
    redirectUris: redirectUris || [],
    grantTypes: grantTypes || ["authorization_code"],
    responseTypes: responseTypes || ["code"],
    scope: scope || "mcp",
    clientIdIssuedAt: Math.floor(now.getTime() / 1000),
    createdAt: now,
  };

  try {
    // Save to Firestore
    await db.collection(OAUTH_CLIENTS_COLLECTION).doc(clientId).set({
      ...client,
      createdAt: now,
    });
    
    console.log(`[OAuth] Registered new client: ${clientName} (${clientId})`);
    return client;
  } catch (error) {
    console.error(`[OAuth] Failed to register client ${clientName}:`, error);
    throw error;
  }
}

/**
 * Get registered client by client ID
 */
export async function getRegisteredClient(clientId: string): Promise<RegisteredClient | null> {
  try {
    const doc = await db.collection(OAUTH_CLIENTS_COLLECTION).doc(clientId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
    } as RegisteredClient;
  } catch (error) {
    console.error(`[OAuth] Failed to get client ${clientId}:`, error);
    return null;
  }
}

/**
 * Validate client credentials
 */
export async function validateClient(
  clientId: string,
  clientSecret?: string,
): Promise<boolean> {
  const client = await getRegisteredClient(clientId);
  if (!client) {
    return false;
  }

  // If client has a secret, it must match
  if (client.clientSecret && client.clientSecret !== clientSecret) {
    return false;
  }

  return true;
}

/**
 * Validate redirect URI for client
 */
export async function validateRedirectUri(
  clientId: string,
  redirectUri: string,
): Promise<boolean> {
  const client = await getRegisteredClient(clientId);
  if (!client) {
    return false;
  }

  // If no redirect URIs registered, allow any (for development)
  if (client.redirectUris.length === 0) {
    return true;
  }

  return client.redirectUris.includes(redirectUri);
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
