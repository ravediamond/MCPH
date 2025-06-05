import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

console.log("[FirebaseAdmin] Module loaded. Starting initialization check...");
console.log("[FirebaseAdmin] Current Firebase apps count:", admin.apps.length);
console.log(
  "[FirebaseAdmin] Running on Vercel:",
  Boolean(process.env.VERCEL_ENV),
);

// Use admin.apps.length to check initialization
if (!admin.apps.length) {
  try {
    console.log(
      "[FirebaseAdmin] No existing Firebase apps found, initializing...",
    );

    if (process.env.VERCEL_ENV) {
      // In Vercel environment, use JSON content directly from env var
      const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log("[FirebaseAdmin] Vercel environment detected");
      console.log(
        "[FirebaseAdmin] GOOGLE_APPLICATION_CREDENTIALS exists:",
        Boolean(credentialsJson),
      );

      if (!credentialsJson) {
        console.error(
          "[FirebaseAdmin] Missing credentials in Vercel environment",
        );
        throw new Error(
          "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set for Vercel.",
        );
      }

      try {
        console.log("[FirebaseAdmin] Parsing JSON credentials...");
        // Log first few characters of credential to ensure it's not empty (don't log full credentials)
        console.log(
          "[FirebaseAdmin] Credentials JSON starts with:",
          credentialsJson.substring(0, Math.min(20, credentialsJson.length)) +
          "...",
        );

        const serviceAccount = JSON.parse(credentialsJson);
        console.log(
          "[FirebaseAdmin] JSON parsing successful, initializing app...",
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(
          "[FirebaseAdmin] Initialized with JSON credentials for Vercel environment. Apps count:",
          admin.apps.length,
        );
      } catch (error) {
        console.error("[FirebaseAdmin] Error parsing credentials JSON:", error);
        throw new Error("Failed to parse Firebase Admin credentials JSON.");
      }
    } else {
      // Local development environment - use service account file path
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const serviceAccountPath =
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        "./service-account-credentials.json";

      // Handle both absolute and relative paths
      const resolvedServiceAccountPath = serviceAccountPath.startsWith("/")
        ? serviceAccountPath
        : path.resolve(__dirname, "..", serviceAccountPath);

      if (!fs.existsSync(resolvedServiceAccountPath)) {
        console.error(
          `[FirebaseAdmin] Service account key file not found at: ${resolvedServiceAccountPath}`,
        );
        throw new Error(
          `Service account key file not found at: ${resolvedServiceAccountPath}`,
        );
      }

      const serviceAccount = JSON.parse(
        fs.readFileSync(resolvedServiceAccountPath, "utf8"),
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(
        `[FirebaseAdmin] Initialized with service account file: ${resolvedServiceAccountPath}`,
      );
    }
  } catch (error: any) {
    if (error.code === "app/duplicate-app") {
      console.warn(
        "[FirebaseAdmin] Already initialized (duplicate app error).",
      );
    } else {
      console.error("[FirebaseAdmin] Initialization error:", error);
      throw error; // Re-throw to prevent silently continuing with an uninitialized Firebase
    }
  }
} else {
  console.log(
    "[FirebaseAdmin] Firebase app already initialized. Apps count:",
    admin.apps.length,
  );
}

console.log(
  "[FirebaseAdmin] Initialization check complete. Final apps count:",
  admin.apps.length,
);

export { admin };
export const auth = getAuth();
export const firestore = getFirestore();
