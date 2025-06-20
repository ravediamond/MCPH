import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { createApiKey, listApiKeys } from "@/services/firebaseService";

/**
 * Helper function to verify Firebase ID token and return userId if authenticated
 */
async function requireUser(req: NextRequest): Promise<string | null> {
  // Check for authorization header (Bearer token)
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const decodedToken = await getAuth().verifyIdToken(token);
      return decodedToken.uid;
    } catch (error) {
      console.warn("[Claude Integration] Invalid auth token:", error);
      return null;
    }
  }

  // Check for session cookie if no Authorization header
  const cookies = req.cookies;
  const sessionCookie = cookies.get("session");
  if (sessionCookie && sessionCookie.value) {
    try {
      const decodedToken = await getAuth().verifyIdToken(sessionCookie.value);
      return decodedToken.uid;
    } catch (error) {
      console.warn("[Claude Integration] Invalid session cookie:", error);
      return null;
    }
  }

  return null;
}

/**
 * Fetches an existing API key with the "claude" scope for the user,
 * or creates a new one if none exists
 */
async function fetchOrCreateClaudeKey(userId: string): Promise<string> {
  // First, look for an existing key with the "claude" scope
  const existingKeys = await listApiKeys(userId);
  const claudeKey = existingKeys.find(key => key.name === "claude");
  
  if (claudeKey) {
    // If we found a matching key, we need to fetch the plain API key
    // Since we can't retrieve the original key, we need to create a new one
    // In a real implementation, we'd store the hashed key and return the original,
    // but for this example, we'll create a new one with the same name
    const { apiKey } = await createApiKey(userId, "claude");
    return apiKey;
  } else {
    // No existing key found, create a new one
    const { apiKey } = await createApiKey(userId, "claude");
    return apiKey;
  }
}

/**
 * GET handler for Claude Desktop integration
 * Returns a JSON configuration for Claude Desktop with the user's API key
 */
export async function GET(req: NextRequest) {
  // Authenticate the user
  const userId = await requireUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch or create an API key for the user with the "claude" scope
    const apiKey = await fetchOrCreateClaudeKey(userId);

    // Generate the JSON content Claude Desktop expects
    const claudeConfig = {
      mcpServers: {
        mcph: {
          command: "npx",
          args: [
            "-y",
            "mcp-remote@latest",
            "https://mcp.mcph.io/mcp",
            "--header",
            `Authorization: Bearer ${apiKey}`,
            "--transport",
            "http-only"
          ]
        }
      }
    };

    // Return the JSON content with appropriate Content-Type
    return NextResponse.json(claudeConfig);
  } catch (error) {
    console.error("[Claude Integration] Error generating API key:", error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}
