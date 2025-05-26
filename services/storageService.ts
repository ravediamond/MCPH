import { v4 as uuidv4 } from "uuid";
import { bucket, cratesFolder } from "../lib/gcpStorageClient";
import {
  saveCrateMetadata,
  getCrateMetadata,
  deleteCrateMetadata,
  incrementCrateDownloadCount,
  logEvent,
} from "./firebaseService";
import { DATA_TTL } from "../app/config/constants";
import {
  shouldCompress,
  compressBuffer,
  decompressBuffer,
} from "../lib/compressionUtils";
import { Crate, CrateCategory, CrateSharing } from "../app/types/crate";

// File metadata type definition
export interface FileMetadata {
  id: string;
  fileName: string;
  title: string; // Added title field (mandatory)
  description?: string; // Added description field (optional)
  contentType: string;
  size: number;
  fileType?: string; // Added fileType field (optional)
  gcsPath: string;
  uploadedAt: number; // Timestamp (milliseconds)
  expiresAt?: number; // Timestamp (milliseconds)
  downloadCount: number;
  ipAddress?: string;
  userId?: string;
  metadata?: Record<string, string>;
  compressed?: boolean; // Whether the file is compressed
  originalSize?: number; // Original size before compression (if compressed)
  compressionMethod?: string; // The compression method used (gzip, brotli, etc.)
  compressionRatio?: number; // Compression ratio as percentage saved
}

/**
 * Generate a pre-signed URL for uploading a file directly to GCS
 */
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  ttlDays?: number, // Changed from ttlHours to ttlDays
): Promise<{ url: string; fileId: string; gcsPath: string }> {
  try {
    // Generate a unique ID for the file
    const fileId = uuidv4();

    // Generate GCS path
    const gcsPath = `${cratesFolder}${fileId}/${encodeURIComponent(fileName)}`;

    // Create a GCS file object
    const file = bucket.file(gcsPath);

    // Generate a signed URL for uploads
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
      extensionHeaders: {
        "x-goog-content-length-range": "0,104857600", // Limit to 100MB
      },
    });

    // Calculate expiration time if provided
    const uploadedAt = Date.now();
    const expiresAtTimestamp = DATA_TTL.getExpirationTimestamp(
      uploadedAt,
      ttlDays,
    );

    // Prepare file metadata
    const fileData: FileMetadata = {
      id: fileId,
      fileName,
      title: fileName, // Use fileName as the default title
      contentType,
      size: 0, // Will be updated when file is uploaded
      gcsPath,
      uploadedAt, // Store as number (timestamp)
      expiresAt: expiresAtTimestamp, // Store as number (timestamp)
      downloadCount: 0,
    };

    // Store metadata in Firestore
    await saveCrateMetadata({
      ...fileData,
      uploadedAt: new Date(uploadedAt),
      expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp) : undefined,
    } as any);

    return { url, fileId, gcsPath };
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    if (
      error.message &&
      error.message.includes("Cannot sign data without `client_email`")
    ) {
      throw new Error(
        "Failed to generate upload URL due to a signing error. " +
        "This usually means the GCS client is missing `client_email` or `private_key` in its credentials. " +
        "If running in production (e.g., Vercel), ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable contains a valid service account JSON key with `client_email` and `private_key`. " +
        'If running locally, ensure Application Default Credentials (ADC) are configured correctly with a service account key (e.g., via `gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS) and that the service account has permissions to sign (e.g., "Service Account Token Creator" role).',
      );
    }
    // Fallback for other errors
    throw new Error(
      "Failed to generate upload URL. Original error: " +
      (error.message || "Unknown error"),
    );
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
  ttlDays?: number, // Changed from ttlHours to ttlDays
  title?: string,
  description?: string,
  fileType?: string, // Added fileType parameter
  metadata?: Record<string, string>,
): Promise<FileMetadata> {
  try {
    // Generate a unique ID for the file
    const fileId = uuidv4();

    // Generate GCS path
    const gcsPath = `${cratesFolder}${fileId}/${encodeURIComponent(fileName)}`;

    // Create a GCS file object
    const file = bucket.file(gcsPath);

    // Check if the file should be compressed based on content type and filename
    const shouldUseCompression = shouldCompress(contentType, fileName);
    let bufferToSave = fileBuffer;
    let compressionMetadata = null;

    // Apply compression if appropriate
    if (shouldUseCompression) {
      console.log(`Compressing file: ${fileName} (${contentType})`);
      try {
        const result = await compressBuffer(fileBuffer);
        bufferToSave = result.compressedBuffer;
        compressionMetadata = result.compressionMetadata;
        console.log(
          `Compression successful: ${fileName} - Original: ${compressionMetadata.originalSize} bytes, Compressed: ${compressionMetadata.compressedSize} bytes, Ratio: ${compressionMetadata.compressionRatio.toFixed(2)}%`,
        );
      } catch (compressionError) {
        console.error(
          "Error during compression, using original buffer:",
          compressionError,
        );
      }
    }

    // Upload the file with metadata
    await file.save(bufferToSave, {
      metadata: {
        contentType,
        metadata: {
          fileId,
          originalName: fileName,
          ...(title && { title }),
          ...(description && { description }),
          ...(fileType && { fileType }), // Add fileType to metadata if provided
          uploadedAt: Date.now().toString(),
          ...(compressionMetadata && {
            compressed: "true",
            compressionMethod: compressionMetadata.compressionMethod,
            originalSize: compressionMetadata.originalSize.toString(),
            compressionRatio: compressionMetadata.compressionRatio.toFixed(2),
          }),
        },
      },
      resumable: false,
    });

    // Prepare file metadata
    const uploadedAt = Date.now();

    // Calculate expiration time using DATA_TTL
    const expiresAtTimestamp = DATA_TTL.getExpirationTimestamp(
      uploadedAt,
      ttlDays,
    );

    // --- Generate searchText field ---
    const metaString = metadata
      ? Object.entries(metadata)
        .map(([k, v]) => `${k} ${v}`)
        .join(" ")
      : "";
    const searchText = [title, fileName, description, metaString]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const fileData: FileMetadata & { searchText?: string } = {
      id: fileId,
      fileName,
      title: title || fileName, // Use filename as title if not provided
      ...(description && { description }),
      contentType,
      size: bufferToSave.length,
      fileType: fileType || "file", // Use provided fileType or default to 'file'
      gcsPath,
      uploadedAt, // Store as number (timestamp)
      expiresAt: expiresAtTimestamp, // Store as number (timestamp)
      downloadCount: 0,
      ...(compressionMetadata && {
        compressed: true,
        originalSize: compressionMetadata.originalSize,
        compressionMethod: compressionMetadata.compressionMethod,
        compressionRatio: compressionMetadata.compressionRatio,
      }),
      ...(metadata && { metadata }),
      searchText,
    };

    // Store metadata in Firestore
    await saveCrateMetadata({
      ...fileData,
      uploadedAt: new Date(uploadedAt),
      expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp) : undefined,
    } as any);

    return fileData;
  } catch (error) {
    console.error("Error uploading file to GCS:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Upload a file as a Crate with the unified metadata schema
 */
export async function uploadCrate(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  crateData: Partial<Crate>
): Promise<Crate> {
  try {
    // Generate a unique ID for the crate
    const crateId = crateData.id || uuidv4();

    // Generate GCS path for the crate
    const gcsPath = `crates/${crateId}/${encodeURIComponent(fileName)}`;

    // Create a GCS file object
    const file = bucket.file(gcsPath);

    // Check if the file should be compressed based on content type and filename
    const shouldUseCompression = shouldCompress(contentType, fileName);
    let bufferToSave = fileBuffer;
    let compressionMetadata = null;

    // Apply compression if appropriate
    if (shouldUseCompression) {
      console.log(`Compressing crate: ${fileName} (${contentType})`);
      try {
        const result = await compressBuffer(fileBuffer);
        bufferToSave = result.compressedBuffer;
        compressionMetadata = result.compressionMetadata;
        console.log(
          `Compression successful: ${fileName} - Original: ${compressionMetadata.originalSize} bytes, Compressed: ${compressionMetadata.compressedSize} bytes, Ratio: ${compressionMetadata.compressionRatio.toFixed(2)}%`,
        );
      } catch (compressionError) {
        console.error(
          "Error during compression, using original buffer:",
          compressionError,
        );
      }
    }

    // Upload the file with metadata
    await file.save(bufferToSave, {
      metadata: {
        contentType,
        metadata: {
          crateId,
          originalName: fileName,
          title: crateData.title || fileName,
          ...(crateData.description && { description: crateData.description }),
          ...(crateData.category && { category: crateData.category }),
          ...(compressionMetadata && {
            compressed: "true",
            compressionMethod: compressionMetadata.compressionMethod,
            originalSize: compressionMetadata.originalSize.toString(),
            compressionRatio: compressionMetadata.compressionRatio.toFixed(2),
          }),
        },
      },
      resumable: false,
    });

    // Create the searchField for hybrid search
    const metaString = crateData.metadata
      ? Object.entries(crateData.metadata)
        .map(([k, v]) => `${k} ${v}`)
        .join(" ")
      : "";

    const tagsString = crateData.tags ? crateData.tags.join(" ") : "";
    const searchField = [
      crateData.title || fileName,
      crateData.description || "",
      tagsString,
      metaString
    ].filter(Boolean).join(" ").toLowerCase();

    // Create default sharing config if not provided
    const sharing: CrateSharing = crateData.shared || {
      public: false
    };

    // Create the complete crate metadata
    const completeCrate: Crate = {
      id: crateId,
      title: crateData.title || fileName,
      description: crateData.description,
      ownerId: crateData.ownerId || "anonymous",
      createdAt: new Date(),
      ttlDays: crateData.ttlDays || DATA_TTL.DEFAULT_DAYS,
      mimeType: contentType,
      category: crateData.category || getDefaultCategoryForFile(fileName, contentType),
      gcsPath: gcsPath,
      shared: sharing,
      tags: crateData.tags,
      searchField,
      size: bufferToSave.length,
      downloadCount: 0,
      metadata: crateData.metadata,
      fileName: fileName, // Add the fileName field
      ...(compressionMetadata && {
        compressed: true,
        compressionRatio: compressionMetadata.compressionRatio,
      })
    };

    // Store metadata in Firestore
    await saveCrateMetadata(completeCrate);

    // Log the upload event
    await logEvent("crate_upload", crateId);

    return completeCrate;
  } catch (error) {
    console.error("Error uploading crate to GCS:", error);
    throw new Error("Failed to upload crate");
  }
}

/**
 * Get a signed download URL for a file
 */
export async function getSignedDownloadUrl(
  fileId: string,
  fileName?: string,
  expiresInMinutes: number = 60,
): Promise<string> {
  try {
    // Get file metadata from Firestore
    const metadata = await getCrateMetadata(fileId);
    if (!metadata) {
      throw new Error("File not found");
    }

    const actualFileName = fileName || metadata.title;
    const gcsPath = metadata.gcsPath;

    // Get the file
    const file = bucket.file(gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File not found in storage");
    }

    // Generate a signed URL
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      // Set content disposition to force download with original filename
      responseDisposition: `attachment; filename="${encodeURIComponent(actualFileName)}"`,
    });

    // Increment download count in Firestore
    await incrementCrateDownloadCount(fileId);

    // Log the download event
    await logEvent("file_download", fileId);

    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate download link");
  }
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(fileId: string): Promise<boolean> {
  try {
    // Get file metadata from Firestore
    const metadata = await getCrateMetadata(fileId);
    if (!metadata) {
      return false;
    }

    // Get the file
    const file = bucket.file(metadata.gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error("Error checking if file exists:", error);
    return false;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    // Get file metadata from Firestore
    const metadata = await getCrateMetadata(fileId);
    if (!metadata) {
      return false;
    }

    // Get the file
    const file = bucket.file(metadata.gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      // Metadata exists but file doesn't, clean up metadata
      await deleteCrateMetadata(fileId);
      return true;
    }

    // Delete the file
    await file.delete();

    // Delete metadata
    await deleteCrateMetadata(fileId);

    // Log the deletion event
    await logEvent("file_delete", fileId);

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Get a file's content as a buffer, with automatic decompression if needed
 */
export async function getFileContent(fileId: string): Promise<{
  buffer: Buffer;
  metadata: FileMetadata;
}> {
  try {
    // Get file metadata from Firestore
    const metadata = (await getCrateMetadata(fileId)) as unknown as FileMetadata;
    if (!metadata) {
      throw new Error("File not found");
    }

    // Get the file
    const file = bucket.file(metadata.gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File not found in storage");
    }

    // Download the file content
    const [content] = await file.download();

    // Check if file is compressed and needs decompression
    if (metadata.compressed) {
      try {
        console.log(
          `Decompressing file: ${metadata.fileName} (${metadata.compressionMethod})`,
        );
        const decompressedContent = await decompressBuffer(content);
        console.log(
          `Decompression successful: ${metadata.fileName} - Compressed: ${content.length} bytes, Decompressed: ${decompressedContent.length} bytes`,
        );

        // Increment download count
        await incrementCrateDownloadCount(fileId);

        return { buffer: decompressedContent, metadata };
      } catch (decompressionError) {
        console.error("Error during decompression:", decompressionError);
        // Fall back to returning the compressed content
        return { buffer: content, metadata };
      }
    }

    // Increment download count
    await incrementCrateDownloadCount(fileId);

    return { buffer: content, metadata };
  } catch (error) {
    console.error("Error getting file content:", error);
    throw new Error("Failed to get file content");
  }
}

/**
 * Stream file content directly, with automatic decompression if needed
 */
export async function getFileStream(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  metadata: FileMetadata;
}> {
  try {
    // Get file metadata from Firestore
    const metadata = (await getCrateMetadata(fileId)) as unknown as FileMetadata;
    if (!metadata) {
      throw new Error("File not found");
    }

    // Check if file is compressed - if so, we need to handle differently
    if (metadata.compressed) {
      // For compressed files, download the full content first, decompression it,
      // and then create a stream from the decompressed buffer
      const { buffer } = await getFileContent(fileId);

      // Create a readable stream from the decompressed buffer
      const { Readable } = require("stream");
      const stream = Readable.from(buffer);

      return { stream, metadata };
    }

    // For non-compressed files, stream directly from storage
    const file = bucket.file(metadata.gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File not found in storage");
    }

    // Create a read stream
    const stream = file.createReadStream();

    // Increment download count
    await incrementCrateDownloadCount(fileId);

    return { stream, metadata };
  } catch (error) {
    console.error("Error streaming file:", error);
    throw new Error("Failed to stream file");
  }
}

/**
 * Get a crate's content as a buffer, with automatic decompression if needed
 */
export async function getCrateContent(crateId: string): Promise<{
  buffer: Buffer;
  crate: Crate;
}> {
  try {
    // Get crate metadata from Firestore
    const crate = await getCrateMetadata(crateId);
    if (!crate) {
      throw new Error("Crate not found");
    }

    // Get the file
    const file = bucket.file(crate.gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("Crate not found in storage");
    }

    // Download the file content
    const [content] = await file.download();

    // Check if file is compressed and needs decompression
    const fileMetadata = await file.getMetadata();
    const compressed = fileMetadata[0]?.metadata?.compressed === "true";

    if (compressed) {
      try {
        console.log(`Decompressing crate: ${crate.id}`);
        const decompressedContent = await decompressBuffer(content);

        // Increment download count
        await incrementCrateDownloadCount(crateId);

        return { buffer: decompressedContent, crate };
      } catch (decompressionError) {
        console.error("Error during decompression:", decompressionError);
        // Fall back to returning the compressed content
        return { buffer: content, crate };
      }
    }

    // Increment download count
    await incrementCrateDownloadCount(crateId);

    return { buffer: content, crate };
  } catch (error) {
    console.error("Error getting crate content:", error);
    throw new Error("Failed to get crate content");
  }
}

/**
 * Get the default category for a file based on its extension and MIME type
 */
function getDefaultCategoryForFile(fileName: string, mimeType: string): CrateCategory {
  // First check MIME type
  if (mimeType && MIME_TYPE_TO_CATEGORY[mimeType]) {
    return MIME_TYPE_TO_CATEGORY[mimeType];
  }

  // Then check file extension
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  if (extension && EXTENSION_TO_CATEGORY[extension]) {
    return EXTENSION_TO_CATEGORY[extension];
  }

  // Default to binary if we can't determine the category
  return CrateCategory.BINARY;
}

// Define MIME type to category mappings
const MIME_TYPE_TO_CATEGORY: Record<string, CrateCategory> = {
  "image/png": CrateCategory.IMAGE,
  "image/jpeg": CrateCategory.IMAGE,
  "image/gif": CrateCategory.IMAGE,
  "image/webp": CrateCategory.IMAGE,
  "image/svg+xml": CrateCategory.IMAGE,
  "text/markdown": CrateCategory.MARKDOWN,
  "text/x-markdown": CrateCategory.MARKDOWN,
  "application/json": CrateCategory.JSON, // Changed from CrateCategory.DATA
  "text/csv": CrateCategory.DATA,
  "text/plain": CrateCategory.CODE, // Default text to code
  "application/javascript": CrateCategory.CODE,
  "text/javascript": CrateCategory.CODE,
  "text/html": CrateCategory.CODE,
  "text/css": CrateCategory.CODE,
  // Add more specific code types if needed, e.g.:
  // "application/x-python": CrateCategory.CODE,
  // "application/xml": CrateCategory.CODE,
};

// Define file extension to category mappings
const EXTENSION_TO_CATEGORY: Record<string, CrateCategory> = {
  ".png": CrateCategory.IMAGE,
  ".jpg": CrateCategory.IMAGE,
  ".jpeg": CrateCategory.IMAGE,
  ".gif": CrateCategory.IMAGE,
  ".webp": CrateCategory.IMAGE,
  ".svg": CrateCategory.IMAGE,
  ".md": CrateCategory.MARKDOWN,
  ".markdown": CrateCategory.MARKDOWN,
  ".json": CrateCategory.JSON, // Changed from CrateCategory.DATA
  ".csv": CrateCategory.DATA,
  ".js": CrateCategory.CODE,
  ".ts": CrateCategory.CODE,
  ".html": CrateCategory.CODE,
  ".css": CrateCategory.CODE,
  ".py": CrateCategory.CODE,
  ".java": CrateCategory.CODE,
  ".xml": CrateCategory.CODE,
  ".txt": CrateCategory.CODE, // Default .txt to code
  ".log": CrateCategory.CODE, // Default .log to code
  ".todolist": CrateCategory.TODOLIST,
  ".mmd": CrateCategory.DIAGRAM,
  ".diagram": CrateCategory.DIAGRAM,
  // Add more extensions as needed
};
