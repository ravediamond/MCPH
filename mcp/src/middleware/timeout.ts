import { Request, Response, NextFunction } from "express";

/**
 * Timeout middleware to ensure MCP best practice compliance:
 * "Respond to requests within 1 second for standard operations"
 */

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds - graceful for complex operations
const STANDARD_TIMEOUT_MS = 1000; // 1 second for standard operations

/**
 * Middleware that adds timeout handling to requests
 */
export const timeoutMiddleware = (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set a timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Request timeout - operation took too long to complete",
            data: {
              timeoutMs,
              requestId: req.headers["x-request-id"] || "unknown",
            },
          },
          id: null,
        });
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on("finish", () => {
      clearTimeout(timeout);
    });

    // Clear timeout when response is closed (client disconnect)
    res.on("close", () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Standard timeout for MCP operations (1 second)
 */
export const standardTimeoutMiddleware = timeoutMiddleware(STANDARD_TIMEOUT_MS);

/**
 * Extended timeout for complex operations (30 seconds)
 */
export const extendedTimeoutMiddleware = timeoutMiddleware(DEFAULT_TIMEOUT_MS);

/**
 * Utility function to wrap async operations with timeout
 */
export const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  timeoutMessage: string = "Operation timed out",
): Promise<T> => {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs),
    ),
  ]);
};

/**
 * Timeout wrapper for Firebase operations
 */
export const withFirebaseTimeout = <T>(
  operation: Promise<T>,
  timeoutMs: number = 5000,
): Promise<T> => {
  return withTimeout(
    operation,
    timeoutMs,
    "Firebase operation timed out - please try again",
  );
};

/**
 * Timeout wrapper for Storage operations
 */
export const withStorageTimeout = <T>(
  operation: Promise<T>,
  timeoutMs: number = 10000,
): Promise<T> => {
  return withTimeout(
    operation,
    timeoutMs,
    "Storage operation timed out - please try again",
  );
};
