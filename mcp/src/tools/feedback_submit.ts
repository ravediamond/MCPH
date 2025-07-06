import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SubmitFeedbackParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  FEEDBACK_RESPONSES_COLLECTION,
} from "../../../services/firebaseService";
import {
  FeedbackTemplate,
  FeedbackResponse,
} from "../../../shared/types/feedback";
import { v4 as uuidv4 } from "uuid";

/**
 * Register the feedback_submit tool with the server
 */
export function registerFeedbackSubmitTool(server: McpServer): void {
  server.registerTool(
    "feedback_submit",
    {
      title: "Submit Feedback",
      description:
        "Submits feedback responses to a specific template. Validates responses against template field requirements.\n\n" +
        "RESPONSE FORMAT:\n" +
        "The responses object should have keys matching the template field keys, with values appropriate for each field type:\n" +
        "• text: string value\n" +
        "• number: numeric value\n" +
        "• boolean: true/false\n" +
        "• select: single string value from options\n" +
        "• multiselect: array of strings from options\n" +
        "• rating: numeric value between min/max\n\n" +
        "EXAMPLE USAGE:\n" +
        "Submit feedback to a product feedback template:\n" +
        "{\n" +
        '  "templateId": "abc123",\n' +
        '  "responses": {\n' +
        '    "overall_rating": 4,\n' +
        '    "comments": "Great product, but could use better documentation",\n' +
        '    "recommend": true\n' +
        "  },\n" +
        '  "metadata": {\n' +
        '    "source": "web",\n' +
        '    "version": "1.0"\n' +
        "  }\n" +
        "}",
      inputSchema: SubmitFeedbackParams._def.schema._def.shape(),
    },
    async (args: any, extra?: any) => {
      const { templateId, responses, metadata = {} } = args;

      // Get user ID from auth context (optional for feedback submission)
      let uid = undefined;
      const authInfo = extra?.authInfo;
      const reqAuth = extra?.req?.auth;

      if (authInfo && authInfo.clientId && authInfo.clientId !== "") {
        uid = authInfo.clientId;
      } else if (reqAuth && reqAuth.clientId && reqAuth.clientId !== "") {
        uid = reqAuth.clientId;
      }

      console.log(
        `[feedback_submit] Submitting feedback to template: ${templateId} from user: ${uid || "anonymous"}`,
      );

      try {
        // Get the template to validate against
        const templateDoc = await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .get();

        if (!templateDoc.exists) {
          throw new Error(`Feedback template '${templateId}' not found`);
        }

        const template = templateDoc.data() as FeedbackTemplate;

        // Check if template is open for responses
        if (!template.isOpen) {
          throw new Error(
            `Feedback template '${template.title}' is currently closed and not accepting responses`,
          );
        }

        // Validate responses against template fields
        const validationErrors: string[] = [];

        for (const field of template.fields) {
          const response = responses[field.key];

          // Check required fields
          if (
            field.required &&
            (response === undefined || response === null || response === "")
          ) {
            validationErrors.push(
              `Field '${field.label}' (${field.key}) is required`,
            );
            continue;
          }

          // Skip validation if field is not required and empty
          if (
            !field.required &&
            (response === undefined || response === null || response === "")
          ) {
            continue;
          }

          // Type-specific validation
          switch (field.type) {
            case "number":
              if (typeof response !== "number") {
                validationErrors.push(
                  `Field '${field.label}' (${field.key}) must be a number`,
                );
              } else {
                if (field.minValue !== undefined && response < field.minValue) {
                  validationErrors.push(
                    `Field '${field.label}' (${field.key}) must be at least ${field.minValue}`,
                  );
                }
                if (field.maxValue !== undefined && response > field.maxValue) {
                  validationErrors.push(
                    `Field '${field.label}' (${field.key}) must be at most ${field.maxValue}`,
                  );
                }
              }
              break;

            case "boolean":
              if (typeof response !== "boolean") {
                validationErrors.push(
                  `Field '${field.label}' (${field.key}) must be true or false`,
                );
              }
              break;

            case "select":
              if (field.options && !field.options.includes(response)) {
                validationErrors.push(
                  `Field '${field.label}' (${field.key}) must be one of: ${field.options.join(", ")}`,
                );
              }
              break;

            case "multiselect":
              if (!Array.isArray(response)) {
                validationErrors.push(
                  `Field '${field.label}' (${field.key}) must be an array`,
                );
              } else if (field.options) {
                const invalidOptions = response.filter(
                  (r) => !field.options!.includes(r),
                );
                if (invalidOptions.length > 0) {
                  validationErrors.push(
                    `Field '${field.label}' (${field.key}) contains invalid options: ${invalidOptions.join(", ")}`,
                  );
                }
              }
              break;

            case "rating":
              if (typeof response !== "number") {
                validationErrors.push(
                  `Field '${field.label}' (${field.key}) must be a number`,
                );
              } else {
                if (field.minValue !== undefined && response < field.minValue) {
                  validationErrors.push(
                    `Field '${field.label}' (${field.key}) rating must be at least ${field.minValue}`,
                  );
                }
                if (field.maxValue !== undefined && response > field.maxValue) {
                  validationErrors.push(
                    `Field '${field.label}' (${field.key}) rating must be at most ${field.maxValue}`,
                  );
                }
              }
              break;

            case "text":
              if (typeof response !== "string") {
                validationErrors.push(
                  `Field '${field.label}' (${field.key}) must be a string`,
                );
              }
              break;
          }
        }

        if (validationErrors.length > 0) {
          throw new Error(`Validation errors:\n${validationErrors.join("\n")}`);
        }

        // Create feedback response
        const responseId = uuidv4();
        const now = new Date();

        const feedbackResponse: FeedbackResponse = {
          id: responseId,
          templateId,
          submitterId: uid,
          submittedAt: now,
          responses,
          metadata,
        };

        // Save the response
        await db
          .collection(FEEDBACK_RESPONSES_COLLECTION)
          .doc(responseId)
          .set(feedbackResponse);

        // Update template submission count
        await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .update({
            submissionCount: template.submissionCount + 1,
          });

        return {
          success: true,
          response: {
            id: responseId,
            templateId,
            submitterId: uid || "anonymous",
            submittedAt: now.toISOString(),
            responses,
            metadata,
          },
          content: [
            {
              type: "text",
              text:
                `Feedback submitted successfully!\n\n` +
                `Response ID: ${responseId}\n` +
                `Template: ${template.title}\n` +
                `Submitted by: ${uid || "anonymous"}\n` +
                `Submitted at: ${now.toISOString()}\n\n` +
                `Responses:\n` +
                Object.entries(responses)
                  .map(([key, value]) => {
                    const field = template.fields.find((f) => f.key === key);
                    const label = field ? field.label : key;
                    return `• ${label}: ${Array.isArray(value) ? value.join(", ") : value}`;
                  })
                  .join("\n") +
                `\n\nThank you for your feedback!`,
            },
          ],
        };
      } catch (error: any) {
        console.error(`[feedback_submit] Error submitting feedback:`, error);
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }
    },
  );
}
