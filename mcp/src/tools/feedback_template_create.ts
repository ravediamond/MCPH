import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateFeedbackTemplateParams } from "../config/schemas";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  hasReachedFeedbackTemplatesLimit,
  saveCrateMetadata,
} from "../../../services/firebaseService";
import { FeedbackTemplate } from "../../../shared/types/feedback";
import { CrateCategory } from "../../../shared/types/crate";
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
        "Creates a new feedback template with custom fields for collecting user feedback. Templates are automatically stored as crates with category 'feedback' and can be shared publicly or kept private.\n\n" +
        "=== WHEN TO USE ===\n" +
        "• User wants to create surveys, forms, questionnaires, or feedback collection\n" +
        "• Need to gather structured data from users\n" +
        "• Want to collect ratings, reviews, or opinions\n" +
        "• Building user research, customer feedback, or evaluation forms\n\n" +
        "=== FIELD TYPES & USE CASES ===\n" +
        "• text - Open-ended responses, comments, suggestions, descriptions\n" +
        "• number - Age, quantity, score, price, count (supports min/max validation)\n" +
        "• boolean - Yes/No questions, agreement, consent, feature preferences\n" +
        "• select - Single choice from predefined options (satisfaction levels, categories)\n" +
        "• multiselect - Multiple selections (features used, interests, problems faced)\n" +
        "• rating - Star ratings, satisfaction scores (requires minValue/maxValue)\n\n" +
        "=== SMART FIELD SUGGESTIONS FOR AI ===\n" +
        "Product feedback: rating (satisfaction), select (category), text (improvements)\n" +
        "Event feedback: rating (overall), boolean (recommend), text (highlights)\n" +
        "User research: multiselect (features), number (usage frequency), text (pain points)\n" +
        "Course evaluation: rating (content quality), select (difficulty), text (suggestions)\n" +
        "Service feedback: rating (service quality), boolean (return customer), text (experience)\n\n" +
        "=== TEMPLATE CREATION TIPS ===\n" +
        "• Use descriptive titles that indicate purpose (e.g., 'Q1 2024 Product Feedback')\n" +
        "• Add clear descriptions explaining the feedback purpose\n" +
        "• Keep field keys short and descriptive (e.g., 'overall_rating', 'improvement_suggestions')\n" +
        "• Use required=true for essential fields, false for optional ones\n" +
        "• Set isPublic=true for external feedback, false for internal use\n" +
        "• Add helpful placeholder text for text fields\n\n" +
        "=== EXAMPLE TEMPLATES ===\n" +
        "1. PRODUCT FEEDBACK:\n" +
        "{\n" +
        '  "title": "Product Feedback - Mobile App v2.1",\n' +
        '  "description": "Help us improve our mobile app experience",\n' +
        '  "fields": [\n' +
        '    {"key": "overall_rating", "type": "rating", "label": "Overall Satisfaction", "required": true, "minValue": 1, "maxValue": 5},\n' +
        '    {"key": "ease_of_use", "type": "select", "label": "How easy was the app to use?", "required": true, "options": ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"]},\n' +
        '    {"key": "features_used", "type": "multiselect", "label": "Which features did you use?", "required": false, "options": ["Search", "Favorites", "Sharing", "Notifications", "Settings"]},\n' +
        '    {"key": "would_recommend", "type": "boolean", "label": "Would you recommend this app?", "required": true},\n' +
        '    {"key": "improvements", "type": "text", "label": "What improvements would you suggest?", "required": false, "placeholder": "Tell us how we can make the app better..."}\n' +
        "  ],\n" +
        '  "isPublic": true\n' +
        "}\n\n" +
        "2. EVENT FEEDBACK:\n" +
        "{\n" +
        '  "title": "Workshop Feedback - AI in Business",\n' +
        '  "description": "Your feedback helps us improve future workshops",\n' +
        '  "fields": [\n' +
        '    {"key": "content_quality", "type": "rating", "label": "Content Quality", "required": true, "minValue": 1, "maxValue": 10},\n' +
        '    {"key": "session_length", "type": "select", "label": "Session length was:", "required": true, "options": ["Too Short", "Just Right", "Too Long"]},\n' +
        '    {"key": "most_valuable", "type": "text", "label": "Most valuable part of the workshop", "required": false},\n' +
        '    {"key": "attend_future", "type": "boolean", "label": "Would you attend future workshops?", "required": true}\n' +
        "  ],\n" +
        '  "isPublic": false\n' +
        "}",
      inputSchema: CreateFeedbackTemplateParams.shape,
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

      // Get user ID and email from auth context
      let uid = "__nobody__";
      let userEmail = "";
      const authInfo = extra?.authInfo;
      const reqAuth = extra?.req?.auth;

      if (authInfo && authInfo.clientId && authInfo.clientId !== "") {
        uid = authInfo.clientId;
        userEmail = authInfo.email || "";
      } else if (reqAuth && reqAuth.clientId && reqAuth.clientId !== "") {
        uid = reqAuth.clientId;
        userEmail = reqAuth.email || "";
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
        linkedCrates:
          Array.isArray(linkedCrates) && linkedCrates.length > 0
            ? linkedCrates
            : [],
        isOpen: true, // New templates are open by default
      };

      console.log(
        `[feedback_template_create] Creating template: ${templateId} for user: ${uid} (${userEmail})`,
      );

      try {
        // Save to Firestore as both a feedback template and a crate
        await db
          .collection(FEEDBACK_TEMPLATES_COLLECTION)
          .doc(templateId)
          .set(template);

        // Also store as a crate so it appears in the crates page
        const crateData = {
          id: templateId,
          title: title.trim(),
          description: description?.trim() || undefined,
          ownerId: uid,
          createdAt: now,
          mimeType: "application/json",
          category: CrateCategory.FEEDBACK,
          gcsPath: `feedback/${templateId}`, // Virtual path for feedback templates
          shared: {
            public: Boolean(isPublic),
          },
          tags: Array.isArray(tags)
            ? tags.filter((t) => t && t.trim()).map((t) => t.trim())
            : [],
          size: JSON.stringify(template).length, // Approximate size
          downloadCount: 0,
          fileName: `${title.trim().replace(/[^a-zA-Z0-9]/g, "_")}_feedback_template.json`,
          metadata: {
            type: "feedback_template",
            submissionCount: "0",
            isOpen: "true",
            linkedCrates:
              Array.isArray(linkedCrates) && linkedCrates.length > 0
                ? linkedCrates.join(",")
                : "",
          },
        };

        await saveCrateMetadata(crateData);

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
            linkedCrates:
              Array.isArray(linkedCrates) && linkedCrates.length > 0
                ? linkedCrates
                : [],
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
                `\n\nYou can now share this template ID with users to collect feedback, or use the feedback_submit tool to submit responses.\n\n` +
                `This template has been stored as both a feedback template AND a crate (category: 'feedback'), so it will appear in your crates list and can be managed alongside your other content.`,
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
