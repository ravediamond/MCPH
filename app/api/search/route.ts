import { NextRequest, NextResponse } from "next/server";
import { getEmbedding } from "@/lib/vertexAiEmbedding";
import { auth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // Require authentication for all search operations
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.warn(`Invalid authentication token:`, error);
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    let { query, topK = 5 } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid query" },
        { status: 400 },
      );
    }
    // Ensure topK is a valid integer between 1 and 20 (reduced limit for security)
    topK = Number.isFinite(topK) ? parseInt(topK, 10) : 5;
    if (isNaN(topK) || topK < 1) topK = 5;
    if (topK > 20) topK = 20;

    // Generate embedding for the query
    const embedding = await getEmbedding(query);

    // Initialize Firebase Admin SDK and Firestore
    const db = getFirestore();

    // Search only user's own files and files shared with them
    
    // Get user's crates first to determine accessible files
    const cratesRef = db.collection("crates");
    const userCratesQuery = cratesRef.where("ownerId", "==", userId);
    const userCratesSnapshot = await userCratesQuery.get();
    
    const accessibleCrateIds = new Set<string>();
    
    // Add user's own crates
    userCratesSnapshot.docs.forEach(doc => {
      accessibleCrateIds.add(doc.id);
    });
    
    // TODO: Add shared crates once team-based sharing is implemented
    // For now, only search within user's own files
    
    if (accessibleCrateIds.size === 0) {
      return NextResponse.json({
        results: [],
        message: "No accessible content to search"
      });
    }
    
    // Search within accessible crates only
    const filesRef = db.collection("files");
    const crateIdArray = Array.from(accessibleCrateIds);
    
    // 1. Vector search (restricted to user's crates)
    const vectorQuery = filesRef
      .where("crateId", "in", crateIdArray.slice(0, 10)) // Firestore limit
      .findNearest("embedding", embedding, {
        limit: topK,
        distanceMeasure: "DOT_PRODUCT",
      });
    
    let vectorResults: any[] = [];
    try {
      const vectorSnapshot = await vectorQuery.get();
      vectorResults = vectorSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.warn("Vector search failed, falling back to text search only:", error);
    }
    
    // 2. Classical search (restricted to user's crates)
    const textQuery = query.toLowerCase();
    const classicalSnapshot = await filesRef
      .where("crateId", "in", crateIdArray.slice(0, 10)) // Firestore limit
      .where("searchText", ">=", textQuery)
      .where("searchText", "<=", textQuery + "\uf8ff")
      .limit(topK)
      .get();
    
    const classicalResults = classicalSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Merge and deduplicate by id
    const allResultsMap = new Map();
    for (const a of vectorResults) allResultsMap.set(a.id, a);
    for (const a of classicalResults) allResultsMap.set(a.id, a);
    const results = Array.from(allResultsMap.values());
    return NextResponse.json({
      results,
      debug: {
        embeddingShape: Array.isArray(embedding)
          ? embedding.length
          : typeof embedding,
      },
    });
  } catch (error: any) {
    console.error("[DEBUG] Search API error:", error);
    return NextResponse.json(
      {
        error: "Vector search failed",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
