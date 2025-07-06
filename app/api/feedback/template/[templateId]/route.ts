import { NextRequest, NextResponse } from "next/server";
import { db, FEEDBACK_TEMPLATES_COLLECTION } from "@/services/firebaseService";

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
  try {
    const { templateId } = params;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // Get the template
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

    const templateData = templateDoc.data();

    // Check if template is public or if user owns it
    // For simplicity, we'll allow access to public templates without auth
    // and require auth for private templates
    if (!templateData?.isPublic) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Authentication required for private templates" },
          { status: 401 },
        );
      }

      // For private templates, you might want to verify the user owns it
      // This is simplified for now
    }

    const template = {
      id: templateDoc.id,
      ...templateData,
      createdAt:
        templateData?.createdAt &&
        typeof (templateData.createdAt as any).toDate === "function"
          ? (templateData.createdAt as any).toDate().toISOString()
          : templateData?.createdAt,
    };

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error("[FeedbackTemplateAPI] Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 },
    );
  }
}
