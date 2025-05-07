/**
 * Type definitions for the file-sharing service
 */

/**
 * File upload request parameters
 */
export interface FileUploadRequest {
    file: File;              // The file to upload
    ttlHours?: number;      // Time-to-live in hours (default: 1)
    metadata?: Record<string, string>; // Optional additional metadata
}

/**
 * File upload metadata stored in Redis
 */
export interface FileUpload {
    id: string;             // Unique ID for the file
    fileName: string;       // Original filename
    contentType: string;    // MIME type of the file
    size: number;          // Size in bytes
    uploadedAt: Date;      // When the file was uploaded
    expiresAt: Date;       // When the file will be deleted
    downloadCount: number; // How many times the file has been downloaded
    gcsPath: string;       // Path in Google Cloud Storage
    metadata?: Record<string, string>; // Optional additional metadata
}

/**
 * File download response
 */
export interface FileDownloadResponse {
    id: string;             // The file ID for downloading
    fileName: string;       // Original filename  
    contentType: string;    // MIME type
    size: number;          // Size in bytes
    uploadedAt: string;    // ISO date string
    expiresAt: string;     // ISO date string
    downloadCount: number; // How many times the file has been downloaded
    downloadUrl: string;   // URL to download the file
    metadata?: Record<string, string>; // Optional additional metadata
}

/**
 * File metrics response
 */
export interface FileMetrics {
    totalUploads: number;
    totalDownloads: number;
    todayUploads: number;
    todayDownloads: number;
    yesterdayUploads: number;
    yesterdayDownloads: number;
    activeFiles: number;
}