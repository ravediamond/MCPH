import { createServer } from "./express";
import { createMcpServer } from "../config/server";
import { registerAllTools } from "../tools";

/**
 * Initialize the MCP server and register all tools
 */
export function initializeMcpServer() {
  // Create a server instance for initializing tools
  const mcpServer = createMcpServer();

  // Register all tools with the server
  registerAllTools(mcpServer);

  return mcpServer;
}

/**
 * Start the server on the specified port
 */
export function startServer(port: number = 8080) {
  // Initialize the MCP server
  initializeMcpServer();

  // Create and configure the Express server
  const app = createServer();

  // Start listening on the specified port
  app.listen(port, () => {
    console.log(`MCPH ready to go on port ${port}!`);
  });

  return app;
}
