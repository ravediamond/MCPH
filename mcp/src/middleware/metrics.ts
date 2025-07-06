import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Performance metrics collection middleware for MCP best practices compliance
 * Tracks request metrics, response times, and error rates
 */

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  tool?: string;
}

// In-memory metrics storage (in production, use Redis or similar)
const metricsStore = {
  requests: [] as RequestMetrics[],
  totalRequests: 0,
  totalErrors: 0,
  responseTimes: [] as number[],
  statusCodes: new Map<number, number>(),
  methods: new Map<string, number>(),
  paths: new Map<string, number>(),
  startTime: Date.now(),
};

const MAX_STORED_REQUESTS = 1000; // Keep last 1000 requests in memory
const METRICS_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Middleware to collect request metrics
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  // Extract tool name from MCP requests
  let toolName: string | undefined;
  if (req.body && req.body.method && req.body.method.startsWith("tools/")) {
    toolName = req.body.method.replace("tools/", "");
  }

  // Capture response when finished
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;

    const metrics: RequestMetrics = {
      method: req.method,
      path: req.path || req.url,
      statusCode: res.statusCode,
      responseTime,
      timestamp: startTime,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      tool: toolName,
    };

    // Store metrics
    recordMetrics(metrics);

    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      logger.warn("Slow request detected", {
        method: req.method,
        path: req.path,
        responseTime,
        statusCode: res.statusCode,
        tool: toolName,
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.warn("Request error", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        tool: toolName,
      });
    }
  });

  next();
};

/**
 * Record metrics in memory store
 */
function recordMetrics(metrics: RequestMetrics) {
  // Update counters
  metricsStore.totalRequests++;
  if (metrics.statusCode >= 400) {
    metricsStore.totalErrors++;
  }

  // Track response times
  metricsStore.responseTimes.push(metrics.responseTime);
  if (metricsStore.responseTimes.length > MAX_STORED_REQUESTS) {
    metricsStore.responseTimes.shift();
  }

  // Track status codes
  metricsStore.statusCodes.set(
    metrics.statusCode,
    (metricsStore.statusCodes.get(metrics.statusCode) || 0) + 1,
  );

  // Track methods
  metricsStore.methods.set(
    metrics.method,
    (metricsStore.methods.get(metrics.method) || 0) + 1,
  );

  // Track paths
  metricsStore.paths.set(
    metrics.path,
    (metricsStore.paths.get(metrics.path) || 0) + 1,
  );

  // Store detailed request
  metricsStore.requests.push(metrics);
  if (metricsStore.requests.length > MAX_STORED_REQUESTS) {
    metricsStore.requests.shift();
  }

  // Clean old data
  cleanOldMetrics();
}

/**
 * Clean metrics older than the window
 */
function cleanOldMetrics() {
  const cutoff = Date.now() - METRICS_WINDOW_MS;
  metricsStore.requests = metricsStore.requests.filter(
    (req) => req.timestamp > cutoff,
  );
}

/**
 * Calculate percentiles from response times
 */
function calculatePercentiles(times: number[]) {
  if (times.length === 0) return { p50: 0, p95: 0, p99: 0 };

  const sorted = [...times].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    p50: sorted[Math.floor(len * 0.5)] || 0,
    p95: sorted[Math.floor(len * 0.95)] || 0,
    p99: sorted[Math.floor(len * 0.99)] || 0,
  };
}

/**
 * Get current metrics summary
 */
export function getMetricsSummary() {
  const now = Date.now();
  const uptime = now - metricsStore.startTime;
  const recentRequests = metricsStore.requests.filter(
    (req) => req.timestamp > now - 5 * 60 * 1000, // Last 5 minutes
  );

  const percentiles = calculatePercentiles(metricsStore.responseTimes);
  const errorRate =
    metricsStore.totalRequests > 0
      ? (metricsStore.totalErrors / metricsStore.totalRequests) * 100
      : 0;

  const requestsPerSecond =
    metricsStore.totalRequests > 0
      ? metricsStore.totalRequests / (uptime / 1000)
      : 0;

  return {
    timestamp: new Date().toISOString(),
    uptime,
    requests: {
      total: metricsStore.totalRequests,
      errors: metricsStore.totalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      recent: recentRequests.length,
    },
    responseTime: {
      average:
        metricsStore.responseTimes.length > 0
          ? Math.round(
              metricsStore.responseTimes.reduce((a, b) => a + b, 0) /
                metricsStore.responseTimes.length,
            )
          : 0,
      ...percentiles,
    },
    statusCodes: Object.fromEntries(metricsStore.statusCodes),
    methods: Object.fromEntries(metricsStore.methods),
    topPaths: Array.from(metricsStore.paths.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [path, count]) => ({ ...obj, [path]: count }), {}),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage: Math.round(
        (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
          100,
      ),
    },
  };
}

/**
 * Get Prometheus-compatible metrics
 */
export function getPrometheusMetrics(): string {
  const summary = getMetricsSummary();
  const metrics: string[] = [];

  // Add help and type definitions
  metrics.push("# HELP mcp_requests_total Total number of HTTP requests");
  metrics.push("# TYPE mcp_requests_total counter");
  metrics.push(`mcp_requests_total ${summary.requests.total}`);
  metrics.push("");

  metrics.push(
    "# HELP mcp_request_errors_total Total number of HTTP request errors",
  );
  metrics.push("# TYPE mcp_request_errors_total counter");
  metrics.push(`mcp_request_errors_total ${summary.requests.errors}`);
  metrics.push("");

  metrics.push(
    "# HELP mcp_request_duration_seconds Request duration in seconds",
  );
  metrics.push("# TYPE mcp_request_duration_seconds histogram");
  metrics.push(
    `mcp_request_duration_seconds_sum ${metricsStore.responseTimes.reduce((a, b) => a + b, 0) / 1000}`,
  );
  metrics.push(
    `mcp_request_duration_seconds_count ${metricsStore.responseTimes.length}`,
  );
  metrics.push("");

  metrics.push("# HELP mcp_memory_usage_bytes Memory usage in bytes");
  metrics.push("# TYPE mcp_memory_usage_bytes gauge");
  metrics.push(`mcp_memory_usage_bytes ${summary.memory.used}`);
  metrics.push("");

  metrics.push("# HELP mcp_uptime_seconds Server uptime in seconds");
  metrics.push("# TYPE mcp_uptime_seconds gauge");
  metrics.push(`mcp_uptime_seconds ${summary.uptime / 1000}`);
  metrics.push("");

  // Status code metrics
  metrics.push("# HELP mcp_requests_by_status_total Requests by status code");
  metrics.push("# TYPE mcp_requests_by_status_total counter");
  for (const [statusCode, count] of metricsStore.statusCodes) {
    metrics.push(
      `mcp_requests_by_status_total{status_code="${statusCode}"} ${count}`,
    );
  }
  metrics.push("");

  return metrics.join("\n");
}

/**
 * Get detailed request history
 */
export function getRequestHistory(limit: number = 100) {
  return metricsStore.requests.slice(-limit).map((req) => ({
    ...req,
    timestamp: new Date(req.timestamp).toISOString(),
  }));
}
