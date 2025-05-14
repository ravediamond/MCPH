import { v4 as uuidv4 } from 'uuid';
import { bucket, uploadsFolder } from '../lib/gcpStorageClient';
import {
    saveFileMetadata,
    getFileMetadata,
    deleteFileMetadata,
    incrementDownloadCount,
    logEvent
} from './firebaseService';
import { DATA_TTL } from '../app/config/constants'; // Added import for DATA_TTL

// File metadata type definition
export interface FileMetadata {
    id: string;
    fileName: string;
    contentType: string;
    size: number;
    gcsPath: string;
    uploadedAt: number; // Timestamp (milliseconds)
    expiresAt?: number; // Timestamp (milliseconds)
    downloadCount: number;
}

/**
 * Generate a pre-signed URL for uploading a file directly to GCS
 */
export async function generateUploadUrl(
    fileName: string,
    contentType: string,
    ttlDays?: number // Changed from ttlHours to ttlDays
): Promise<{ url: string, fileId: string, gcsPath: string }> {
    try {
        // Generate a unique ID for the file
        const fileId = uuidv4();

        // Generate GCS path
        const gcsPath = `${uploadsFolder}${fileId}/${encodeURIComponent(fileName)}`;

        // Create a GCS file object
        const file = bucket.file(gcsPath);

        // Generate a signed URL for uploads
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + (15 * 60 * 1000), // 15 minutes
            contentType,
            extensionHeaders: {
                'x-goog-content-length-range': '0,104857600' // Limit to 100MB
            }
        });

        // Calculate expiration time if provided
        const uploadedAt = Date.now();
        const expiresAtTimestamp = DATA_TTL.getExpirationTimestamp(uploadedAt, ttlDays);

        // Prepare file metadata
        const fileData: FileMetadata = {
            id: fileId,
            fileName,
            contentType,
            size: 0, // Will be updated when file is uploaded
            gcsPath,
            uploadedAt, // Store as number (timestamp)
            expiresAt: expiresAtTimestamp, // Store as number (timestamp)
            downloadCount: 0,
        };

        // Store metadata in Firestore
        await saveFileMetadata({
            ...fileData,
            uploadedAt: new Date(uploadedAt),
            expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp) : undefined,
        } as any);

        return { url, fileId, gcsPath };
    } catch (error: any) {
        console.error('Error generating upload URL:', error);
        if (error.message && error.message.includes('Cannot sign data without `client_email`')) {
            throw new Error(
                'Failed to generate upload URL due to a signing error. ' +
                'This usually means the GCS client is missing `client_email` or `private_key` in its credentials. ' +
                'If running in production (e.g., Vercel), ensure the GCP_SERVICE_ACCOUNT environment variable contains a valid service account JSON key with `client_email` and `private_key`. ' +
                'If running locally, ensure Application Default Credentials (ADC) are configured correctly with a service account key (e.g., via `gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS) and that the service account has permissions to sign (e.g., "Service Account Token Creator" role).'
            );
        }
        // Fallback for other errors
        throw new Error('Failed to generate upload URL. Original error: ' + (error.message || 'Unknown error'));
    }
}

/**
 * Upload a file directly to Google Cloud Storage (server-side)
 * This is kept for backward compatibility or server-side uploads
 */
export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    ttlDays?: number // Changed from ttlHours to ttlDays
): Promise<FileMetadata> {
    try {
        // Generate a unique ID for the file
        const fileId = uuidv4();

        // Generate GCS path
        const gcsPath = `${uploadsFolder}${fileId}/${encodeURIComponent(fileName)}`;

        // Create a GCS file object
        const file = bucket.file(gcsPath);

        // Upload the file
        await file.save(fileBuffer, {
            metadata: {
                contentType,
                metadata: {
                    fileId,
                    originalName: fileName,
                    uploadedAt: Date.now().toString(),
                },
            },
            resumable: false,
        });

        // Prepare file metadata
        const uploadedAt = Date.now();

        // Calculate expiration time using DATA_TTL
        const expiresAtTimestamp = DATA_TTL.getExpirationTimestamp(uploadedAt, ttlDays);

        const fileData: FileMetadata = {
            id: fileId,
            fileName,
            contentType,
            size: fileBuffer.length,
            gcsPath,
            uploadedAt, // Store as number (timestamp)
            expiresAt: expiresAtTimestamp, // Store as number (timestamp)
            downloadCount: 0,
        };

        // Store metadata in Firestore
        await saveFileMetadata({
            ...fileData,
            uploadedAt: new Date(uploadedAt),
            expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp) : undefined,
        } as any);

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
    fileName?: string,
    expiresInMinutes: number = 60
): Promise<string> {
    try {
        // Get file metadata from Firestore
        const metadata = await getFileMetadata(fileId);
        if (!metadata) {
            throw new Error('File not found');
        }

        const actualFileName = fileName || metadata.fileName;
        const gcsPath = metadata.gcsPath;

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
            responseDisposition: `attachment; filename="${encodeURIComponent(actualFileName)}"`,
        });

        // Increment download count in Firestore
        await incrementDownloadCount(fileId);

        // Log the download event
        await logEvent('file_download', fileId);

        return url;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate download link');
    }
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(fileId: string): Promise<boolean> {
    try {
        // Get file metadata from Firestore
        const metadata = await getFileMetadata(fileId);
        if (!metadata) {
            return false;
        }

        // Get the file
        const file = bucket.file(metadata.gcsPath);

        // Check if file exists
        const [exists] = await file.exists();
        return exists;
    } catch (error) {
        console.error('Error checking if file exists:', error);
        return false;
    }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileId: string): Promise<boolean> {
    try {
        // Get file metadata from Firestore
        const metadata = await getFileMetadata(fileId);
        if (!metadata) {
            return false;
        }

        // Get the file
        const file = bucket.file(metadata.gcsPath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            // Metadata exists but file doesn't, clean up metadata
            await deleteFileMetadata(fileId);
            return true;
        }

        // Delete the file
        await file.delete();

        // Delete metadata
        await deleteFileMetadata(fileId);

        // Log the deletion event
        await logEvent('file_delete', fileId);

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Stream file content directly
 */
export async function getFileStream(fileId: string): Promise<{
    stream: NodeJS.ReadableStream;
    metadata: FileMetadata;
}> {
    try {
        // Get file metadata from Firestore
        const metadata = await getFileMetadata(fileId) as unknown as FileMetadata;
        if (!metadata) {
            throw new Error('File not found');
        }

        // Get the file
        const file = bucket.file(metadata.gcsPath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error('File not found in storage');
        }

        // Create a read stream
        const stream = file.createReadStream();

        // Increment download count
        await incrementDownloadCount(fileId);

        return { stream, metadata };
    } catch (error) {
        console.error('Error streaming file:', error);
        throw new Error('Failed to stream file');
    }
}