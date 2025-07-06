import { Request, Response, Router } from "express";
import {
  getMetricsSummary,
  getPrometheusMetrics,
  getRequestHistory,
} from "../middleware/metrics";
import { logger } from "../utils/logger";

/**
 * Metrics endpoints for MCP server monitoring and observability
 */
export function configureMetricsRoutes(router: Router): void {
  /**
   * Prometheus-compatible metrics endpoint
   * Standard format for monitoring systems
   */
  router.get("/metrics", (req: Request, res: Response) => {
    try {
      const metrics = getPrometheusMetrics();
      res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
      res.status(200).send(metrics);
    } catch (error) {
      logger.error("Failed to generate Prometheus metrics", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to generate metrics",
      });
    }
  });

  /**
   * JSON metrics summary
   * Human-readable metrics overview
   */
  router.get("/metrics/summary", (req: Request, res: Response) => {
    try {
      const summary = getMetricsSummary();
      res.status(200).json(summary);
    } catch (error) {
      logger.error("Failed to generate metrics summary", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to generate metrics summary",
      });
    }
  });

  /**
   * Request history endpoint
   * Detailed request logs for debugging
   */
  router.get("/metrics/requests", (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const maxLimit = 1000;

      if (limit > maxLimit) {
        return res.status(400).json({
          error: `Limit cannot exceed ${maxLimit}`,
        });
      }

      const history = getRequestHistory(limit);
      res.status(200).json({
        requests: history,
        total: history.length,
        limit,
      });
    } catch (error) {
      logger.error("Failed to get request history", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to get request history",
      });
    }
  });

  /**
   * Performance analytics endpoint
   * Performance insights and trends
   */
  router.get("/metrics/performance", (req: Request, res: Response) => {
    try {
      const summary = getMetricsSummary();

      // Calculate additional performance insights
      const performanceInsights = {
        compliance: {
          responseTimeTarget: 1000, // 1 second as per MCP best practices
          averageResponseTime: summary.responseTime.average,
          meetingTarget: summary.responseTime.average <= 1000,
          p95UnderTarget: summary.responseTime.p95 <= 1000,
          p99UnderTarget: summary.responseTime.p99 <= 1000,
        },
        availability: {
          errorRateThreshold: 1.0, // 1% error rate threshold
          currentErrorRate: summary.requests.errorRate,
          meetingTarget: summary.requests.errorRate <= 1.0,
          uptime: summary.uptime,
          uptimeHours:
            Math.round((summary.uptime / (1000 * 60 * 60)) * 100) / 100,
        },
        throughput: {
          requestsPerSecond: summary.requests.requestsPerSecond,
          totalRequests: summary.requests.total,
          recentActivity: summary.requests.recent,
        },
        resources: {
          memoryUsage: summary.memory,
          memoryHealthy: summary.memory.percentage < 80,
        },
      };

      res.status(200).json({
        timestamp: summary.timestamp,
        performance: performanceInsights,
        details: summary,
      });
    } catch (error) {
      logger.error("Failed to generate performance analytics", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to generate performance analytics",
      });
    }
  });

  /**
   * Reset metrics endpoint (admin only)
   * For testing and development
   */
  router.post("/metrics/reset", (req: Request, res: Response) => {
    // Note: In production, this should be protected with authentication
    const adminKey = req.headers["x-admin-key"];
    const expectedAdminKey = process.env.ADMIN_KEY;

    if (!expectedAdminKey || adminKey !== expectedAdminKey) {
      logger.security("Unauthorized metrics reset attempt", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        providedKey: adminKey ? "***" : "none",
      });
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    try {
      // Reset would require access to metricsStore - this is a placeholder
      logger.info("Metrics reset requested", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(200).json({
        message: "Metrics reset (feature not implemented in current version)",
      });
    } catch (error) {
      logger.error("Failed to reset metrics", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to reset metrics",
      });
    }
  });
}
