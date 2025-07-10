import { NextRequest, NextResponse } from "next/server";
import { db, CRATES_COLLECTION } from "@/services/firebaseService";
import { Crate, CrateCategory } from "@/shared/types/crate";
import { auth } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const startAfter = searchParams.get("startAfter");
    const category = searchParams.get("category") as CrateCategory | null;

    // Build query for discoverable public crates
    let query = db
      .collection(CRATES_COLLECTION)
      .where("shared.public", "==", true)
      .where("shared.isDiscoverable", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit);

    // Add category filter if provided
    if (category && Object.values(CrateCategory).includes(category)) {
      query = query.where("category", "==", category);
    }

    // Add pagination if startAfter is provided
    if (startAfter) {
      const startAfterDoc = await db
        .collection(CRATES_COLLECTION)
        .doc(startAfter)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const crates: (Partial<Crate> & { ownerName?: string })[] = [];

    // Get unique owner IDs to batch fetch user info
    const ownerIds = [...new Set(snapshot.docs.map(doc => doc.data().ownerId))];
    const userInfoMap = new Map<string, string>();

    // Fetch user info for all owners
    for (const ownerId of ownerIds) {
      try {
        const userRecord = await auth.getUser(ownerId);
        // Use email or display name, fallback to first part of email
        const displayName = userRecord.displayName || 
          (userRecord.email ? userRecord.email.split('@')[0] : 'Unknown User');
        userInfoMap.set(ownerId, displayName);
      } catch (error) {
        console.warn(`Failed to fetch user info for ${ownerId}:`, error);
        userInfoMap.set(ownerId, 'Unknown User');
      }
    }

    for (const doc of snapshot.docs) {
      const crateData = doc.data() as Crate;

      // Return only essential fields for gallery display
      crates.push({
        id: crateData.id,
        title: crateData.title,
        description: crateData.description,
        category: crateData.category,
        tags: crateData.tags,
        createdAt: (crateData.createdAt as any)?.toDate ? (crateData.createdAt as any).toDate().toISOString() : crateData.createdAt,
        downloadCount: crateData.downloadCount,
        ownerId: crateData.ownerId,
        ownerName: userInfoMap.get(crateData.ownerId) || 'Unknown User',
        size: crateData.size,
        fileName: crateData.fileName,
        mimeType: crateData.mimeType,
      });
    }

    const hasMore = snapshot.docs.length === limit;
    const lastCrateId =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null;

    return NextResponse.json({
      crates,
      pagination: {
        hasMore,
        lastCrateId,
        total: crates.length,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery crates:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery crates" },
      { status: 500 },
    );
  }
}
