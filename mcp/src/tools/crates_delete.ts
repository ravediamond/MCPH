import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCrateParams } from "../config/schemas";
import { getCrateMetadata } from "../../../services/firebaseService";
import { deleteCrate } from "../../../services/storageService";
import { AuthenticatedRequest } from "../../../lib/apiKeyAuth";
import { auditMcpEvent, auditCrateEvent } from "../../../services/auditService";
import { AuditEventType } from "../../../shared/types/crate";

/**
 * Register the crates_delete tool with the server
 */
export function registerCratesDeleteTool(server: McpServer): void {
  server.registerTool(
    "crates_delete",
    {
      title: "Delete Crate",
      description:
        "Permanently deletes a crate's data and metadata. Use with caution.\n\n" +
        "AI USAGE: Clean up outdated project files, but consider updating tags (e.g., 'status:archived') instead of deletion to preserve project history.\n\n" +
        "AI usage example:\n" +
        '• "delete crate 12345"',
      inputSchema: DeleteCrateParams.shape,
    },
    async (args: { id: string }, extra: any) => {
      const { id } = args;

      try {
        // Check if the crate exists first
        const crate = await getCrateMetadata(id);
        if (!crate) {
          throw new Error("Crate not found");
        }

        const req = extra?.req as AuthenticatedRequest | undefined;
        const authInfo = extra?.authInfo;

        // Prefer authInfo.clientId, fallback to req.user.userId for backward compatibility
        const userId = authInfo?.clientId ?? req?.user?.userId;

        // Check if the user has permission to delete this crate
        if (userId && crate.ownerId !== userId) {
          throw new Error("You don't have permission to delete this crate");
        }

        // Proceed with deletion without confirmation
        const result = await deleteCrate(id, userId);

        if (!result) {
          throw new Error("Failed to delete crate");
        }

        // Audit the MCP tool call and crate deletion
        const auditContext = {
          userId,
          mcpTool: "crates_delete",
          mcpClientId: req?.clientName || "unknown",
          apiKeyId: req?.user?.apiKeyId,
          ipAddress: req?.ip,
          userAgent: req?.get?.("User-Agent"),
          requestId: req?.requestId,
        };

        await auditMcpEvent(AuditEventType.MCP_TOOL_CALLED, auditContext, {
          toolName: "crates_delete",
          crateId: id,
          crateTitle: crate.title,
        });

        await auditCrateEvent(
          AuditEventType.CRATE_DELETED,
          crate.id,
          crate.title,
          auditContext,
          {
            size: crate.size,
            category: crate.category,
            wasPublic: crate.shared.public,
            hadPassword: !!crate.shared.passwordHash,
          },
        );

        return {
          content: [
            {
              type: "text",
              text: `Crate ${id} has been successfully deleted.`,
            },
          ],
          id,
        };
      } catch (error) {
        console.error("Error deleting crate:", error);
        // Type guard to handle 'unknown' error type
        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error("Failed to delete crate");
        }
      }
    },
  );
}
