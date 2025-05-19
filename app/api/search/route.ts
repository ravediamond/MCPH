import { NextRequest, NextResponse } from "next/server";
import { getEmbedding } from "@/lib/vertexAiEmbedding";
import { admin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const database = "(default)";

export async function POST(req: NextRequest) {
  try {
    let { query, topK = 5 } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid query" },
        { status: 400 },
      );
    }
    // Ensure topK is a valid integer between 1 and 1000
    topK = Number.isFinite(topK) ? parseInt(topK, 10) : 5;
    if (isNaN(topK) || topK < 1) topK = 5;
    if (topK > 1000) topK = 1000;
    console.debug("[DEBUG] topK value for vector search:", topK);

    // Generate embedding for the query
    const embedding = await getEmbedding(query);

    // Initialize Firebase Admin SDK and Firestore
    const db = getFirestore();

    // Perform vector search using Firestore Admin SDK
    const filesRef = db.collection("files");
    // 1. Vector search
    const vectorQuery = filesRef.findNearest("embedding", embedding, {
      limit: topK,
      distanceMeasure: "DOT_PRODUCT",
    });
    const vectorSnapshot = await vectorQuery.get();
    const vectorResults = vectorSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // 2. Classical search (searchText prefix, case-insensitive)
    const textQuery = query.toLowerCase();
    const classicalSnapshot = await filesRef
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
