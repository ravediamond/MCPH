import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import { FileUpload, FileUploadRequest } from '@/types/file';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || '';

if (!bucketName) {
  console.error('Missing GCS_BUCKET_NAME environment variable');
}

const bucket = storage.bucket(bucketName);

// Helper to generate a secure random ID for files
const generateFileId = () => randomUUID();

// Path format in GCS: uploads/yyyy-mm-dd/file-id
const getGcsPath = (fileId: string) => {
  const now = new Date();
  const datePath = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `uploads/${datePath}/${fileId}`;
};

/**
 * Uploads a file to Google Cloud Storage
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  ttlHours: number = 1, // Default 1 hour TTL
  metadata?: Record<string, string>
): Promise<FileUpload> => {
  const fileId = generateFileId();
  const gcsPath = getGcsPath(fileId);
  
  // Calculate expiry time
  const uploadedAt = new Date();
  const expiresAt = new Date(uploadedAt);
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  
  // Create a file object in GCS
  const file = bucket.file(gcsPath);
  
  // Upload the file
  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        originalFileName: fileName,
        uploadedAt: uploadedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        ...metadata
      }
    }
  });
  
  // Return file metadata
  return {
    id: fileId,
    fileName,
    contentType,
    size: fileBuffer.length,
    uploadedAt,
    expiresAt,
    downloadCount: 0,
    gcsPath,
    metadata
  };
};

/**
 * Gets a signed URL for downloading a file
 */
export const getSignedDownloadUrl = async (fileId: string, fileName: string): Promise<string> => {
  // Find the file in the bucket based on the file ID
  // We need to list files with prefix to find the correct path
  const [files] = await bucket.getFiles({ prefix: `uploads/` });
  
  // Find the file with the matching ID in its path
  const file = files.find(f => f.name.endsWith(fileId));
  
  if (!file) {
    throw new Error('File not found');
  }
  
  // Create a signed URL with the original file name in Content-Disposition
  const options = {
    version: 'v4' as const,
    action: 'read' as const,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    responseDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  };
  
  const [url] = await file.getSignedUrl(options);
  return url;
};

/**
 * Deletes a file from Google Cloud Storage
 */
export const deleteFile = async (gcsPath: string): Promise<void> => {
  const file = bucket.file(gcsPath);
  await file.delete();
};

/**
 * Gets file metadata from Google Cloud Storage
 */
export const getFileMetadata = async (gcsPath: string): Promise<any> => {
  const file = bucket.file(gcsPath);
  const [metadata] = await file.getMetadata();
  return metadata;
};

/**
 * Checks if a file exists in Google Cloud Storage
 */
export const fileExists = async (gcsPath: string): Promise<boolean> => {
  const file = bucket.file(gcsPath);
  const [exists] = await file.exists();
  return exists;
};

/**
 * Lists files that are past their expiration date
 */
export const listExpiredFiles = async (): Promise<string[]> => {
  const now = new Date().toISOString();
  const [files] = await bucket.getFiles();
  
  const expiredFiles: string[] = [];
  
  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const expiresAt = metadata.metadata?.expiresAt;
    
    if (expiresAt && expiresAt < now) {
      expiredFiles.push(file.name);
    }
  }
  
  return expiredFiles;
};

/**
 * Purges expired files from Google Cloud Storage
 */
export const purgeExpiredFiles = async (): Promise<number> => {
  const expiredFiles = await listExpiredFiles();
  
  for (const filePath of expiredFiles) {
    await deleteFile(filePath);
  }
  
  return expiredFiles.length;
};