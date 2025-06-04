import { GoogleAuth } from "google-auth-library";

const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const location = process.env.VERTEXAI_LOCATION || "us-central1";
const embedding_model =
  process.env.VERTEXAI_EMBEDDING_MODEL || "textembedding-gecko@001";

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    // Authentication configuration
    const authOptions: any = {
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    };

    // Handle the credentials in Vercel vs local environments
    if (process.env.VERCEL_ENV && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // In Vercel, if credential is a JSON string, parse it
      const credStr = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credStr.trim().startsWith("{")) {
        try {
          console.log("[VertexAI] Using parsed JSON credentials from env var");
          const credentials = JSON.parse(credStr);
          authOptions.credentials = credentials;
        } catch (error) {
          console.error("[VertexAI] Error parsing credentials JSON:", error);
          throw new Error("Failed to parse service account credentials JSON");
        }
      }
    }

    // Create authenticated client
    const auth = new GoogleAuth(authOptions);
    const client = await auth.getClient();

    // Call Vertex AI API
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${embedding_model}:predict`;

    const res = await client.request({
      url: endpoint,
      method: "POST",
      data: { instances: [{ content: text }] },
    });

    // Type assertion to satisfy TypeScript
    const data = res.data as {
      predictions: { embeddings: { values: number[] } }[];
    };
    return data.predictions[0].embeddings.values;
  } catch (error) {
    console.error("[VertexAI] Error generating embedding:", error);
    throw error;
  }
}
