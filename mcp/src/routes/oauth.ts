import { Request, Response, Router } from "express";
import {
  generateAuthorizationCode,
  generateState,
  storeOAuthSession,
  consumeOAuthSession,
  validateState,
} from "../services/oauthSessions";

/**
 * Configure OAuth routes for the MCP server
 */
export function configureOAuthRoutes(router: Router): void {
  // OAuth Discovery Endpoint
  router.get(
    "/.well-known/oauth-authorization-server",
    (req: Request, res: Response) => {
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const metadata = {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/auth/authorize`,
        token_endpoint: `${baseUrl}/auth/token`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["plain", "S256"],
        scopes_supported: ["mcp"],
      };

      console.log("[OAuth] Serving discovery metadata");
      res.json(metadata);
    },
  );

  // Authorization Endpoint
  router.get("/auth/authorize", (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, state, scope } = req.query;

    console.log("[OAuth] Authorization request:", {
      client_id,
      redirect_uri,
      response_type,
      state,
      scope,
    });

    // Validate required parameters
    if (!client_id || !redirect_uri || response_type !== "code") {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing or invalid required parameters",
      });
    }

    // Store the authorization request parameters in session
    const authState = generateState();

    // Create Google OAuth URL that will be handled by Firebase Auth
    const googleOAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_OAUTH_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get("host")}/auth/callback`)}` +
      `&response_type=code` +
      `&scope=openid email profile` +
      `&state=${encodeURIComponent(
        JSON.stringify({
          original_state: state,
          client_id,
          redirect_uri,
          auth_state: authState,
        }),
      )}`;

    console.log("[OAuth] Redirecting to Google OAuth");
    res.redirect(googleOAuthUrl);
  });

  // Callback Handler (from Firebase Auth)
  router.get("/auth/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    console.log("[OAuth] Callback received:", { code: !!code, state, error });

    if (error) {
      return res.status(400).json({
        error: "access_denied",
        error_description: "User denied authorization",
      });
    }

    if (!code || !state) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing authorization code or state",
      });
    }

    try {
      // Parse state parameter
      const stateData = JSON.parse(decodeURIComponent(state as string));
      const { original_state, client_id, redirect_uri, auth_state } = stateData;

      // Exchange Google OAuth code for Firebase token
      // Note: This is a simplified implementation. In production, you would:
      // 1. Exchange the Google OAuth code for a Google access token
      // 2. Use that to get user info from Google
      // 3. Create or lookup the Firebase user
      // 4. Generate a Firebase custom token
      // For now, we'll create a mock Firebase token
      const firebaseToken = `firebase_custom_token_${code}_${Date.now()}`;

      // Generate authorization code for the client
      const authorizationCode = generateAuthorizationCode();

      // Store the session
      storeOAuthSession(
        authorizationCode,
        firebaseToken,
        auth_state,
        client_id,
        redirect_uri,
      );

      // Redirect back to client with authorization code
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set("code", authorizationCode);
      if (original_state) {
        redirectUrl.searchParams.set("state", original_state);
      }

      console.log("[OAuth] Redirecting back to client");
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("[OAuth] Callback error:", error);
      res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid state parameter",
      });
    }
  });

  // Token Exchange Endpoint
  router.post("/auth/token", async (req: Request, res: Response) => {
    const { grant_type, code, redirect_uri, client_id } = req.body;

    console.log("[OAuth] Token exchange request:", {
      grant_type,
      code: code ? `${code.substring(0, 8)}...` : undefined,
      redirect_uri,
      client_id,
    });

    // Validate grant type
    if (grant_type !== "authorization_code") {
      return res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only authorization_code grant type is supported",
      });
    }

    // Validate required parameters
    if (!code || !redirect_uri || !client_id) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing required parameters",
      });
    }

    // Consume the authorization code
    const session = consumeOAuthSession(code);
    if (!session) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      });
    }

    // Validate client and redirect URI
    if (
      session.clientId !== client_id ||
      session.redirectUri !== redirect_uri
    ) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "Client ID or redirect URI mismatch",
      });
    }

    // Return the Firebase token as access token
    const tokenResponse = {
      access_token: session.firebaseToken,
      token_type: "Bearer",
      expires_in: 3600, // 1 hour
      scope: "mcp",
    };

    console.log("[OAuth] Token exchange successful");
    res.json(tokenResponse);
  });

  // Optional: OAuth info endpoint for debugging
  router.get("/auth/info", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    // In a real implementation, you would validate the Firebase token here
    res.json({
      active: true,
      token_type: "Bearer",
      scope: "mcp",
      client_id: "mcp_client",
    });
  });
}
