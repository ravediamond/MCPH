import { findUserByApiKey } from "@/services/firebaseService";
import { NextRequest } from "next/server";

/**
 * Checks for an API key in the Authorization header (Bearer <key>), validates it, and returns the user record if valid, otherwise throws.
 */
export async function requireApiKeyAuth(req: NextRequest) {
  // Print all headers for debugging
  console.log("[requireApiKeyAuth] All headers:");
  for (const [key, value] of req.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  const authHeader = req.headers.get("x-authorization");
  console.log(
    `[requireApiKeyAuth] Using header: x-authorization | Value:`,
    authHeader,
  );

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
