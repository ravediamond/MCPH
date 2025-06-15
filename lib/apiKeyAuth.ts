import { findUserByApiKey, ApiKeyRecord } from "../services/firebaseService";
import { NextRequest } from "next/server";
import type { Request, Response, NextFunction } from "express";

/**
 * Interface for authenticated request
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
  clientName?: string;
}

/**
 * Checks for an API key in the Authorization header (Bearer <key>), validates it, and returns the user record if valid, otherwise throws.
 */
export async function requireApiKeyAuth(req: NextRequest) {
  const authHeader = req.headers.get("x-authorization");

  if (!authHeader || !authHeader.trim() || !authHeader.startsWith("Bearer ")) {
    console.log("[requireApiKeyAuth] Missing or invalid Authorization header");
    throw new Response(
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
    throw new Response(JSON.stringify({ error: "Invalid API key" }), {
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
    .catch((error) => {
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
