import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateFeedbackTemplateParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  hasReachedFeedbackTemplatesLimit,
} from "../../../services/firebaseService";
import { FeedbackTemplate } from "../../../shared/types/feedback";
import { v4 as uuidv4 } from "uuid";

/**
 * Register the feedback_template_create tool with the server
 */
export function registerFeedbackTemplateCreateTool(server: McpServer): void {
  server.registerTool(
    "feedback_template_create",
    {
      title: "Create Feedback Template",
      description:
        "Creates a new feedback template with custom fields for collecting user feedback. Templates can be shared publicly or kept private.\n\n" +
        "FIELD TYPES:\n" +
        "• text - Free text input\n" +
        "• number - Numeric input (with optional min/max)\n" +
        "• boolean - True/false checkbox\n" +
        "• select - Single choice dropdown (requires options)\n" +
        "• multiselect - Multiple choice (requires options)\n" +
        "• rating - Star rating (requires minValue/maxValue)\n\n" +
        "EXAMPLE USAGE:\n" +
        "Create a simple product feedback template:\n" +
        "{\n" +
        '  "title": "Product Feedback v1",\n' +
        '  "description": "Help us improve our product",\n' +
        '  "fields": [\n' +
        "    {\n" +
        '      "key": "overall_rating",\n' +
        '      "type": "rating",\n' +
        '      "label": "Overall Rating",\n' +
        '      "required": true,\n' +
        '      "minValue": 1,\n' +
        '      "maxValue": 5\n' +
        "    },\n" +
        "    {\n" +
        '      "key": "comments",\n' +
        '      "type": "text",\n' +
        '      "label": "Additional Comments",\n' +
        '      "required": false,\n' +
        '      "placeholder": "Tell us what you think..."\n' +
        "    }\n" +
        "  ],\n" +
        '  "isPublic": true\n' +
        "}",
      inputSchema: CreateFeedbackTemplateParams._def.schema._def.shape(),
    },
    async (args: any, extra?: any) => {
      const {
        title,
        description,
        fields,
        isPublic = false,
        tags = [],
        linkedCrates = [],
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
        throw new Error("Authentication required to create feedback templates");
      }

      // Check if user has reached feedback templates limit
      const reachedLimit = await hasReachedFeedbackTemplatesLimit(uid);
      if (reachedLimit) {
        throw new Error(
          "Feedback templates limit reached. You can create a maximum of 5 feedback templates. Please delete some templates before creating new ones.",
        );
      }

      // Validate field keys are unique
      const fieldKeys = fields.map((field: any) => field.key);
      const uniqueKeys = new Set(fieldKeys);
      if (fieldKeys.length !== uniqueKeys.size) {
        throw new Error("Field keys must be unique within a template");
      }

      // Validate field types have required options
      for (const field of fields) {
        if (
          (field.type === "select" || field.type === "multiselect") &&
          !field.options
        ) {
          throw new Error(
            `Field '${field.key}' of type '${field.type}' requires options array`,
          );
        }
        if (field.type === "rating" && (!field.minValue || !field.maxValue)) {
          throw new Error(
            `Field '${field.key}' of type 'rating' requires minValue and maxValue`,
          );
        }
      }

      const templateId = uuidv4();
      const now = new Date();

      const template: FeedbackTemplate = {
        id: templateId,
        title,
        description,
        ownerId: uid,
        createdAt: now,
        fields,
        isPublic,
        tags,
        submissionCount: 0,
        linkedCrates: linkedCrates.length > 0 ? linkedCrates : undefined,
        isOpen: true, // New templates are open by default
      };

      console.log(
        `[feedback_template_create] Creating template: ${templateId} for user: ${uid}`,
      );

      try {
        await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .set(template);

        return {
          success: true,
          template: {
            id: templateId,
            title,
            description,
            ownerId: uid,
            createdAt: now.toISOString(),
            fields,
            isPublic,
            tags,
            submissionCount: 0,
            linkedCrates: linkedCrates.length > 0 ? linkedCrates : undefined,
          },
          content: [
            {
              type: "text",
              text:
                `Feedback template created successfully!\n\n` +
                `Template ID: ${templateId}\n` +
                `Title: ${title}\n` +
                `Description: ${description || "No description"}\n` +
                `Fields: ${fields.length}\n` +
                `Public: ${isPublic ? "Yes" : "No"}\n` +
                `Tags: ${tags.length > 0 ? tags.join(", ") : "None"}\n` +
                `Linked Crates: ${linkedCrates.length > 0 ? linkedCrates.join(", ") : "None"}\n\n` +
                `Field Details:\n` +
                fields
                  .map(
                    (field: any) =>
                      `• ${field.label} (${field.key}): ${field.type}${field.required ? " *required*" : ""}`,
                  )
                  .join("\n") +
                `\n\nYou can now share this template ID with users to collect feedback, or use the feedback_submit tool to submit responses.`,
            },
          ],
        };
      } catch (error: any) {
        console.error(
          `[feedback_template_create] Error creating template:`,
          error,
        );
        throw new Error(`Failed to create feedback template: ${error.message}`);
      }
    },
  );
}
