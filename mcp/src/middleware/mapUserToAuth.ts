import { Request, Response, NextFunction } from "express";

/**
 * Interface for AuthInfo expected by the SDK
 */
interface AuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
}

/**
 * Middleware that maps req.user to req.auth for compatibility with MCP SDK
 *
 * This middleware ensures that authenticated requests properly set the req.auth
 * field that the SDK expects, allowing tools to access caller information.
 */
export function mapUserToAuth() {
  return function (req: Request, _res: Response, next: NextFunction) {
    if (req.user) {
      (req as any).auth = {
        token: `api-key:${req.user.userId ?? "unknown"}`,
        clientId: req.user.userId,
        scopes: ["*"],
      } as AuthInfo;

      console.log("[mapUserToAuth] Set req.auth from req.user:", {
        clientId: req.user.userId,
      });
    } else {
      console.log("[mapUserToAuth] No req.user found, req.auth not set");
    }
    next();
  };
}

// --- TypeScript augmentation so `req.auth` is recognised ---
declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}
