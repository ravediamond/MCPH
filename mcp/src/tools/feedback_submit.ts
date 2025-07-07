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
        "Submits responses to feedback templates for data collection. Templates can be public (anyone can submit) or private (access controlled). Validates responses against field requirements and types.\n\n" +
        "=== WHEN TO USE ===\n" +
        "• User wants to respond to surveys, feedback forms, or questionnaires\n" +
        "• AI needs to programmatically submit structured data to templates\n" +
        "• Collecting user input for templates you've discovered via crates_list\n" +
        "• Participating in public feedback collection campaigns\n\n" +
        "=== RESPONSE FIELD TYPES & FORMATS ===\n" +
        '• text - String values: "Great experience", "Needs improvement"\n' +
        "• number - Numeric values: 25, 100, 3.5 (respects min/max validation)\n" +
        "• boolean - True/false values: true, false\n" +
        '• select - Single choice: "Excellent", "Good", "Poor" (from predefined options)\n' +
        '• multiselect - Multiple choices: ["Feature A", "Feature B"] (array from options)\n' +
        "• rating - Numeric ratings: 4, 8.5 (between template's minValue/maxValue)\n\n" +
        "=== SMART SUBMISSION PATTERNS ===\n" +
        'Product feedback: {"overall_rating": 4, "ease_of_use": "Easy", "improvements": "Better docs"}\n' +
        'Event feedback: {"content_quality": 9, "recommend": true, "highlights": "Great speakers"}\n' +
        'Survey responses: {"age": 28, "interests": ["Tech", "Design"], "satisfaction": "Very Satisfied"}\n' +
        'Bug reports: {"severity": "High", "steps": "Click button, app crashes", "reproducible": true}\n\n' +
        "=== VALIDATION & ERROR HANDLING ===\n" +
        "• Required fields must have non-empty values\n" +
        "• Field types must match (numbers for ratings, arrays for multiselect)\n" +
        "• Select options must be from template's predefined choices\n" +
        "• Rating values must be within template's min/max range\n" +
        "• Templates can be closed (isOpen: false) and reject submissions\n\n" +
        "=== WORKFLOW FOR AI ===\n" +
        "1. Find templates: crates_list (category: 'feedback', shared.public: true)\n" +
        "2. Check template structure: crates_get (to see fields and requirements)\n" +
        "3. Submit response: feedback_submit (with properly formatted responses)\n" +
        "4. Handle errors: Review validation messages and retry with corrections\n\n" +
        "=== EXAMPLE SUBMISSIONS ===\n" +
        "1. PRODUCT FEEDBACK:\n" +
        "{\n" +
        '  \"templateId\": \"prod-feedback-2024\",\n' +
        '  \"responses\": {\n' +
        '    \"overall_rating\": 4,\n' +
        '    \"ease_of_use\": \"Very Easy\",\n' +
        '    \"features_used\": [\"Search\", \"Favorites\"],\n' +
        '    \"would_recommend\": true,\n' +
        '    \"improvements\": \"Add dark mode and better notifications\"\n' +
        "  },\n" +
        '  \"metadata\": {\"source\": \"mobile_app\", \"version\": \"2.1.0\"}\n' +
        "}\n\n" +
        "2. EVENT FEEDBACK:\n" +
        "{\n" +
        '  \"templateId\": \"workshop-ai-business\",\n' +
        '  \"responses\": {\n' +
        '    \"content_quality\": 9,\n' +
        '    \"session_length\": \"Just Right\",\n' +
        '    \"most_valuable\": \"Real-world case studies and hands-on exercises\",\n' +
        '    \"attend_future\": true\n' +
        "  }\n" +
        "}\n\n" +
        "3. USER RESEARCH:\n" +
        "{\n" +
        '  \"templateId\": \"user-research-q1\",\n' +
        '  \"responses\": {\n' +
        '    \"age_group\": \"25-34\",\n' +
        '    \"usage_frequency\": 15,\n' +
        '    \"pain_points\": [\"Slow loading\", \"Complex navigation\"],\n' +
        '    \"satisfaction_score\": 7,\n' +
        '    \"additional_comments\": \"Love the concept but needs performance improvements\"\n' +
        "  },\n" +
        '  \"metadata\": {\"campaign\": \"q1_research\", \"channel\": \"email\"}\n' +
        "}",
      inputSchema: SubmitFeedbackParams.shape,
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
