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

  // Debug logging for token analysis
  console.log("[apiKeyAuthMiddleware] Token info:", {
    length: token.length,
    hasJwtFormat: token.includes(".") && token.split(".").length === 3,
    prefix: token.substring(0, 20) + "...",
    isApiKey: token.length === 64, // SHA-256 API keys are 64 chars
  });

  // Check if this is a Firebase custom token (starts with specific format)
  // Custom tokens are JWT tokens that we generated in the OAuth flow
  if (token.includes(".") && token.split(".").length === 3) {
    try {
      // Try to decode the JWT to see if it's a custom token we generated
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString(),
      );

      console.log("[apiKeyAuthMiddleware] JWT payload:", {
        iss: payload.iss,
        aud: payload.aud,
        uid: payload.uid,
        hasFirebaseIss: payload.iss && payload.iss.includes("firebase"),
        hasFirebaseAud:
          payload.aud && payload.aud.includes("identitytoolkit.googleapis.com"),
        isCustomToken:
          payload.iss &&
          payload.aud &&
          payload.uid &&
          (payload.iss.includes("gserviceaccount.com") ||
            payload.iss.includes("firebase")) &&
          payload.aud.includes("identitytoolkit.googleapis.com"),
      });

      // Firebase custom tokens have:
      // - iss: service account email (ends with @developer.gserviceaccount.com or @firebase-adminsdk-*.iam.gserviceaccount.com)
      // - aud: https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit
      // - uid: user ID
      const isFirebaseCustomToken =
        payload.iss &&
        payload.aud &&
        payload.uid &&
        (payload.iss.includes("gserviceaccount.com") ||
          payload.iss.includes("firebase")) &&
        payload.aud.includes("identitytoolkit.googleapis.com");

      if (isFirebaseCustomToken) {
        // This looks like a Firebase custom token, extract the uid directly
        req.user = {
          userId: payload.uid,
          authMethod: "firebase_auth",
        };

        // Extract client name if available in the request
        if (req.body?.params?.name) {
          req.clientName = req.body.params.name;
        }

        console.log(
          "[apiKeyAuthMiddleware] Custom token auth successful for user:",
          payload.uid,
        );
        return next();
      } else {
        console.log(
          "[apiKeyAuthMiddleware] JWT payload doesn't match Firebase custom token format",
        );
      }
    } catch (jwtError) {
      // Not a valid JWT or not our custom token, continue to regular Firebase auth
      console.log(
        "[apiKeyAuthMiddleware] JWT decode failed:",
        jwtError instanceof Error ? jwtError.message : String(jwtError),
      );
    }
  } else {
    console.log(
      "[apiKeyAuthMiddleware] Token is not in JWT format, checking as API key or ID token",
    );
  }

  // Try Firebase Auth for ID tokens
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
