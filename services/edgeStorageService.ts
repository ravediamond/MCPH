/**
 * Edge-compatible storage service for uploading and managing files
 * This service uses the Fetch API and is compatible with Edge runtime
 */
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from './redisService';

// Base folder for uploaded files
const BASE_FOLDER = 'uploads/';

// Define storage backend type based on environment
// For Edge runtime, we'll support a few options:
// 1. Cloudflare R2 (compatible with S3 API)
// 2. Vercel Blob Storage
// 3. Fallback to API proxy to regular storage
const STORAGE_TYPE = process.env.EDGE_STORAGE_TYPE || 'vercel-blob';

/**
 * Upload a file to storage with Edge-compatible methods
 */
export async function uploadFile(
    fileBuffer: ArrayBuffer | Uint8Array,
    fileName: string,
    contentType: string,
    ttlHours: number = 1
): Promise<FileMetadata> {
    try {
        // Generate a unique ID for the file
        const fileId = uuidv4();

        // Generate path
        const gcsPath = `${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`;

        // Calculate expiration date
        const uploadedAt = new Date();
        const expiresAt = new Date(uploadedAt);
        expiresAt.setHours(expiresAt.getHours() + ttlHours);

        // Prepare file metadata
        const fileData: FileMetadata = {
            id: fileId,
            fileName,
            contentType,
            size: fileBuffer instanceof Uint8Array ? fileBuffer.length : fileBuffer.byteLength,
            gcsPath,
            uploadedAt,
            expiresAt,
            downloadCount: 0,
        };

        // In Edge runtime, we need to handle uploads differently based on configured storage
        switch (STORAGE_TYPE) {
            case 'vercel-blob':
                // Here we would use Vercel's Blob storage, but for now we'll 
                // just store the metadata and leave actual implementation details
                // This is just a placeholder and would need to be implemented with actual Vercel Blob client
                // We'll only do this for demonstration purposes
                break;

            case 'r2':
                // Similar placeholder for Cloudflare R2 storage
                break;

            case 'api-proxy':
                // Proxy the upload through a regular Node.js API route
                // that has access to the full Google Cloud Storage SDK
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/uploads/proxy`;
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileId,
                        fileName,
                        contentType,
                        ttlHours,
                        // Convert buffer to base64 for transmission
                        content: Buffer.from(fileBuffer).toString('base64'),
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Upload proxy failed: ${response.status}`);
                }

                // Get full metadata response from the proxy
                const result = await response.json();
                if (result.error) {
                    throw new Error(result.error);
                }
                break;

            default:
                throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
        }

        return fileData;
    } catch (error) {
        console.error('Error uploading file:', error);
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
        // In Edge environment, we'd generate a pre-signed URL differently
        // Here we'll return a URL to our own API that handles the download
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        return `${baseUrl}/api/uploads/${fileId}?filename=${encodeURIComponent(fileName)}`;
    } catch (error) {
        console.error('Error generating download URL:', error);
        throw new Error('Failed to generate download link');
    }
}

/**
 * Delete a file from storage (for Edge compatibility)
 */
export async function deleteFile(fileId: string, fileName: string): Promise<boolean> {
    try {
        // For Edge runtime, we would call an API endpoint that can handle the deletion
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/uploads/${fileId}/delete`;
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
            },
            body: JSON.stringify({
                fileName,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * This would be the implementation if we were using actual Vercel Blob Storage
 * Included as reference but commented out to avoid introducing dependencies
 */
/*
import { put, del } from '@vercel/blob';

export async function uploadToVercelBlob(
    fileBuffer: ArrayBuffer | Uint8Array,
    fileName: string,
    contentType: string,
    fileId: string
): Promise<string> {
    const blob = await put(
        `${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`,
        fileBuffer,
        {
            contentType,
            access: 'public',
        }
    );
    
    return blob.url;
}

export async function deleteFromVercelBlob(
    fileId: string,
    fileName: string
): Promise<boolean> {
    try {
        await del(`${BASE_FOLDER}${fileId}/${encodeURIComponent(fileName)}`);
        return true;
    } catch (error) {
        console.error('Error deleting from Vercel Blob:', error);
        return false;
    }
}
*/