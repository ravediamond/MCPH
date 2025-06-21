import { Request, Response, NextFunction } from "express";

// In-memory IP-based request throttling
// Map of IP addresses to {count, timestamp}
const ipThrottleMap = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS_PER_WINDOW = 60; // Maximum requests per window
const THROTTLE_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds

/**
 * Middleware for IP-based request throttling
 */
export const ipThrottlingMiddleware = function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Skip throttling for specific IPs if needed
  // if (ip === 'trusted-ip') return next();

  const now = Date.now();
  const ipData = ipThrottleMap.get(ip);

  if (!ipData) {
    // First request from this IP
    ipThrottleMap.set(ip, { count: 1, timestamp: now });
    return next();
  }

  // Reset counter if outside the window
  if (now - ipData.timestamp > THROTTLE_WINDOW_MS) {
    ipThrottleMap.set(ip, { count: 1, timestamp: now });
    return next();
  }

  // Increment counter if within the window
  ipData.count += 1;

  // Check if over limit
  if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Too many requests. Please try again later.",
      },
      id: null,
    });
  }

  // Update the map
  ipThrottleMap.set(ip, ipData);
  next();
};

/**
 * Clean up expired throttle entries periodically
 */
export function startThrottleCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipThrottleMap.entries()) {
      if (now - data.timestamp > THROTTLE_WINDOW_MS) {
        ipThrottleMap.delete(ip);
      }
    }
  }, THROTTLE_WINDOW_MS);
}
