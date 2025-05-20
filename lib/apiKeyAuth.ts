import { findUserByApiKey } from "@/services/firebaseService";
import { NextRequest } from "next/server";

/**
 * Checks for an API key in the Authorization header (Bearer <key>),
 * or Vercel's x-vercel-sc-authorization/x-vercel-sc-headers, validates it, and returns the user record if valid, otherwise throws.
 */
export async function requireApiKeyAuth(req: NextRequest) {
  let authHeader =
    req.headers.get("authorization") ||
    req.headers.get("Authorization") ||
    req.headers.get("x-vercel-sc-authorization") ||
    req.headers.get("x-vercel-sc-headers");

  let usedHeader = "";
  if (req.headers.get("authorization")) usedHeader = "authorization";
  else if (req.headers.get("Authorization")) usedHeader = "Authorization";
  else if (req.headers.get("x-vercel-sc-authorization"))
    usedHeader = "x-vercel-sc-authorization";
  else if (req.headers.get("x-vercel-sc-headers"))
    usedHeader = "x-vercel-sc-headers";

  console.log(
    `[requireApiKeyAuth] Using header: ${usedHeader} | Value:`,
    authHeader,
  );

  if (!authHeader) {
    console.log("[requireApiKeyAuth] Missing Authorization header");
    throw new Response(
      JSON.stringify({ error: "Missing or invalid API key" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  // If x-vercel-sc-headers, try to extract Authorization from JSON
  if (usedHeader === "x-vercel-sc-headers" && authHeader.startsWith("{")) {
    try {
      const parsed = JSON.parse(authHeader);
      authHeader =
        parsed["authorization"] || parsed["Authorization"] || authHeader;
      console.log(
        "[requireApiKeyAuth] Extracted Authorization from x-vercel-sc-headers:",
        authHeader,
      );
    } catch (e) {
      // Not JSON, ignore
    }
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log(
      "[requireApiKeyAuth] Invalid or missing Authorization header format",
    );
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
