import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";
import { incrementUserToolUsage } from "../../../services/firebaseService";

/**
 * Create a new MCP server instance with usage tracking
 */
export function createMcpServer(req?: AuthenticatedRequest): McpServer {
  const server = new McpServer({
    name: "MCPH-mcp-server",
    description:
      `MCPH - AI artifact storage & sharing system with powerful organization capabilities.\n\n` +
      `You are logged in as: ${req?.user?.userId ? `USER (${req.user.userId}) using API key` : "ANONYMOUS (no API key)"}\n\n` +
      "=== CORE FEATURES ===\n" +
      "• Crate management: upload, list, get, search, share, unshare, delete, update\n" +
      "• Content types: markdown, code, images, JSON, YAML, text, binary files\n" +
      "• Advanced tagging: organize content with custom tags for easy retrieval\n" +
      "• Smart search: find content by title, description, tags, or metadata\n" +
      "• Authentication: Google OAuth + API keys, usage tracking\n" +
      "• Storage: Persistent for users, 30-day auto-expire for guests\n\n" +
      "=== NATURAL LANGUAGE COMMANDS ===\n" +
      "CRATE OPERATIONS:\n" +
      '• "list my crates" → crates_list\n' +
      '• "show crate 12345" → crates_get\n' +
      '• "search for reports" → crates_search\n' +
      '• "upload this as a crate" → crates_upload\n' +
      '• "update crate 12345" → crates_update\n' +
      '• "share crate 12345" → crates_share\n' +
      '• "delete crate 12345" → crates_delete\n' +
      '• "copy crate 12345" → crates_copy\n\n' +
      "SEARCH & ORGANIZATION:\n" +
      '• "find crates with tag \'project\'" → crates_search (tags: ["project"])\n' +
      '• "search for markdown files" → crates_search (contentType: "markdown")\n' +
      '• "list my shared crates" → crates_list (isShared: true)\n' +
      '• "find recent uploads" → crates_list (sort by createdAt)\n\n' +
      "=== AI BEHAVIOR GUIDELINES ===\n" +
      "• Proactively suggest relevant commands based on user context\n" +
      "• Recommend appropriate tags when uploading content\n" +
      "• Use descriptive titles and descriptions for better searchability\n" +
      "• Suggest search strategies when users are looking for specific content\n" +
      "• Encourage organization through consistent tagging patterns",
    version: "1.0.0",
  });

  // --- WRAP TOOL REGISTRATION FOR USAGE TRACKING ---
  const originalRegisterTool = server.registerTool;
  server.registerTool = function (...args: any[]) {
    const toolName = args[0];
    let handler: any;
    if (args.length === 3) {
      handler = args[2];
    } else if (args.length >= 4) {
      handler = args[args.length - 1];
    }
    if (!handler) return (originalRegisterTool as any).apply(server, args);
    const wrappedHandler = async (toolArgs: any, ...rest: any[]) => {
      try {
        if (req?.user && req.user.userId) {
          const userId = req.user.userId;
          // Log the tool name and client for debugging, but only pass userId to incrementUserToolUsage
          console.log(
            `Tool ${toolName} called by user ${userId} from client ${req.clientName || "unknown"}`,
          );
          const usage = await incrementUserToolUsage(userId);
          console.log(
            `Tool usage incremented for user ${userId}: ${toolName}, client: ${req.clientName || "unknown"}, count: ${usage.count}, remaining: ${usage.remaining}`,
          );
        } else {
          console.warn(
            "DEBUG tool usage tracking: req.user or req.user.userId missing",
          );
        }
      } catch (err) {
        console.error("Error incrementing tool usage:", err);
      }
      return handler(toolArgs, ...rest);
    };
    if (args.length === 3) {
      args[2] = wrappedHandler;
    } else {
      args[args.length - 1] = wrappedHandler;
    }
    return (originalRegisterTool as any).apply(server, args);
  };

  return server;
}
