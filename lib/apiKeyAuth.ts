import { findUserByApiKey, ApiKeyRecord } from "../services/firebaseService";
import type { Request, Response, NextFunction } from "express";
import { IncomingMessage } from "http";

/**
 * Simple NextRequest type for MCP standalone use
 */
interface NextRequest {
  headers: {
    get(name: string): string | null;
  };
}

// Define Response for throwing response objects
class CustomResponse {
  constructor(
    body?: any,
    init?: { status?: number; headers?: Record<string, string> },
  ) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = init?.headers || {};
  }
  body: any;
  status: number;
  headers: Record<string, string>;
}

/**
 * Interface for authenticated request that extends IncomingMessage
 */
export interface AuthenticatedRequest extends IncomingMessage {
  user?: {
    userId: string;
    authMethod: "api_key" | "firebase_auth";
  };
  clientName?: string;
  body: any;
  headers: {
    [key: string]: string | string[] | undefined;
    "x-authorization"?: string;
    authorization?: string;
  };
  auth?: {
    // Add auth properties as needed
  };
}

/**
 * Checks for an API key in the Authorization header (Bearer <key>), validates it, and returns the user record if valid, otherwise throws.
 */
export async function requireApiKeyAuth(req: NextRequest) {
  const authHeader = req.headers.get("x-authorization");

  if (!authHeader || !authHeader.trim() || !authHeader.startsWith("Bearer ")) {
    console.log("[requireApiKeyAuth] Missing or invalid Authorization header");
    throw new CustomResponse(
      JSON.stringify({ error: "Missing or invalid API key" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const apiKey = authHeader.replace("Bearer ", "").trim();
  const apiKeyRecord = await findUserByApiKey(apiKey);
  if (!apiKeyRecord) {
    console.log("[requireApiKeyAuth] API key not found in database");
    throw new CustomResponse(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return apiKeyRecord;
}

/**
 * Express middleware to check both Firebase Auth and API key authentication
 */
export function apiKeyAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  // Look for authorization in headers
  const authHeader =
    req.headers["x-authorization"] || req.headers.authorization;

  if (
    !authHeader ||
    typeof authHeader !== "string" ||
    !authHeader.startsWith("Bearer ")
  ) {
    console.log(
      "[apiKeyAuthMiddleware] Missing or invalid Authorization header",
    );
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "Authentication required. Please provide a valid API key or Firebase token.",
      },
      id: req.body?.id || null,
    });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // Check if this is an OAuth token (mock tokens start with "firebase_custom_token_")
  if (token.startsWith("firebase_custom_token_")) {
    console.log(
      "[apiKeyAuthMiddleware] OAuth token detected, extracting user ID",
    );

    // Extract the actual user ID from the OAuth token
    // The token format is: firebase_custom_token_{code}_{timestamp}_{userId}
    const tokenParts = token.split("_");
    if (tokenParts.length >= 5) {
      const userId = tokenParts.slice(4).join("_"); // Join remaining parts as userId
      req.user = {
        userId: userId,
        authMethod: "firebase_auth",
      };
      console.log(
        "[apiKeyAuthMiddleware] OAuth auth successful for user:",
        userId,
      );
    } else {
      console.log(
        "[apiKeyAuthMiddleware] Invalid OAuth token format, using fallback",
      );
      req.user = {
        userId: "oauth_user", // Fallback for invalid token format
        authMethod: "firebase_auth",
      };
    }

    // Extract client name if available in the request
    if (req.body?.params?.name) {
      req.clientName = req.body.params.name;
    }

    return next();
  }

  // Try Firebase Auth first
  (async () => {
    try {
      // Import Firebase Admin auth
      const { auth } = await import("../lib/firebaseAdmin");
      const decodedToken = await auth.verifyIdToken(token);

      // Firebase auth successful
      req.user = {
        userId: decodedToken.uid,
        authMethod: "firebase_auth",
      };

      // Extract client name if available in the request
      if (req.body?.params?.name) {
        req.clientName = req.body.params.name;
      }

      console.log(
        "[apiKeyAuthMiddleware] Firebase auth successful for user:",
        decodedToken.uid,
      );
      return next();
    } catch (firebaseError) {
      // Firebase auth failed, try API key
      console.log(
        "[apiKeyAuthMiddleware] Firebase auth failed, trying API key",
      );

      try {
        const apiKeyRecord = await findUserByApiKey(token);
        if (!apiKeyRecord) {
          console.log("[apiKeyAuthMiddleware] API key not found in database");
          return res.status(401).json({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: "Invalid API key or Firebase token.",
            },
            id: req.body?.id || null,
          });
        }

        // API key auth successful
        req.user = {
          userId: apiKeyRecord.userId,
          authMethod: "api_key",
        };

        // Extract client name if available in the request
        if (req.body?.params?.name) {
          req.clientName = req.body.params.name;
        }

        console.log(
          "[apiKeyAuthMiddleware] API key auth successful for user:",
          apiKeyRecord.userId,
        );
        next();
      } catch (apiKeyError) {
        console.error(
          "[apiKeyAuthMiddleware] Error validating API key:",
          apiKeyError,
        );
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error during authentication.",
          },
          id: req.body?.id || null,
        });
      }
    }
  })();
}

/**
 * Extracts user information from a request by checking the Authorization header
 * This handles both Firebase authentication tokens and API keys
 * @param req The Next.js request object
 * @returns User info object or null if not authenticated
 */
export async function getUserFromRequest(
  req: NextRequest,
): Promise<{ uid: string } | null> {
  try {
    // First try Firebase auth token
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();

      try {
        // Import Firebase Admin auth
        const { auth } = await import("../lib/firebaseAdmin");
        const decodedToken = await auth.verifyIdToken(token);
        return { uid: decodedToken.uid };
      } catch (firebaseError) {
        // If Firebase token verification fails, try API key
        console.log(
          "[getUserFromRequest] Not a valid Firebase token, trying API key",
        );
      }
    }

    // Then try API key
    const apiKeyHeader = req.headers.get("x-authorization") || authHeader;
    if (
      apiKeyHeader &&
      typeof apiKeyHeader === "string" &&
      apiKeyHeader.startsWith("Bearer ")
    ) {
      const apiKey = apiKeyHeader.replace("Bearer ", "").trim();
      const apiKeyRecord = await findUserByApiKey(apiKey);

      if (apiKeyRecord) {
        return { uid: apiKeyRecord.userId };
      }
    }

    return null;
  } catch (error) {
    console.error("[getUserFromRequest] Error:", error);
    return null;
  }
}
