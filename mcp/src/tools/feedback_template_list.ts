import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListFeedbackTemplatesParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
} from "../../../services/firebaseService";
import { FeedbackTemplate } from "../../../shared/types/feedback";

/**
 * Register the feedback_template_list tool with the server
 */
export function registerFeedbackTemplateListTool(server: McpServer): void {
  server.registerTool(
    "feedback_template_list",
    {
      title: "List Feedback Templates",
      description:
        "Lists feedback templates owned by the user or public templates. Returns template metadata including field definitions.\n\n" +
        "USAGE:\n" +
        "• Without parameters: Lists all your templates + public templates\n" +
        "• With limit: Limits the number of results\n" +
        "• With startAfter: Paginates results after a specific template ID\n\n" +
        "EXAMPLE USAGE:\n" +
        "List all available templates:\n" +
        "{}\n\n" +
        "List with pagination:\n" +
        "{\n" +
        '  "limit": 10,\n' +
        '  "startAfter": "previous-template-id"\n' +
        "}",
      inputSchema: ListFeedbackTemplatesParams._def.schema._def.shape(),
    },
    async (args: any, extra?: any) => {
      const { limit = 20, startAfter } = args;

      // Get user ID from auth context
      let uid = "__nobody__";
      const authInfo = extra?.authInfo;
      const reqAuth = extra?.req?.auth;

      if (authInfo && authInfo.clientId && authInfo.clientId !== "") {
        uid = authInfo.clientId;
      } else if (reqAuth && reqAuth.clientId && reqAuth.clientId !== "") {
        uid = reqAuth.clientId;
      }

      console.log(
        `[feedback_template_list] Listing templates for user: ${uid}`,
      );

      try {
        // Build query for user's templates + public templates
        let query = db.collection(FEEDBACK_TEMPLATES_COLLECTION);

        // We need to get both user's templates and public templates
        // Since Firestore doesn't support OR queries easily, we'll make two queries
        const userTemplatesQuery = query
          .where("ownerId", "==", uid)
          .orderBy("createdAt", "desc");

        const publicTemplatesQuery = query
          .where("isPublic", "==", true)
          .orderBy("createdAt", "desc");

        // Apply pagination if startAfter is provided
        let userQuery = userTemplatesQuery;
        let publicQuery = publicTemplatesQuery;

        if (startAfter) {
          const startDoc = await db
            .collection(FEEDBACK_TEMPLATES_COLLECTION)
            .doc(startAfter)
            .get();
          if (startDoc.exists) {
            userQuery = userQuery.startAfter(startDoc);
            publicQuery = publicQuery.startAfter(startDoc);
          }
        }

        // Execute both queries
        const [userSnapshot, publicSnapshot] = await Promise.all([
          userQuery.limit(limit).get(),
          publicQuery.limit(limit).get(),
        ]);

        // Combine results and deduplicate
        const allTemplates = new Map<string, any>();

        // Add user templates first (they take precedence)
        userSnapshot.docs.forEach((doc) => {
          allTemplates.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          });
        });

        // Add public templates (skip if user already owns them)
        publicSnapshot.docs.forEach((doc) => {
          if (!allTemplates.has(doc.id)) {
            allTemplates.set(doc.id, {
              id: doc.id,
              ...doc.data(),
            });
          }
        });

        // Convert to array and sort by creation date
        const templates = Array.from(allTemplates.values())
          .sort(
            (a, b) =>
              new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() -
              new Date(a.createdAt?.toDate?.() || a.createdAt).getTime(),
          )
          .slice(0, limit);

        // Format templates for response
        const formattedTemplates = templates.map((template: any) => ({
          id: template.id,
          title: template.title,
          description: template.description || null,
          ownerId: template.ownerId,
          createdAt:
            template.createdAt?.toDate?.()?.toISOString() || template.createdAt,
          fields: template.fields || [],
          isPublic: template.isPublic || false,
          tags: template.tags || [],
          submissionCount: template.submissionCount || 0,
          isOwner: template.ownerId === uid,
        }));

        return {
          success: true,
          templates: formattedTemplates,
          pagination: {
            limit,
            startAfter,
            hasMore: templates.length === limit,
            nextStartAfter:
              templates.length > 0 ? templates[templates.length - 1].id : null,
          },
          content: [
            {
              type: "text",
              text:
                formattedTemplates.length > 0
                  ? `Found ${formattedTemplates.length} feedback templates:\n\n` +
                    formattedTemplates
                      .map(
                        (template, index) =>
                          `${index + 1}. **${template.title}** (${template.id})\n` +
                          `   Description: ${template.description || "No description"}\n` +
                          `   Owner: ${template.isOwner ? "You" : template.ownerId}\n` +
                          `   Fields: ${template.fields.length}\n` +
                          `   Public: ${template.isPublic ? "Yes" : "No"}\n` +
                          `   Submissions: ${template.submissionCount}\n` +
                          `   Tags: ${template.tags.length > 0 ? template.tags.join(", ") : "None"}\n` +
                          `   Created: ${new Date(template.createdAt).toLocaleDateString()}\n` +
                          `   \n   Field Details:\n` +
                          template.fields
                            .map(
                              (field: any) =>
                                `   • ${field.label} (${field.key}): ${field.type}${field.required ? " *required*" : ""}`,
                            )
                            .join("\n") +
                          "\n",
                      )
                      .join("\n---\n") +
                    `\n\nTo submit feedback to a template, use the feedback_submit tool with the template ID.\n` +
                    `To view responses for templates you own, use the feedback_responses_get tool.`
                  : "No feedback templates found. Create your first template with the feedback_template_create tool.",
            },
          ],
        };
      } catch (error: any) {
        console.error(
          `[feedback_template_list] Error listing templates:`,
          error,
        );
        throw new Error(`Failed to list feedback templates: ${error.message}`);
      }
    },
  );
}
