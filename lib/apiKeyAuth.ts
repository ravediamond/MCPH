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
 * Express middleware to check API key authentication
 */
export function apiKeyAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  // Look for the API key in headers (prefer x-authorization, fallback to authorization)
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
        message: "Authentication required. Please provide a valid API key.",
      },
      id: req.body?.id || null,
    });
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();

  // Validate the API key against the database
  findUserByApiKey(apiKey)
    .then((apiKeyRecord: ApiKeyRecord | null) => {
      if (!apiKeyRecord) {
        console.log("[apiKeyAuthMiddleware] API key not found in database");
        return res.status(401).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Invalid API key.",
          },
          id: req.body?.id || null,
        });
      }

      // Attach the user to the request object for use in downstream handlers
      req.user = {
        userId: apiKeyRecord.userId,
      };

      // Extract client name if available in the request
      if (req.body?.params?.name) {
        req.clientName = req.body.params.name;
      }

      next();
    })
    .catch((error: unknown) => {
      console.error("[apiKeyAuthMiddleware] Error validating API key:", error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error during authentication.",
        },
        id: req.body?.id || null,
      });
    });
}
