import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { getFileMetadata, deleteFileMetadata, FileMetadata } from './firebaseService';

// Initialize Google Cloud Storage
let storage: Storage;

try {
    // Parse the credentials from environment variable
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
        ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
        : undefined;

    storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials,
    });
} catch (error) {
    console.error('Error initializing Google Cloud Storage:', error);
    throw new Error('Failed to initialize storage service');
}

// Get GCS bucket name from environment variables
const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'mcphub-files';

// Base folder for uploaded files
const BASE_FOLDER = 'uploads/';

// Get the bucket
const bucket = storage.bucket(BUCKET_NAME);

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
): Promise<FileMetadata> {
    try {
        // Generate a unique ID for the file
        const fileId = uuidv4();

        // Generate GCS path
        const gcsPath = `${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`;

        // Create a GCS file object
        const file = bucket.file(gcsPath);

        // Upload the file
        await file.save(fileBuffer, {
            metadata: {
                contentType,
                metadata: {
                    fileId,
                    originalName: fileName,
                    uploadedAt: new Date().toISOString(),
                },
            },
            resumable: false,
        });

        // Prepare file metadata
        const uploadedAt = new Date();

        const fileData: FileMetadata = {
            id: fileId,
            fileName,
            contentType,
            size: fileBuffer.length,
            gcsPath,
            uploadedAt,
            downloadCount: 0,
        };

        return fileData;
    } catch (error) {
        console.error('Error uploading file to GCS:', error);
        throw new Error('Failed to upload file');
    }
}

/**
 * Get a signed download URL for a file
 */
export async function getSignedDownloadUrl(
    fileId: string,
    fileName: string,
    expiresInMinutes: number = 10
): Promise<string> {
    try {
        // Generate the GCS path
        const gcsPath = `${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`;

        // Get the file
        const file = bucket.file(gcsPath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error('File not found in storage');
        }

        // Generate a signed URL
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresInMinutes * 60 * 1000,
            // Set content disposition to force download with original filename
            responseDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
        });

        return url;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate download link');
    }
}

/**
 * Stream a file directly from storage
 */
export async function streamFile(fileId: string, fileName: string): Promise<{
    stream: NodeJS.ReadableStream;
    contentType: string;
    size: number;
}> {
    try {
        // Generate the GCS path
        const gcsPath = `${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`;

        // Get the file
        const file = bucket.file(gcsPath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error('File not found in storage');
        }

        // Get file metadata
        const [metadata] = await file.getMetadata();

        // Create read stream
        const stream = file.createReadStream();

        return {
            stream,
            contentType: metadata.contentType || 'application/octet-stream',
            size: metadata.size ? parseInt(metadata.size.toString(), 10) : 0,
        };
    } catch (error) {
        console.error('Error streaming file:', error);
        throw new Error('Failed to stream file');
    }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileId: string, fileName: string): Promise<boolean> {
    try {
        // Generate the GCS path
        const gcsPath = `${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`;

        // Get the file
        const file = bucket.file(gcsPath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return false;
        }

        // Delete the file
        await file.delete();

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}