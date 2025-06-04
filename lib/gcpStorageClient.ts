import { Storage, StorageOptions } from "@google-cloud/storage";

// Initialize Google Cloud Storage client
let storage: Storage;

try {
  const projectIdFromEnv = process.env.GCP_PROJECT_ID;

  if (process.env.VERCEL_ENV) {
    console.log(
      "Vercel environment detected. Initializing GCS client with JSON credentials.",
    );
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsJson) {
      console.error(
        "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set for Vercel.",
      );
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set for Vercel.",
      );
    }

    try {
      // Parse the JSON string and use it directly with credentials
      const credentials = JSON.parse(credentialsJson);
      const storageOptions: StorageOptions = { credentials };
      if (projectIdFromEnv) {
        storageOptions.projectId = projectIdFromEnv;
      }
      storage = new Storage(storageOptions);
      console.log(
        `Initialized Google Cloud Storage client for Vercel. Project ID: ${storage.projectId || "inferred"}.`,
      );
    } catch (jsonError) {
      console.error("Error parsing credentials JSON:", jsonError);
      throw new Error("Failed to parse service account credentials JSON.");
    }
  } else {
    // Development environment (local)
    console.log(
      "Local environment detected. Initializing GCS client with credential file path or ADC.",
    );

    const storageOptions: StorageOptions = {};
    if (projectIdFromEnv) {
      storageOptions.projectId = projectIdFromEnv;
      console.log(`Using GCP_PROJECT_ID from env: ${projectIdFromEnv}`);
    }

    // If a credentials file path is specified, use it
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyFilename) {
      storageOptions.keyFilename = keyFilename;
      console.log(`Using credentials file: ${keyFilename}`);
    } else {
      console.log(
        "No credentials file specified. Using Application Default Credentials (ADC).",
      );
      console.log(
        'Ensure you have run "gcloud auth application-default login".',
      );
    }

    storage = new Storage(storageOptions);
    console.log(
      `Initialized Google Cloud Storage client. Project ID: ${storage.projectId || "inferred/pending"}.`,
    );
  }
} catch (error) {
  console.error("Fatal error initializing Google Cloud Storage:", error);
  throw new Error(
    "Failed to initialize storage service. Application may not function correctly.",
  );
}

// Get GCS bucket name from environment variables
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!BUCKET_NAME) {
  console.error(
    "GCS_BUCKET_NAME environment variable is not set! This is required.",
  );
  throw new Error("GCS_BUCKET_NAME environment variable is not set!");
}
console.log(`Using GCS Bucket: ${BUCKET_NAME}`);

// Base folder for uploaded files
const CRATES_FOLDER = "crates/";

// Get the bucket
export const bucket = storage.bucket(BUCKET_NAME);
export const cratesFolder = CRATES_FOLDER;
