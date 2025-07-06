import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  FEEDBACK_RESPONSES_COLLECTION,
} from "@/services/firebaseService";
import {
  FeedbackTemplate,
  FeedbackResponse,
  FeedbackFieldType,
} from "@/shared/types/feedback";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { templateId, responses, metadata = {} } = await request.json();

    if (!templateId || !responses) {
      return NextResponse.json(
        { error: "Template ID and responses are required" },
        { status: 400 },
      );
    }

    // Get user ID from auth (optional for feedback submission)
    let userId: string | undefined = undefined;
    const authHeader = request.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        // Continue without auth - allow anonymous submissions
        console.log(
          "Invalid token for feedback submission, continuing anonymously",
        );
      }
    }

    // Get the template to validate against
    const templateDoc = await db
      .collection(FEEDBACK_TEMPLATES_COLLECTION)
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: "Feedback template not found" },
        { status: 404 },
      );
    }

    const template = templateDoc.data() as FeedbackTemplate;

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
        case FeedbackFieldType.NUMBER:
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

        case FeedbackFieldType.BOOLEAN:
          if (typeof response !== "boolean") {
            validationErrors.push(
              `Field '${field.label}' (${field.key}) must be true or false`,
            );
          }
          break;

        case FeedbackFieldType.SELECT:
          if (field.options && !field.options.includes(response)) {
            validationErrors.push(
              `Field '${field.label}' (${field.key}) must be one of: ${field.options.join(", ")}`,
            );
          }
          break;

        case FeedbackFieldType.MULTISELECT:
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

        case FeedbackFieldType.RATING:
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

        case FeedbackFieldType.TEXT:
          if (typeof response !== "string") {
            validationErrors.push(
              `Field '${field.label}' (${field.key}) must be a string`,
            );
          }
          break;
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: `Validation errors: ${validationErrors.join(", ")}` },
        { status: 400 },
      );
    }

    // Create feedback response
    const responseId = uuidv4();
    const now = new Date();

    const feedbackResponse: FeedbackResponse = {
      id: responseId,
      templateId,
      submitterId: userId,
      submittedAt: now,
      responses,
      metadata: {
        ...metadata,
        userAgent: request.headers.get("user-agent") || undefined,
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          undefined,
      },
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
        submissionCount: (template.submissionCount || 0) + 1,
      });

    return NextResponse.json({
      success: true,
      response: {
        id: responseId,
        templateId,
        submitterId: userId || "anonymous",
        submittedAt: now.toISOString(),
        responses,
        metadata: feedbackResponse.metadata,
      },
    });
  } catch (error: any) {
    console.error("[FeedbackSubmitAPI] Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
