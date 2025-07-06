import { Router } from "express";
import { configureMcpRoutes } from "./mcp";
import { configureOAuthRoutes } from "./oauth";
import { configureMcpSseRoutes } from "./mcp-sse";

/**
 * Configure all routes for the application
 */
export function configureRoutes(router: Router): void {
  // Configure OAuth routes first (for discovery endpoints)
  configureOAuthRoutes(router);

  // Configure MCP SSE transport routes
  configureMcpSseRoutes(router);

  // Configure MCP routes
  configureMcpRoutes(router);
}
