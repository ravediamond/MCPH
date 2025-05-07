export interface FileUpload {
  id: string;             // Unique ID for the file
  fileName: string;       // Original filename
  contentType: string;    // MIME type of the file
  size: number;          // Size in bytes
  uploadedAt: Date;      // When the file was uploaded
  expiresAt: Date;       // When the file will be deleted
  ipAddress?: string;     // IP of uploader (for logs)
  downloadCount: number; // How many times the file has been downloaded
  gcsPath: string;       // Path in Google Cloud Storage
  metadata?: Record<string, string>; // Optional additional metadata
}

export interface FileUploadRequest {
  file: File;              // The file to upload
  ttlHours?: number;      // Time-to-live in hours (default: 1)
  metadata?: Record<string, string>; // Optional additional metadata
}

export interface FileUploadResponse {
  id: string;             // The file ID for downloading
  fileName: string;       // Original filename  
  contentType: string;    // MIME type
  size: number;          // Size in bytes
  uploadedAt: string;    // ISO date string
  expiresAt: string;     // ISO date string
  downloadUrl: string;   // URL to download the file
  metadata?: Record<string, string>; // Optional additional metadata
}

export interface FileDownloadResponse extends FileUploadResponse {
  downloadCount: number;   // How many times the file has been downloaded
}