import { Storage, StorageOptions } from "@google-cloud/storage";

// Initialize Google Cloud Storage client
let storage: Storage;

try {
  const projectIdFromEnv = process.env.GCP_PROJECT_ID;

  if (process.env.VERCEL_ENV === "production") {
    console.log(
      "Production environment detected. Initializing GCS client using keyFilename from GOOGLE_APPLICATION_CREDENTIALS.",
    );
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyFilename) {
      console.error(
        "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set for production.",
      );
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set for production.",
      );
    }
    const storageOptions: StorageOptions = { keyFilename };
    if (projectIdFromEnv) {
      storageOptions.projectId = projectIdFromEnv;
    }
    storage = new Storage(storageOptions);
    console.log(
      `Initialized Google Cloud Storage client for production. Project ID: ${storage.projectId || "inferred"}.`,
    );
  } else {
    // Development environment (local)
    console.log(
      "Development environment detected. Initializing GCS client using Application Default Credentials (ADC).",
    );
    console.log(
      'Ensure you have run "gcloud auth application-default login" or set the GOOGLE_APPLICATION_CREDENTIALS environment variable in your shell.',
    );

    const storageOptions: StorageOptions = {};
    if (projectIdFromEnv) {
      storageOptions.projectId = projectIdFromEnv;
      console.log(
        `Using GCP_PROJECT_ID from env: ${projectIdFromEnv} for ADC.`,
      );
    } else {
      console.log(
        "GCP_PROJECT_ID not set in env for development. ADC will attempt to infer it if necessary.",
      );
    }
    storage = new Storage(storageOptions); // ADC will be used here
    console.log(
      `Initialized Google Cloud Storage client for development using ADC. Project ID: ${storage.projectId || "inferred/pending"}.`,
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
