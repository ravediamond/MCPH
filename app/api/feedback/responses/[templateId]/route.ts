import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import {
  db,
  FEEDBACK_TEMPLATES_COLLECTION,
  FEEDBACK_RESPONSES_COLLECTION,
} from "@/services/firebaseService";
import { FeedbackTemplate, FeedbackResponse } from "@/shared/types/feedback";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

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

    // Get URL parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const startAfter = url.searchParams.get("startAfter");

    // First, verify the user owns the template
    const templateDoc = await db
      .collection(FEEDBACK_TEMPLATES_COLLECTION)
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    const template = templateDoc.data() as FeedbackTemplate;

    if (template.ownerId !== userId) {
      return NextResponse.json(
        { error: "You can only view responses for templates you own" },
        { status: 403 },
      );
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

    // Format responses and fetch user information
    const responses = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data() as FeedbackResponse;

        // Fetch user information if submitterId exists
        let userInfo = null;
        if (data.submitterId && data.submitterId !== "anonymous") {
          try {
            const userRecord = await auth.getUser(data.submitterId);
            userInfo = {
              email: userRecord.email,
              displayName: userRecord.displayName,
            };
          } catch (error) {
            console.warn(
              `Could not fetch user info for ${data.submitterId}:`,
              error,
            );
          }
        }

        return {
          id: doc.id,
          templateId: data.templateId,
          submitterId: data.submitterId || "anonymous",
          submitterEmail: userInfo?.email || null,
          submitterName: userInfo?.displayName || null,
          submittedAt:
            data.submittedAt &&
            typeof (data.submittedAt as any).toDate === "function"
              ? (data.submittedAt as any).toDate().toISOString()
              : data.submittedAt,
          responses: data.responses,
          metadata: data.metadata || {},
        };
      }),
    );

    // Calculate basic statistics
    const statistics = calculateResponseStats(responses, template.fields);

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        submissionCount: template.submissionCount || 0,
      },
      responses,
      statistics,
      pagination: {
        limit,
        startAfter,
        hasMore: responses.length === limit,
        nextStartAfter:
          responses.length > 0 ? responses[responses.length - 1].id : null,
      },
    });
  } catch (error: any) {
    console.error("[FeedbackResponsesAPI] Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback responses" },
      { status: 500 },
    );
  }
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

    const responseRate = Math.round(
      (fieldResponses.length / responses.length) * 100,
    );

    switch (field.type) {
      case "number":
      case "rating":
        const numbers = fieldResponses.filter((v) => typeof v === "number");
        if (numbers.length > 0) {
          const sum = numbers.reduce((a, b) => a + b, 0);
          stats[field.key] = {
            count: numbers.length,
            responseRate,
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
          responseRate,
          trueCount,
          falseCount: booleans.length - trueCount,
          truePercentage:
            booleans.length > 0
              ? Math.round((trueCount / booleans.length) * 100)
              : 0,
        };
        break;

      case "select":
        const selectCounts: Record<string, number> = {};
        fieldResponses.forEach((v) => {
          selectCounts[v] = (selectCounts[v] || 0) + 1;
        });
        stats[field.key] = {
          count: fieldResponses.length,
          responseRate,
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
          responseRate,
          distribution: multiselectCounts,
        };
        break;

      case "text":
        const textLengths = fieldResponses
          .filter((v) => typeof v === "string")
          .map((v) => v.length);
        stats[field.key] = {
          count: fieldResponses.length,
          responseRate,
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
          responseRate,
        };
    }
  });

  return stats;
}
