import { Storage, StorageOptions } from "@google-cloud/storage";

// Helper function to create Storage instance from credentials string
const createStorageFromCredentials = (
  credentialsString: string,
  projectId?: string,
): Storage | null => {
  try {
    const credentials = JSON.parse(credentialsString);
    // More robust check for client_email and private_key
    if (
      typeof credentials.client_email !== "string" ||
      credentials.client_email.trim() === "" ||
      typeof credentials.private_key !== "string" ||
      credentials.private_key.trim() === ""
    ) {
      console.error(
        "Service account credentials from string are missing, empty, or not strings for client_email or private_key.",
      );
      // Log the problematic parts for debugging, carefully redacting private_key if necessary in real logs
      console.error(
        `Detected types: client_email (${typeof credentials.client_email}), private_key (${typeof credentials.private_key}). Ensure these are non-empty strings.`,
      );
      return null;
    }
    // Use projectId from argument if provided, otherwise it will be inferred from credentials or ADC
    const options: StorageOptions = { credentials };
    if (projectId) {
      options.projectId = projectId;
    }
    return new Storage(options);
  } catch (e: any) {
    console.error(
      "Error parsing service account credentials string:",
      e.message,
    );
    return null;
  }
};

// Initialize Google Cloud Storage client
let storage: Storage;

try {
  const projectIdFromEnv = process.env.GCP_PROJECT_ID;

  // Production environment (e.g., Vercel deployment)
  if (process.env.VERCEL_ENV === "production") {
    console.log(
      "Production environment detected. Attempting to initialize GCS client using GCP_SERVICE_ACCOUNT.",
    );
    const credentialsString = process.env.GCP_SERVICE_ACCOUNT;

    if (!credentialsString) {
      console.error(
        "GCP_SERVICE_ACCOUNT environment variable is not set for production.",
      );
      throw new Error(
        "GCP_SERVICE_ACCOUNT environment variable is not set for production.",
      );
    }

    // GCP_PROJECT_ID is recommended for clarity, but Storage client might infer from credentials
    if (!projectIdFromEnv) {
      console.warn(
        "GCP_PROJECT_ID environment variable is not explicitly set for production. Project ID will be inferred from credentials if possible.",
      );
    }

    const prodStorage = createStorageFromCredentials(
      credentialsString,
      projectIdFromEnv,
    );
    if (!prodStorage) {
      throw new Error(
        "Failed to initialize Google Cloud Storage for production from GCP_SERVICE_ACCOUNT.",
      );
    }
    storage = prodStorage;
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
const UPLOADS_FOLDER = "uploads/";

// Get the bucket
export const bucket = storage.bucket(BUCKET_NAME);
export const uploadsFolder = UPLOADS_FOLDER;
