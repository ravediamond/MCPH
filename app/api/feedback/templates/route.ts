import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { db, FEEDBACK_TEMPLATES_COLLECTION } from "@/services/firebaseService";

export async function GET(request: NextRequest) {
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

    // Get URL parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const startAfter = url.searchParams.get("startAfter");

    // Build queries for user's templates and public templates
    let userTemplatesQuery = db
      .collection(FEEDBACK_TEMPLATES_COLLECTION)
      .where("ownerId", "==", userId)
      .orderBy("createdAt", "desc");

    let publicTemplatesQuery = db
      .collection(FEEDBACK_TEMPLATES_COLLECTION)
      .where("isPublic", "==", true)
      .orderBy("createdAt", "desc");

    // Apply pagination if startAfter is provided
    if (startAfter) {
      const startDoc = await db
        .collection(FEEDBACK_TEMPLATES_COLLECTION)
        .doc(startAfter)
        .get();
      if (startDoc.exists) {
        userTemplatesQuery = userTemplatesQuery.startAfter(startDoc);
        publicTemplatesQuery = publicTemplatesQuery.startAfter(startDoc);
      }
    }

    // Execute both queries
    const [userSnapshot, publicSnapshot] = await Promise.all([
      userTemplatesQuery.limit(limit).get(),
      publicTemplatesQuery.limit(limit).get(),
    ]);

    // Combine results and deduplicate
    const allTemplates = new Map<string, any>();

    // Add user templates first (they take precedence)
    userSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      allTemplates.set(doc.id, {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt && typeof (data.createdAt as any).toDate === "function"
            ? (data.createdAt as any).toDate().toISOString()
            : data.createdAt,
        isOwner: true,
      });
    });

    // Add public templates (skip if user already owns them)
    publicSnapshot.docs.forEach((doc) => {
      if (!allTemplates.has(doc.id)) {
        const data = doc.data();
        allTemplates.set(doc.id, {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt &&
            typeof (data.createdAt as any).toDate === "function"
              ? (data.createdAt as any).toDate().toISOString()
              : data.createdAt,
          isOwner: data.ownerId === userId,
        });
      }
    });

    // Convert to array and sort by creation date
    const templates = Array.from(allTemplates.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      templates,
      pagination: {
        limit,
        startAfter,
        hasMore: templates.length === limit,
        nextStartAfter:
          templates.length > 0 ? templates[templates.length - 1].id : null,
      },
    });
  } catch (error: any) {
    console.error("[FeedbackTemplatesAPI] Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback templates" },
      { status: 500 },
    );
  }
}
