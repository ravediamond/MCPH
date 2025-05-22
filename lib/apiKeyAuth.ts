import { findUserByApiKey } from "@/services/firebaseService";
import { NextRequest } from "next/server";

/**
 * Checks for an API key in the Authorization header (Bearer <key>), validates it, and returns the user record if valid, otherwise throws.
 */
export async function requireApiKeyAuth(req: NextRequest) {
  const authHeader = req.headers.get("x-authorization");

  if (!authHeader || !authHeader.trim() || !authHeader.startsWith("Bearer ")) {
    console.log("[requireApiKeyAuth] Missing or invalid Authorization header");
    throw new Response(
      JSON.stringify({ error: "Missing or invalid API key" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const apiKey = authHeader.replace("Bearer ", "").trim();
  const apiKeyRecord = await findUserByApiKey(apiKey);
  if (!apiKeyRecord) {
    console.log("[requireApiKeyAuth] API key not found in database");
    throw new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return apiKeyRecord;
}
