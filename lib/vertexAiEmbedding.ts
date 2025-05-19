import { GoogleAuth } from "google-auth-library";

const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const location = process.env.VERTEXAI_LOCATION || "us-central1";
const embedding_model =
  process.env.VERTEXAI_EMBEDDING_MODEL || "textembedding-gecko@001";

export async function getEmbedding(text: string): Promise<number[]> {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const client = await auth.getClient();
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
}
