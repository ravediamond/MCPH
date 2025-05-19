import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Path to your service account key file
// Make sure this path is correct and the file is not publicly accessible
const serviceAccountPath =
  process.env.FIREBASE_ADMIN_SDK_SERVICE_ACCOUNT_PATH ||
  "./service-account-credentials.json";

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) {
    console.log("[FirebaseAdmin] Already initialized. Skipping.");
    return;
  }
  console.log("[FirebaseAdmin] Attempting initialization...");
  try {
    // Check if running in Vercel or a similar environment where env vars are preferred
    if (process.env.VERCEL && process.env.FIREBASE_ADMIN_SDK_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_SDK_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_SDK_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n",
          ),
        }),
        // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com` // Optional: if you use Realtime Database
      });
      console.log("[FirebaseAdmin] Initialized with environment variables.");
    } else {
      // Fallback to service account file for local development or other environments
      // Resolve path relative to the current module
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const resolvedServiceAccountPath = path.resolve(
        __dirname,
        "..",
        serviceAccountPath,
      );

      if (!fs.existsSync(resolvedServiceAccountPath)) {
        console.error(
          `[FirebaseAdmin] Service account key file not found at: ${resolvedServiceAccountPath}`,
        );
        console.error(
          "[FirebaseAdmin] Please ensure FIREBASE_ADMIN_SDK_SERVICE_ACCOUNT_PATH is set correctly or the file exists at the default location.",
        );
        // Optionally, throw an error or exit if the file is critical for initialization
        // throw new Error(`Service account key file not found at: ${resolvedServiceAccountPath}`);
        return; // Exit if the file is not found to prevent further errors
      }
      const serviceAccount = JSON.parse(
        fs.readFileSync(resolvedServiceAccountPath, "utf8"),
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com` // Optional: if you use Realtime Database
      });
      console.log(
        `[FirebaseAdmin] Initialized with service account file: ${resolvedServiceAccountPath}`,
      );
    }
    initialized = true;
    console.log(
      '[FirebaseAdmin] Initialization successful. Flag "initialized" set to true.',
    );
  } catch (error: any) {
    // Check if the error is due to already initialized app
    if (error.code === "app/duplicate-app") {
      console.warn(
        "[FirebaseAdmin] Already initialized (duplicate app error).",
      );
      initialized = true;
    } else {
      console.error("[FirebaseAdmin] Initialization error:", error);
      // Optionally, rethrow the error or handle it as needed
      // throw error;
    }
  }
}

// Ensure it's initialized when this module is imported
initializeFirebaseAdmin();

// Export the admin instance for use in other modules
export { admin };
