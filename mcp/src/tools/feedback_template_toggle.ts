import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToggleFeedbackTemplateStatusParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
} from "../../../services/firebaseService";

/**
 * Register the feedback_template_toggle tool with the server
 */
export function registerFeedbackTemplateToggleTool(server: McpServer): void {
  server.registerTool(
    "feedback_template_toggle",
    {
      title: "Toggle Feedback Template Status",
      description:
        "Opens or closes a feedback template to control whether it accepts new responses.\n\n" +
        "USAGE:\n" +
        "• Use isOpen: true to open a template and allow new responses\n" +
        "• Use isOpen: false to close a template and prevent new responses\n" +
        "• Only template owners can toggle the status\n\n" +
        "EXAMPLE:\n" +
        "Close a template:\n" +
        '{"templateId": "abc123", "isOpen": false}\n\n' +
        "Reopen a template:\n" +
        '{"templateId": "abc123", "isOpen": true}',
      inputSchema: ToggleFeedbackTemplateStatusParams._def.schema._def.shape(),
    },
    async (args: any, extra?: any) => {
      const { templateId, isOpen } = args;

      // Get user ID from auth context
      let uid = "__nobody__";
      const authInfo = extra?.authInfo;
      const reqAuth = extra?.req?.auth;

      if (authInfo && authInfo.clientId && authInfo.clientId !== "") {
        uid = authInfo.clientId;
      } else if (reqAuth && reqAuth.clientId && reqAuth.clientId !== "") {
        uid = reqAuth.clientId;
      }

      if (uid === "__nobody__") {
        throw new Error("Authentication required to toggle template status");
      }

      console.log(
        `[feedback_template_toggle] Toggling template ${templateId} to ${isOpen ? "open" : "closed"} for user: ${uid}`,
      );

      try {
        // First check if template exists and user owns it
        const templateDoc = await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .get();

        if (!templateDoc.exists) {
          throw new Error("Feedback template not found");
        }

        const templateData = templateDoc.data();
        if (templateData!.ownerId !== uid) {
          throw new Error("Only template owners can toggle status");
        }

        // Update the template status
        const updateData: any = {
          isOpen,
        };

        if (!isOpen) {
          updateData.closedAt = new Date();
        } else {
          updateData.closedAt = null;
        }

        await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .update(updateData);

        const statusText = isOpen ? "opened" : "closed";
        const actionText = isOpen ? "accepting" : "no longer accepting";

        return {
          success: true,
          content: [
            {
              type: "text",
              text:
                `Feedback template ${statusText} successfully!\n\n` +
                `Template ID: ${templateId}\n` +
                `Status: ${isOpen ? "Open" : "Closed"}\n` +
                `Title: ${templateData!.title}\n` +
                `Action: Template is now ${actionText} new responses\n\n` +
                `${isOpen ? "Users can now submit responses to this template." : "No new responses will be accepted until the template is reopened."}`,
            },
          ],
        };
      } catch (error: any) {
        console.error(
          `[feedback_template_toggle] Error toggling template status:`,
          error,
        );
        throw new Error(`Failed to toggle template status: ${error.message}`);
      }
    },
  );
}
