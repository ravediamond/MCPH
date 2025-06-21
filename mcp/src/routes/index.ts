import { Router } from "express";
import { configureMcpRoutes } from "./mcp";

/**
 * Configure all routes for the application
 */
export function configureRoutes(router: Router): void {
  configureMcpRoutes(router);
}
