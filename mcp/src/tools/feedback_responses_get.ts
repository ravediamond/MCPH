import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetFeedbackResponsesParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  FEEDBACK_RESPONSES_COLLECTION,
} from "../../../services/firebaseService";
import {
  FeedbackTemplate,
  FeedbackResponse,
} from "../../../shared/types/feedback";

/**
 * Register the feedback_responses_get tool with the server
 */
export function registerFeedbackResponsesGetTool(server: McpServer): void {
  server.registerTool(
    "feedback_responses_get",
    {
      title: "Get Feedback Responses",
      description:
        "Retrieves feedback responses for a specific template. Only template owners can view responses.\n\n" +
        "USAGE:\n" +
        "• Requires templateId of a template you own\n" +
        "• Returns all responses with submitter info and response data\n" +
        "• Supports pagination with limit and startAfter\n\n" +
        "EXAMPLE USAGE:\n" +
        "Get all responses for a template:\n" +
        "{\n" +
        '  "templateId": "abc123"\n' +
        "}\n\n" +
        "Get responses with pagination:\n" +
        "{\n" +
        '  "templateId": "abc123",\n' +
        '  "limit": 10,\n' +
        '  "startAfter": "previous-response-id"\n' +
        "}",
      inputSchema: GetFeedbackResponsesParams._def.schema._def.shape(),
    },
    async (args: any, extra?: any) => {
      const { templateId, limit = 50, startAfter } = args;

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
        throw new Error("Authentication required to view feedback responses");
      }

      console.log(
        `[feedback_responses_get] Getting responses for template: ${templateId} for user: ${uid}`,
      );

      try {
        // First, verify the user owns the template
        const templateDoc = await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .get();

        if (!templateDoc.exists) {
          throw new Error(`Feedback template '${templateId}' not found`);
        }

        const template = templateDoc.data() as FeedbackTemplate;

        if (template.ownerId !== uid) {
          throw new Error("You can only view responses for templates you own");
        }

        // Build query for responses
        let query = db
          .collection(FEEDBACK_RESPONSES_COLLECTION)
          .where("templateId", "==", templateId)
          .orderBy("submittedAt", "desc");

        // Apply pagination if startAfter is provided
        if (startAfter) {
          const startDoc = await db
            .collection(FEEDBACK_RESPONSES_COLLECTION)
            .doc(startAfter)
            .get();
          if (startDoc.exists) {
            query = query.startAfter(startDoc);
          }
        }

        // Execute query
        const snapshot = await query.limit(limit).get();

        // Format responses
        const responses = snapshot.docs.map((doc) => {
          const data = doc.data() as FeedbackResponse;
          return {
            id: doc.id,
            templateId: data.templateId,
            submitterId: data.submitterId || "anonymous",
            submittedAt:
              data.submittedAt?.toDate?.()?.toISOString() || data.submittedAt,
            responses: data.responses,
            metadata: data.metadata || {},
          };
        });

        // Calculate response statistics
        const totalResponses = template.submissionCount || 0;
        const responseStats = calculateResponseStats(
          responses,
          template.fields,
        );

        return {
          success: true,
          template: {
            id: template.id,
            title: template.title,
            description: template.description,
            submissionCount: totalResponses,
          },
          responses,
          statistics: responseStats,
          pagination: {
            limit,
            startAfter,
            hasMore: responses.length === limit,
            nextStartAfter:
              responses.length > 0 ? responses[responses.length - 1].id : null,
          },
          content: [
            {
              type: "text",
              text:
                responses.length > 0
                  ? `Found ${responses.length} responses for template "${template.title}" (Total: ${totalResponses}):\n\n` +
                    `**Response Summary:**\n` +
                    Object.entries(responseStats)
                      .map(([fieldKey, stats]) => {
                        const field = template.fields.find(
                          (f) => f.key === fieldKey,
                        );
                        const fieldLabel = field ? field.label : fieldKey;
                        return `• ${fieldLabel}: ${formatFieldStats(stats, field?.type)}`;
                      })
                      .join("\n") +
                    `\n\n**Individual Responses:**\n` +
                    responses
                      .map(
                        (response, index) =>
                          `${index + 1}. **Response ${response.id}**\n` +
                          `   Submitted by: ${response.submitterId}\n` +
                          `   Submitted at: ${new Date(response.submittedAt).toLocaleString()}\n` +
                          `   Responses:\n` +
                          Object.entries(response.responses)
                            .map(([key, value]) => {
                              const field = template.fields.find(
                                (f) => f.key === key,
                              );
                              const label = field ? field.label : key;
                              return `   • ${label}: ${Array.isArray(value) ? value.join(", ") : value}`;
                            })
                            .join("\n") +
                          (Object.keys(response.metadata).length > 0
                            ? `\n   Metadata: ${Object.entries(
                                response.metadata,
                              )
                                .map(([k, v]) => `${k}=${v}`)
                                .join(", ")}`
                            : ""),
                      )
                      .join("\n\n") +
                    `\n\n**Export Options:**\n` +
                    `• Use this data to analyze feedback trends\n` +
                    `• Export to CSV/JSON for further analysis\n` +
                    `• Share insights with your team`
                  : `No responses found for template "${template.title}". Share the template ID ${templateId} to start collecting feedback.`,
            },
          ],
        };
      } catch (error: any) {
        console.error(
          `[feedback_responses_get] Error getting responses:`,
          error,
        );
        throw new Error(`Failed to get feedback responses: ${error.message}`);
      }
    },
  );
}

function calculateResponseStats(responses: any[], fields: any[]) {
  const stats: Record<string, any> = {};

  fields.forEach((field) => {
    const fieldResponses = responses
      .map((r) => r.responses[field.key])
      .filter((v) => v !== undefined && v !== null && v !== "");

    if (fieldResponses.length === 0) {
      stats[field.key] = { count: 0, responseRate: 0 };
      return;
    }

    const responseRate = (fieldResponses.length / responses.length) * 100;

    switch (field.type) {
      case "number":
      case "rating":
        const numbers = fieldResponses.filter((v) => typeof v === "number");
        if (numbers.length > 0) {
          const sum = numbers.reduce((a, b) => a + b, 0);
          stats[field.key] = {
            count: numbers.length,
            responseRate: Math.round(responseRate),
            average: Math.round((sum / numbers.length) * 100) / 100,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
          };
        }
        break;

      case "boolean":
        const booleans = fieldResponses.filter((v) => typeof v === "boolean");
        const trueCount = booleans.filter((v) => v === true).length;
        stats[field.key] = {
          count: booleans.length,
          responseRate: Math.round(responseRate),
          trueCount,
          falseCount: booleans.length - trueCount,
          truePercentage: Math.round((trueCount / booleans.length) * 100),
        };
        break;

      case "select":
        const selectCounts: Record<string, number> = {};
        fieldResponses.forEach((v) => {
          selectCounts[v] = (selectCounts[v] || 0) + 1;
        });
        stats[field.key] = {
          count: fieldResponses.length,
          responseRate: Math.round(responseRate),
          distribution: selectCounts,
        };
        break;

      case "multiselect":
        const multiselectCounts: Record<string, number> = {};
        fieldResponses.forEach((v) => {
          if (Array.isArray(v)) {
            v.forEach((option) => {
              multiselectCounts[option] = (multiselectCounts[option] || 0) + 1;
            });
          }
        });
        stats[field.key] = {
          count: fieldResponses.length,
          responseRate: Math.round(responseRate),
          distribution: multiselectCounts,
        };
        break;

      case "text":
        const textLengths = fieldResponses
          .filter((v) => typeof v === "string")
          .map((v) => v.length);
        stats[field.key] = {
          count: fieldResponses.length,
          responseRate: Math.round(responseRate),
          averageLength:
            textLengths.length > 0
              ? Math.round(
                  textLengths.reduce((a, b) => a + b, 0) / textLengths.length,
                )
              : 0,
        };
        break;

      default:
        stats[field.key] = {
          count: fieldResponses.length,
          responseRate: Math.round(responseRate),
        };
    }
  });

  return stats;
}

function formatFieldStats(stats: any, fieldType?: string): string {
  if (stats.count === 0) return "No responses";

  const baseInfo = `${stats.count} responses (${stats.responseRate}%)`;

  switch (fieldType) {
    case "number":
    case "rating":
      return `${baseInfo}, avg: ${stats.average}, range: ${stats.min}-${stats.max}`;
    case "boolean":
      return `${baseInfo}, ${stats.truePercentage}% true`;
    case "select":
    case "multiselect":
      const top = Object.entries(stats.distribution)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map(([option, count]) => `${option}(${count})`)
        .join(", ");
      return `${baseInfo}, top: ${top}`;
    case "text":
      return `${baseInfo}, avg length: ${stats.averageLength} chars`;
    default:
      return baseInfo;
  }
}
