import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { db, FEEDBACK_TEMPLATES_COLLECTION } from "@/services/firebaseService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { templateId: string } },
) {
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
    const templateId = params.templateId;

    // Parse request body
    const { isOpen } = await request.json();

    if (typeof isOpen !== "boolean") {
      return NextResponse.json(
        { error: "isOpen must be a boolean value" },
        { status: 400 },
      );
    }

    // Check if template exists and user owns it
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

    const templateData = templateDoc.data();
    if (templateData!.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only template owners can change status" },
        { status: 403 },
      );
    }

    // Update template status
    const updateData: any = {
      isOpen,
    };

    if (!isOpen) {
      updateData.closedAt = new Date();
    } else {
      updateData.closedAt = null;
    }

    await db
      .collection(FEEDBACK_TEMPLATES_COLLECTION)
      .doc(templateId)
      .update(updateData);

    return NextResponse.json({
      success: true,
      templateId,
      isOpen,
      message: `Template ${isOpen ? "opened" : "closed"} successfully`,
    });
  } catch (error: any) {
    console.error("[FeedbackTemplateStatusAPI] Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update template status" },
      { status: 500 },
    );
  }
}
