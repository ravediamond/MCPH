import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  hasReachedFeedbackTemplatesLimit,
} from "@/services/firebaseService";
import { FeedbackTemplate, FeedbackFieldType } from "@/shared/types/feedback";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 },
      );
    }

    const userId = decodedToken.uid;

    // Check if user has reached feedback templates limit
    const reachedLimit = await hasReachedFeedbackTemplatesLimit(userId);
    if (reachedLimit) {
      return NextResponse.json(
        {
          error:
            "Feedback templates limit reached. You can create a maximum of 5 feedback templates. Please delete some templates before creating new ones.",
        },
        { status: 400 },
      );
    }

    // Parse request body
    const {
      title,
      description,
      fields,
      isPublic = false,
      tags = [],
      linkedCrates = [],
    } = await request.json();

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Template title is required" },
        { status: 400 },
      );
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 },
      );
    }

    // Validate field structure
    for (const field of fields) {
      if (!field.key || !field.label || !field.type) {
        return NextResponse.json(
          { error: "All fields must have key, label, and type" },
          { status: 400 },
        );
      }

      if (!Object.values(FeedbackFieldType).includes(field.type)) {
        return NextResponse.json(
          { error: `Invalid field type: ${field.type}` },
          { status: 400 },
        );
      }

      // Validate type-specific requirements
      if (
        (field.type === FeedbackFieldType.SELECT ||
          field.type === FeedbackFieldType.MULTISELECT) &&
        !field.options
      ) {
        return NextResponse.json(
          {
            error: `Field '${field.key}' of type '${field.type}' requires options array`,
          },
          { status: 400 },
        );
      }

      if (
        field.type === FeedbackFieldType.RATING &&
        (!field.minValue || !field.maxValue)
      ) {
        return NextResponse.json(
          {
            error: `Field '${field.key}' of type 'rating' requires minValue and maxValue`,
          },
          { status: 400 },
        );
      }
    }

    // Check for unique field keys
    const fieldKeys = fields.map((f: any) => f.key);
    const uniqueKeys = new Set(fieldKeys);
    if (fieldKeys.length !== uniqueKeys.size) {
      return NextResponse.json(
        { error: "Field keys must be unique within a template" },
        { status: 400 },
      );
    }

    // Create template
    const templateId = uuidv4();
    const now = new Date();

    const template: FeedbackTemplate = {
      id: templateId,
      title: title.trim(),
      description: description?.trim() || undefined,
      ownerId: userId,
      createdAt: now,
      fields,
      isPublic: Boolean(isPublic),
      tags: Array.isArray(tags)
        ? tags.filter((t) => t && t.trim()).map((t) => t.trim())
        : [],
      submissionCount: 0,
      linkedCrates:
        Array.isArray(linkedCrates) && linkedCrates.length > 0
          ? linkedCrates.filter((id) => id && id.trim()).map((id) => id.trim())
          : undefined,
      isOpen: true, // New templates are open by default
    };

    // Save to Firestore
    await db
      .collection(FEEDBACK_TEMPLATES_COLLECTION)
      .doc(templateId)
      .set(template);

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        createdAt: template.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[FeedbackTemplateAPI] Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create feedback template" },
      { status: 500 },
    );
  }
}
