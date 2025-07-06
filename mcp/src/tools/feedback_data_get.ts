import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetFeedbackDataParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  FEEDBACK_RESPONSES_COLLECTION,
} from "../../../services/firebaseService";

/**
 * Register the feedback_data_get tool with the server
 */
export function registerFeedbackDataGetTool(server: McpServer): void {
  server.registerTool(
    "feedback_data_get",
    {
      title: "Get Feedback Data",
      description:
        "Retrieves comprehensive feedback data including templates, responses, and analytics.\n\n" +
        "USAGE:\n" +
        "• Without templateId: Returns all templates user has access to\n" +
        "• With templateId: Returns detailed data for specific template\n" +
        "• includeResponses: Include individual response data (default: true)\n" +
        "• includeAnalytics: Include computed analytics (default: true)\n\n" +
        "EXAMPLES:\n" +
        "Get all templates:\n" +
        "{}\n\n" +
        "Get specific template with full data:\n" +
        '{"templateId": "abc123"}\n\n' +
        "Get template without responses:\n" +
        '{"templateId": "abc123", "includeResponses": false}',
      inputSchema: GetFeedbackDataParams._def.schema._def.shape(),
    },
    async (args: any, extra?: any) => {
      const {
        templateId,
        includeResponses = true,
        includeAnalytics = true,
      } = args;

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
        throw new Error("Authentication required to access feedback data");
      }

      console.log(
        `[feedback_data_get] Getting feedback data for user: ${uid}, templateId: ${templateId}`,
      );

      try {
        if (templateId) {
          // Get specific template data
          const templateDoc = await db
            .collection(FEEDBACK_TEMPLATES_COLLECTION)
            .doc(templateId)
            .get();

          if (!templateDoc.exists) {
            throw new Error("Feedback template not found");
          }

          const templateData = templateDoc.data();

          // Check if user has access (owner or public template)
          if (templateData!.ownerId !== uid && !templateData!.isPublic) {
            throw new Error("Access denied to this template");
          }

          const result: any = {
            template: {
              ...templateData,
              id: templateId,
              createdAt: templateData!.createdAt.toISOString(),
              closedAt: templateData!.closedAt?.toISOString() || null,
              isOwner: templateData!.ownerId === uid,
            },
          };

          if (includeResponses) {
            // Get responses for this template
            const responsesQuery = db
              .collection(FEEDBACK_RESPONSES_COLLECTION)
              .where("templateId", "==", templateId)
              .orderBy("submittedAt", "desc");

            const responsesSnapshot = await responsesQuery.get();

            result.responses = responsesSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt.toISOString(),
              };
            });
          }

          if (includeAnalytics) {
            // Calculate analytics
            const analytics = {
              totalResponses: templateData!.submissionCount,
              isOpen: templateData!.isOpen,
              status: templateData!.isOpen ? "Open" : "Closed",
              closedAt: templateData!.closedAt?.toISOString() || null,
              fieldsCount: templateData!.fields.length,
              linkedCratesCount: templateData!.linkedCrates?.length || 0,
            };

            if (includeResponses && result.responses) {
              // Add response analytics
              const responses = result.responses;
              analytics.responsesByDay = calculateResponsesByDay(responses);
              analytics.fieldAnalytics = calculateFieldAnalytics(
                templateData!.fields,
                responses,
              );
            }

            result.analytics = analytics;
          }

          return {
            success: true,
            data: result,
            content: [
              {
                type: "text",
                text: formatTemplateData(result),
              },
            ],
          };
        } else {
          // Get all templates user has access to
          const templatesQuery = db
            .collection(FEEDBACK_TEMPLATES_COLLECTION)
            .where("ownerId", "==", uid)
            .orderBy("createdAt", "desc");

          const templatesSnapshot = await templatesQuery.get();

          const templates = templatesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toISOString(),
              closedAt: data.closedAt?.toISOString() || null,
              isOwner: true,
            };
          });

          const result = {
            templates,
            summary: {
              totalTemplates: templates.length,
              openTemplates: templates.filter((t) => t.isOpen).length,
              closedTemplates: templates.filter((t) => !t.isOpen).length,
              totalResponses: templates.reduce(
                (sum, t) => sum + t.submissionCount,
                0,
              ),
            },
          };

          return {
            success: true,
            data: result,
            content: [
              {
                type: "text",
                text: formatTemplatesSummary(result),
              },
            ],
          };
        }
      } catch (error: any) {
        console.error(
          `[feedback_data_get] Error getting feedback data:`,
          error,
        );
        throw new Error(`Failed to get feedback data: ${error.message}`);
      }
    },
  );
}

function calculateResponsesByDay(responses: any[]): Record<string, number> {
  const responsesByDay: Record<string, number> = {};

  responses.forEach((response) => {
    const date = new Date(response.submittedAt).toISOString().split("T")[0];
    responsesByDay[date] = (responsesByDay[date] || 0) + 1;
  });

  return responsesByDay;
}

function calculateFieldAnalytics(
  fields: any[],
  responses: any[],
): Record<string, any> {
  const fieldAnalytics: Record<string, any> = {};

  fields.forEach((field) => {
    const fieldKey = field.key;
    const fieldResponses = responses
      .map((r) => r.responses[fieldKey])
      .filter((value) => value !== undefined && value !== null && value !== "");

    const analytics: any = {
      totalResponses: fieldResponses.length,
      responseRate:
        responses.length > 0 ? fieldResponses.length / responses.length : 0,
    };

    if (field.type === "rating" || field.type === "number") {
      const numericValues = fieldResponses
        .map((v) => Number(v))
        .filter((v) => !isNaN(v));
      if (numericValues.length > 0) {
        analytics.average =
          numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        analytics.min = Math.min(...numericValues);
        analytics.max = Math.max(...numericValues);
      }
    }

    if (field.type === "select" || field.type === "boolean") {
      const valueCounts: Record<string, number> = {};
      fieldResponses.forEach((value) => {
        const key = String(value);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });
      analytics.valueCounts = valueCounts;
    }

    fieldAnalytics[fieldKey] = analytics;
  });

  return fieldAnalytics;
}

function formatTemplateData(data: any): string {
  const template = data.template;
  const responses = data.responses || [];
  const analytics = data.analytics || {};

  return (
    `Feedback Template Details:\n\n` +
    `Template ID: ${template.id}\n` +
    `Title: ${template.title}\n` +
    `Description: ${template.description || "No description"}\n` +
    `Status: ${template.isOpen ? "Open" : "Closed"}\n` +
    `Created: ${new Date(template.createdAt).toLocaleDateString()}\n` +
    `${template.closedAt ? `Closed: ${new Date(template.closedAt).toLocaleDateString()}\n` : ""}` +
    `Fields: ${template.fields.length}\n` +
    `Linked Crates: ${template.linkedCrates?.length || 0}\n` +
    `Total Responses: ${template.submissionCount}\n` +
    `Public: ${template.isPublic ? "Yes" : "No"}\n` +
    `Tags: ${template.tags?.join(", ") || "None"}\n\n` +
    `Field Details:\n` +
    template.fields
      .map(
        (field: any, index: number) =>
          `${index + 1}. ${field.label} (${field.key}): ${field.type}${field.required ? " *required*" : ""}`,
      )
      .join("\n") +
    `${template.linkedCrates?.length ? `\n\nLinked Crates:\n${template.linkedCrates.join(", ")}` : ""}` +
    `${responses.length ? `\n\nRecent Responses: ${responses.length}` : ""}`
  );
}

function formatTemplatesSummary(data: any): string {
  const { templates, summary } = data;

  return (
    `Feedback Templates Summary:\n\n` +
    `Total Templates: ${summary.totalTemplates}\n` +
    `Open Templates: ${summary.openTemplates}\n` +
    `Closed Templates: ${summary.closedTemplates}\n` +
    `Total Responses: ${summary.totalResponses}\n\n` +
    `Templates:\n` +
    templates
      .map(
        (template: any, index: number) =>
          `${index + 1}. ${template.title} (${template.id})\n` +
          `   Status: ${template.isOpen ? "Open" : "Closed"}\n` +
          `   Responses: ${template.submissionCount}\n` +
          `   Fields: ${template.fields.length}`,
      )
      .join("\n")
  );
}
