import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

// Utility to handle service account credentials for Vercel
function setupServiceAccountForVercel() {
  if (process.env.VERCEL_ENV) {
    const jsonContent =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_ADMIN_SDK_SERVICE_ACCOUNT_PATH;
    if (jsonContent && jsonContent.trim().startsWith("{")) {
      const tmpPath = path.join(os.tmpdir(), "service-account.json");
      fs.writeFileSync(tmpPath, jsonContent, { encoding: "utf8" });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
      process.env.FIREBASE_ADMIN_SDK_SERVICE_ACCOUNT_PATH = tmpPath;
    }
  }
}

setupServiceAccountForVercel();

// Use admin.apps.length to check initialization
if (!admin.apps.length) {
  try {
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
      });
      console.log("[FirebaseAdmin] Initialized with environment variables.");
    } else {
      // Fallback to service account file for local development
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const serviceAccountPath =
        process.env.FIREBASE_ADMIN_SDK_SERVICE_ACCOUNT_PATH ||
        "./service-account-credentials.json";
      const resolvedServiceAccountPath = path.resolve(
        __dirname,
        "..",
        serviceAccountPath,
      );
      if (!fs.existsSync(resolvedServiceAccountPath)) {
        console.error(
          `[FirebaseAdmin] Service account key file not found at: ${resolvedServiceAccountPath}`,
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
    }
  }
}

export { admin };
