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
      // For Vercel: directly parse and use the JSON content as credentials object
      const credentials = JSON.parse(credentialsJson);
      storage = new Storage({
        credentials,
        projectId: projectIdFromEnv || credentials.project_id,
      });
      console.log(
        `Initialized Google Cloud Storage client for Vercel with parsed JSON credentials. Project ID: ${storage.projectId || "inferred from credentials"}.`,
      );
    } catch (jsonError) {
      console.error("Error parsing credentials JSON:", jsonError);
      throw new Error("Failed to parse service account credentials JSON.");
    }
  } else {
    // Local development environment
    console.log(
      "Local environment detected. Initializing GCS client with credential file path.",
    );

    const storageOptions: StorageOptions = {};
    if (projectIdFromEnv) {
      storageOptions.projectId = projectIdFromEnv;
      console.log(`Using GCP_PROJECT_ID from env: ${projectIdFromEnv}`);
    }

    // Use credentials file path for local development
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
      `Initialized Google Cloud Storage client for local development. Project ID: ${storage.projectId || "inferred/pending"}.`,
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
