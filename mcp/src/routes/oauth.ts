import { Request, Response, Router } from "express";
import {
  generateAuthorizationCode,
  generateState,
  storeOAuthSession,
  consumeOAuthSession,
  validateState,
  registerClient,
  getRegisteredClient,
  validateClient,
  validateRedirectUri,
} from "../services/oauthSessions";
import { auth } from "../../../lib/firebaseAdmin";

/**
 * Configure OAuth routes for the MCP server
 */
export function configureOAuthRoutes(router: Router): void {
  // Client Registration Endpoint (Dynamic Client Registration)
  router.post("/oauth/register", async (req: Request, res: Response) => {
    const {
      client_name,
      client_uri,
      redirect_uris,
      grant_types,
      response_types,
      scope,
    } = req.body;

    console.log("[OAuth] Client registration request:", {
      client_name,
      client_uri,
      redirect_uris,
      grant_types,
      response_types,
      scope,
    });

    // Validate required fields
    if (!client_name) {
      return res.status(400).json({
        error: "invalid_client_metadata",
        error_description: "client_name is required",
      });
    }

    try {
      // Register the client
      const client = await registerClient(
        client_name,
        client_uri,
        redirect_uris,
        grant_types,
        response_types,
        scope,
      );

      // Return registration response according to MCP spec
      const response = {
        client_id: client.clientId,
        client_secret: client.clientSecret,
        client_id_issued_at: client.clientIdIssuedAt,
        client_name: client.clientName,
        client_uri: client.clientUri,
        redirect_uris: client.redirectUris,
        grant_types: client.grantTypes,
        response_types: client.responseTypes,
        scope: client.scope,
      };

      console.log("[OAuth] Client registered successfully:", client.clientId);
      res.status(201).json(response);
    } catch (error) {
      console.error("[OAuth] Client registration error:", error);
      res.status(500).json({
        error: "server_error",
        error_description: "Failed to register client",
      });
    }
  });

  // OAuth Discovery Endpoint
  router.get(
    "/.well-known/oauth-authorization-server",
    (req: Request, res: Response) => {
      // Use HTTPS for production deployments, HTTP for localhost
      const protocol =
        req.get("x-forwarded-proto") ||
        (req.get("host")?.includes("localhost") ? req.protocol : "https");
      const baseUrl = `${protocol}://${req.get("host")}`;

      const metadata = {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/auth/authorize`,
        token_endpoint: `${baseUrl}/auth/token`,
        registration_endpoint: `${baseUrl}/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["plain", "S256"],
        scopes_supported: ["mcp"],
      };

      console.log("[OAuth] Serving discovery metadata for", baseUrl);
      res.json(metadata);
    },
  );

  // Authorization Endpoint
  router.get("/auth/authorize", async (req: Request, res: Response) => {
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

    // Validate client exists and redirect URI is authorized
    const client = await getRegisteredClient(client_id as string);
    if (!client) {
      return res.status(400).json({
        error: "invalid_client",
        error_description: "Client not found or not registered",
      });
    }

    if (
      !(await validateRedirectUri(client_id as string, redirect_uri as string))
    ) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid redirect URI",
      });
    }

    // Store the authorization request parameters in session
    const authState = generateState();

    // Use HTTPS for production deployments, HTTP for localhost
    const protocol =
      req.get("x-forwarded-proto") ||
      (req.get("host")?.includes("localhost") ? req.protocol : "https");
    const callbackUrl = `${protocol}://${req.get("host")}/auth/callback`;

    // Create Google OAuth URL that will be handled by Firebase Auth
    const googleOAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_OAUTH_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
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

    console.log(
      "[OAuth] Redirecting to Google OAuth with callback URL:",
      callbackUrl,
    );
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
      console.log("[OAuth] Exchanging Google OAuth code for access token");

      // Step 1: Exchange Google OAuth code for access token
      // Use same protocol detection as authorization endpoint
      const protocol =
        req.get("x-forwarded-proto") ||
        (req.get("host")?.includes("localhost") ? req.protocol : "https");
      const callbackUrl = `${protocol}://${req.get("host")}/auth/callback`;

      console.log(
        "[OAuth] Using redirect URI for token exchange:",
        callbackUrl,
      );

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("[OAuth] Token exchange failed:", error);
        throw new Error(`Token exchange failed: ${error}`);
      }

      const { access_token } = await tokenResponse.json();
      console.log("[OAuth] Successfully obtained Google access token");

      // Step 2: Get user info from Google
      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      if (!userResponse.ok) {
        const error = await userResponse.text();
        console.error("[OAuth] User info fetch failed:", error);
        throw new Error(`User info fetch failed: ${error}`);
      }

      const googleUser = await userResponse.json();
      console.log("[OAuth] Retrieved Google user info:", {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
      });

      // Step 3: Create or update Firebase user
      let firebaseUser;
      try {
        // Try to get existing user by email
        firebaseUser = await auth.getUserByEmail(googleUser.email);
        console.log("[OAuth] Found existing Firebase user:", firebaseUser.uid);
      } catch (error) {
        // User doesn't exist, create new one
        console.log(
          "[OAuth] Creating new Firebase user for:",
          googleUser.email,
        );
        firebaseUser = await auth.createUser({
          uid: googleUser.id, // Use Google ID as Firebase UID
          email: googleUser.email,
          displayName: googleUser.name,
          photoURL: googleUser.picture,
          emailVerified: googleUser.verified_email || false,
        });
        console.log("[OAuth] Created new Firebase user:", firebaseUser.uid);
      }

      // Step 4: Generate Firebase custom token
      const firebaseToken = await auth.createCustomToken(firebaseUser.uid);
      console.log(
        "[OAuth] Generated Firebase custom token for user:",
        firebaseUser.uid,
      );

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
    const { grant_type, code, redirect_uri, client_id, client_secret } =
      req.body;

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

    // Validate client credentials
    if (!(await validateClient(client_id, client_secret))) {
      console.log("[OAuth] Client validation failed for:", client_id);
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
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
