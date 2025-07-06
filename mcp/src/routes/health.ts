import { Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import { withFirebaseTimeout, withStorageTimeout } from "../middleware/timeout";

/**
 * Enhanced health check endpoints for MCP best practices compliance
 * Provides dependency validation and system status monitoring
 */

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version?: string;
  uptime: number;
  dependencies: DependencyStatus[];
  metrics?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    requests: {
      total: number;
      errors: number;
      errorRate: number;
    };
  };
}

interface DependencyStatus {
  name: string;
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
}

// Global counters for basic metrics
let totalRequests = 0;
let errorRequests = 0;
const startTime = Date.now();

export function incrementRequestCount() {
  totalRequests++;
}

export function incrementErrorCount() {
  errorRequests++;
}

/**
 * Check Firebase/Firestore connectivity
 */
async function checkFirebaseHealth(): Promise<DependencyStatus> {
  const startTime = Date.now();

  try {
    // Import Firebase service dynamically to avoid circular dependencies
    const { db } = await import("../../../lib/firebaseAdmin");

    // Perform a simple read operation to test connectivity
    await withFirebaseTimeout(
      db.collection("_health").limit(1).get(),
      3000, // 3 second timeout for health check
    );

    return {
      name: "firebase",
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    logger.error("Firebase health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      name: "firebase",
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check Google Cloud Storage connectivity
 */
async function checkStorageHealth(): Promise<DependencyStatus> {
  const startTime = Date.now();

  try {
    // Import storage service dynamically
    const { storage } = await import("../../../lib/gcpStorageClient");

    // Test bucket access
    const bucketName = process.env.GCS_BUCKET_NAME || "mcph-dev-storage";
    const bucket = storage.bucket(bucketName);

    await withStorageTimeout(
      bucket.exists(),
      3000, // 3 second timeout for health check
    );

    return {
      name: "storage",
      status: "healthy",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    logger.error("Storage health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      name: "storage",
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const errorRate =
    totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

  return {
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    requests: {
      total: totalRequests,
      errors: errorRequests,
      errorRate: Math.round(errorRate * 100) / 100,
    },
  };
}

/**
 * Determine overall health status based on dependencies
 */
function getOverallStatus(
  dependencies: DependencyStatus[],
): "healthy" | "degraded" | "unhealthy" {
  const unhealthy = dependencies.filter((dep) => dep.status === "unhealthy");

  if (unhealthy.length === 0) {
    return "healthy";
  } else if (unhealthy.length === dependencies.length) {
    return "unhealthy";
  } else {
    return "degraded";
  }
}

/**
 * Configure health check routes
 */
export function configureHealthRoutes(router: Router): void {
  /**
   * Basic health check endpoint (existing)
   * Responds quickly for load balancer checks
   */
  router.get("/healthz", (req: Request, res: Response) => {
    incrementRequestCount();
    res.status(200).json({ status: "ok" });
  });

  /**
   * Simple liveness probe
   * Quick check that the server is running
   */
  router.get("/health/live", (req: Request, res: Response) => {
    incrementRequestCount();
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
    });
  });

  /**
   * Readiness probe with dependency checks
   * Comprehensive health check with dependency validation
   */
  router.get("/health/ready", async (req: Request, res: Response) => {
    incrementRequestCount();
    const startTime = Date.now();

    try {
      logger.info("Health check requested", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Check all dependencies
      const dependencies = await Promise.all([
        checkFirebaseHealth(),
        checkStorageHealth(),
      ]);

      const overallStatus = getOverallStatus(dependencies);
      const metrics = getSystemMetrics();

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
        uptime: Date.now() - startTime,
        dependencies,
        metrics,
      };

      // Set appropriate HTTP status code
      const statusCode =
        overallStatus === "healthy"
          ? 200
          : overallStatus === "degraded"
            ? 200
            : 503;

      logger.info("Health check completed", {
        status: overallStatus,
        dependencies: dependencies.map((d) => ({
          name: d.name,
          status: d.status,
        })),
        duration: Date.now() - startTime,
      });

      res.status(statusCode).json(healthStatus);
    } catch (error) {
      incrementErrorCount();
      logger.error("Health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
  });

  /**
   * Detailed health status (admin endpoint)
   * Includes additional system information
   */
  router.get("/health/status", async (req: Request, res: Response) => {
    incrementRequestCount();

    try {
      const dependencies = await Promise.all([
        checkFirebaseHealth(),
        checkStorageHealth(),
      ]);

      const metrics = getSystemMetrics();
      const overallStatus = getOverallStatus(dependencies);

      const detailedStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
        uptime: Date.now() - startTime,
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        dependencies,
        metrics,
        system: {
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
        },
      };

      res.status(200).json(detailedStatus);
    } catch (error) {
      incrementErrorCount();
      logger.error("Detailed health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "Health status check failed",
      });
    }
  });
}
