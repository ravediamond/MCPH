import { Request, Response, Router } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "../config/server";
import { registerAllTools } from "../tools";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";

/**
 * Configure MCP SSE transport routes
 */
export function configureMcpSseRoutes(router: Router): void {
  // MCP SSE Transport endpoint
  router.get("/mcp", async (req: Request, res: Response) => {
    console.log("[MCP SSE] New connection request");

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

    // Create MCP server instance
    const mcpServer = createMcpServer(req as AuthenticatedRequest);
    registerAllTools(mcpServer);

    // Create SSE transport
    const transport = new SSEServerTransport(res, res);

    // Connect the MCP server to the transport
    try {
      console.log("[MCP SSE] Connecting server to transport");
      await mcpServer.connect(transport);
      console.log("[MCP SSE] Server connected successfully");
    } catch (error) {
      console.error("[MCP SSE] Connection error:", error);
      res.status(500).end();
      return;
    }

    // Handle connection close
    req.on("close", () => {
      console.log("[MCP SSE] Connection closed");
      try {
        mcpServer.close();
      } catch (error) {
        console.error("[MCP SSE] Error closing server:", error);
      }
    });

    req.on("error", (error) => {
      console.error("[MCP SSE] Request error:", error);
    });
  });

  // MCP POST endpoint for message sending (required for SSE transport)
  router.post("/mcp", async (req: Request, res: Response) => {
    console.log("[MCP SSE] Received POST message");

    // For SSE transport, we don't need to handle POST requests directly
    // The SSE transport handles the message processing internally
    res.status(200).json({ status: "received" });
  });
}
