import { Request, Response, NextFunction } from "express";
import { ipThrottlingMiddleware, startThrottleCleanup } from "./throttling";
import { mapUserToAuth } from "./mapUserToAuth";
import {
  standardTimeoutMiddleware,
  extendedTimeoutMiddleware,
} from "./timeout";
import { metricsMiddleware } from "./metrics";

/**
 * Middleware for CORS headers
 */
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
}

// Export all middleware for easy import
export {
  ipThrottlingMiddleware,
  startThrottleCleanup,
  mapUserToAuth,
  standardTimeoutMiddleware,
  extendedTimeoutMiddleware,
  metricsMiddleware,
};
