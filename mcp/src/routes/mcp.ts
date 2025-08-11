import { Request, Response, NextFunction, Router } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../config/server";
import { registerAllTools } from "../tools";

/**
 * Configure routes for the MCP server
 */
export function configureMcpRoutes(router: Router): void {
  // Stateless MCP endpoint (modern Streamable HTTP, stateless)
  router.post("/mcp", async (req: Request, res: Response) => {
    console.log(
      `[${new Date().toISOString()}] Incoming POST /mcp from ${req.socket?.remoteAddress || "unknown"}`,
    );
    console.log("Request body:", JSON.stringify(req.body));

    try {
      // Set MCP-Protocol-Version header for all responses
      res.setHeader("MCP-Protocol-Version", "2025-06-18");

      // Create a new server instance for this request
      const server = createMcpServer(req);

      // Register all tools with the server
      registerAllTools(server);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });

      res.on("close", () => {
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req as any, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  // Optionally, reject GET/DELETE on / for clarity
  // Health check endpoint
  router.get("/healthz", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });
  router.get("/mcp", (req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });
  router.delete("/mcp", (req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });
}
