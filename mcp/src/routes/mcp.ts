import { Request, Response, NextFunction, Router } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../config/server";
import { registerAllTools } from "../tools";
import {
  apiKeyAuthMiddleware,
  AuthenticatedRequest,
} from "../../../lib/apiKeyAuth";

/**
 * Configure routes for the MCP server
 */
export function configureMcpRoutes(router: Router): void {
  // Stateless MCP endpoint (modern Streamable HTTP, stateless)
  router.post(
    "/mcp",
    (req: Request, res: Response, next: NextFunction): void => {
      // Allow unauthenticated access to crates_get only
      if (req.body?.method === "crates_get") {
        return next();
      }
      apiKeyAuthMiddleware(req, res, next);
    },
    async (req: Request, res: Response) => {
      // Safely use the request as AuthenticatedRequest after middleware has processed it
      const authReq = req as unknown as AuthenticatedRequest;

      console.log(
        `[${new Date().toISOString()}] Incoming POST /mcp from ${authReq.socket?.remoteAddress || "unknown"}`,
      );
      console.log("Request body:", JSON.stringify(authReq.body));
      try {
        // Extract client name from the initialize params if available
        let clientName: string | undefined = undefined;

        // Check if this is an initialize request with name parameter
        if (
          authReq.body &&
          authReq.body.method === "initialize" &&
          authReq.body.params?.name
        ) {
          clientName = authReq.body.params.name;
          // Store the client name on the request object for future reference
          authReq.clientName = clientName;
        }
        // For other jsonrpc methods, try to extract from params
        else if (authReq.body && authReq.body.params?.name) {
          clientName = authReq.body.params.name;
          authReq.clientName = clientName;
        }

        // Create a new server instance for this request
        const server = createMcpServer(authReq);

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
        // Cast authReq to any to avoid type checking issues
        await transport.handleRequest(authReq as any, res, authReq.body);
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
    },
  );

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
