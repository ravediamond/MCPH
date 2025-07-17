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
      `MCPH - AI artifact storage & sharing system with advanced feedback collection capabilities.\n\n` +
      `You are logged in as: ${req?.user?.userId ? `USER (${req.user.userId}) using API key` : "ANONYMOUS (no API key)"}\n\n` +
      "=== CORE FEATURES ===\n" +
      "• Crate management: upload, list, get, search, share, unshare, delete, update\n" +
      "• Content types: markdown, code, images, JSON, YAML, text, binary, feedback templates\n" +
      "• Feedback system: create templates, collect responses, analyze results\n" +
      "• Authentication: Google OAuth + API keys, usage tracking\n" +
      "• Storage: Persistent for users, 30-day auto-expire for guests\n\n" +
      "=== FEEDBACK SYSTEM ===\n" +
      "MCPH includes a powerful feedback collection system where feedback templates are stored as special crates:\n" +
      "• Feedback templates = crates with category 'feedback'\n" +
      "• Templates define custom form fields (text, number, rating, select, etc.)\n" +
      "• Users can submit responses to public templates\n" +
      "• Template owners get analytics and can export response data\n" +
      "• Templates can be opened/closed, made public/private\n\n" +
      "FEEDBACK WORKFLOW FOR AI:\n" +
      "1. CREATE: feedback_template_create → Creates template + stores as crate\n" +
      "2. LIST: crates_list with category:'feedback' → Find feedback templates\n" +
      "3. SUBMIT: feedback_submit → Submit response to template\n" +
      "4. ANALYZE: feedback_responses_get → Get responses + analytics (owner only)\n" +
      "5. MANAGE: crates_update → Open/close templates, update settings\n\n" +
      "=== NATURAL LANGUAGE COMMANDS ===\n" +
      "CRATE OPERATIONS:\n" +
      '• "list my crates" → crates_list\n' +
      '• "show my feedback templates" → crates_list (category: feedback)\n' +
      '• "show crate 12345" → crates_get\n' +
      '• "search for reports" → crates_search\n' +
      '• "upload this as a crate" → crates_upload\n' +
      '• "update crate 12345" → crates_update\n' +
      '• "share crate 12345" → crates_share\n' +
      '• "delete crate 12345" → crates_delete\n\n' +
      "FEEDBACK OPERATIONS:\n" +
      '• "create a feedback form for product reviews" → feedback_template_create\n' +
      '• "create survey with rating and text fields" → feedback_template_create\n' +
      '• "submit feedback to template abc123" → feedback_submit\n' +
      '• "get responses for my template abc123" → feedback_responses_get\n' +
      '• "close feedback template abc123" → crates_update (metadata.isOpen: false)\n' +
      '• "make template abc123 public" → crates_share\n\n' +
      "=== AI BEHAVIOR GUIDELINES ===\n" +
      "• Proactively suggest relevant commands based on user context\n" +
      "• When users mention surveys/feedback/forms, recommend feedback_template_create\n" +
      "• When users want to analyze data, suggest feedback_responses_get\n" +
      "• Remember: feedback templates are also crates, so crate operations work on them\n" +
      "• Use descriptive titles and tags when creating content\n" +
      "• Suggest appropriate field types for feedback forms based on use case",
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
