import { Router } from "express";
import { configureMcpRoutes } from "./mcp";
import { configureOAuthRoutes } from "./oauth";
import { configureHealthRoutes } from "./health";
import { configureMetricsRoutes } from "./metrics";

/**
 * Configure all routes for the application
 */
export function configureRoutes(router: Router): void {
  // Configure health routes first (for load balancer checks)
  configureHealthRoutes(router);

  // Configure metrics routes (for monitoring)
  configureMetricsRoutes(router);

  // Configure OAuth routes (for discovery endpoints)
  configureOAuthRoutes(router);

  // Configure MCP routes
  configureMcpRoutes(router);
}
