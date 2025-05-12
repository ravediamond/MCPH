import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage client
let storage: Storage;

try {
    // Check if we're in a production environment
    if (process.env.VERCEL_ENV === 'production') {
        // For production, use the service account credentials from environment variable
        const credentials = process.env.GCP_SERVICE_ACCOUNT
            ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT)
            : undefined;

        storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            credentials,
        });
    } else {
        // For development, use local credentials file or Application Default Credentials
        storage = new Storage();
    }
} catch (error) {
    console.error('Error initializing Google Cloud Storage:', error);
    throw new Error('Failed to initialize storage service');
}

// Get GCS bucket name from environment variables
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'mcphub-files';

// Base folder for uploaded files
const UPLOADS_FOLDER = 'uploads/';

// Get the bucket
export const bucket = storage.bucket(BUCKET_NAME);
export const uploadsFolder = UPLOADS_FOLDER;