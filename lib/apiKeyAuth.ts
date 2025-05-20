import { findUserByApiKey } from "@/services/firebaseService";
import { NextRequest } from "next/server";

/**
 * Checks for an API key in the X-API-Key header, validates it, and returns the user record if valid, otherwise throws.
 */
export async function requireApiKeyAuth(req: NextRequest) {
  const apiKeyHeader = req.headers.get("x-api-key");
  console.log(
    `[requireApiKeyAuth] Using header: x-api-key | Value:`,
    apiKeyHeader,
  );

  if (!apiKeyHeader || !apiKeyHeader.trim()) {
    console.log("[requireApiKeyAuth] Missing X-API-Key header");
    throw new Response(
      JSON.stringify({ error: "Missing or invalid API key" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const apiKey = apiKeyHeader.trim();
  console.log("[requireApiKeyAuth] Extracted API key:", apiKey);
  const apiKeyRecord = await findUserByApiKey(apiKey);
  if (!apiKeyRecord) {
    console.log("[requireApiKeyAuth] API key not found in database");
    throw new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.log(
    "[requireApiKeyAuth] API key valid for user:",
    apiKeyRecord.userId,
  );
  return apiKeyRecord;
}
