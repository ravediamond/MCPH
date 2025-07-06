import { Router } from "express";
import { configureMcpRoutes } from "./mcp";
import { configureOAuthRoutes } from "./oauth";

/**
 * Configure all routes for the application
 */
export function configureRoutes(router: Router): void {
  // Configure OAuth routes first (for discovery endpoints)
  configureOAuthRoutes(router);

  // Configure MCP routes
  configureMcpRoutes(router);
}
