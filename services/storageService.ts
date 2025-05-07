import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { getFileMetadata, deleteFileMetadata, FileMetadata } from './redisService';

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
    contentType: string,
    ttlHours: number = 1
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
                    ttlHours: ttlHours.toString(),
                },
            },
            resumable: false,
        });

        // Calculate expiration date
        const uploadedAt = new Date();
        const expiresAt = new Date(uploadedAt);
        expiresAt.setHours(expiresAt.getHours() + ttlHours);

        // Prepare file metadata
        const fileData: FileMetadata = {
            id: fileId,
            fileName,
            contentType,
            size: fileBuffer.length,
            gcsPath,
            uploadedAt,
            expiresAt,
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

/**
 * Purge expired files from storage and Redis
 */
export async function purgeExpiredFiles(): Promise<number> {
    try {
        // List all files in the uploads folder
        const [files] = await bucket.getFiles({ prefix: BASE_FOLDER });

        // Track number of purged files
        let purgedCount = 0;

        // Current time
        const now = new Date();

        // Process files in batches to avoid memory issues
        for (const file of files) {
            try {
                // Extract fileId and fileName from the path
                const pathParts = file.name.split('/');
                if (pathParts.length < 3) continue;

                const fileId = pathParts[1];

                // Skip if not a properly structured path
                if (!fileId) continue;

                // Get file metadata from Redis
                const metadata = await getFileMetadata(fileId);

                // If metadata exists, check if expired
                if (metadata) {
                    if (metadata.expiresAt <= now) {
                        // Delete from storage
                        await file.delete();

                        // Delete from Redis
                        await deleteFileMetadata(fileId);

                        purgedCount++;
                    }
                } else {
                    // If no metadata in Redis, delete from storage 
                    // (orphaned file, metadata may have been lost)
                    await file.delete();
                    purgedCount++;
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                // Continue with next file
            }
        }

        return purgedCount;
    } catch (error) {
        console.error('Error purging expired files:', error);
        throw new Error('Failed to purge expired files');
    }
}