import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/vertexAiEmbedding';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const database = '(default)';

export async function POST(req: NextRequest) {
    try {
        let { query, topK = 5 } = await req.json();
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
        }
        // Ensure topK is a valid integer between 1 and 1000
        topK = Number.isFinite(topK) ? parseInt(topK, 10) : 5;
        if (isNaN(topK) || topK < 1) topK = 5;
        if (topK > 1000) topK = 1000;
        console.debug('[DEBUG] topK value for vector search:', topK);

        // Generate embedding for the query
        const embedding = await getEmbedding(query);

        // Initialize Firebase Admin SDK and Firestore
        initializeFirebaseAdmin();
        const db = getFirestore();

        // Perform vector search using Firestore Admin SDK
        // Requires Firestore Admin SDK v7.10.0+ and vector search enabled on your project
        const filesRef = db.collection('files');
        // findNearest is the new vector search API
        // See: https://cloud.google.com/nodejs/docs/reference/firestore/latest/CollectionReference#findNearest
        const vectorQuery = filesRef.findNearest('embedding', embedding, { limit: topK, distanceMeasure: 'DOT_PRODUCT' });
        const snapshot = await vectorQuery.get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ results, debug: { embeddingShape: Array.isArray(embedding) ? embedding.length : typeof embedding } });
    } catch (error: any) {
        console.error('[DEBUG] Search API error:', error);
        return NextResponse.json({ error: 'Vector search failed', message: error.message, stack: error.stack }, { status: 500 });
    }
}
