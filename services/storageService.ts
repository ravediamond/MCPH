import { v4 as uuidv4 } from "uuid";
import { bucket } from "../lib/gcpStorageClient";
import { Crate, CrateCategory, CrateSharing } from "../shared/types/crate";
import { logEvent, deleteCrateMetadata } from "./firebaseService";

// Import our new modular services
import {
  generateSignedUploadUrl,
  generateSignedDownloadUrl,
  saveCrateMetadata,
  getCrateMetadata,
  resolveCategory,
} from "../lib/services";

// Re-export metadata functions for backward compatibility
export { saveCrateMetadata, getCrateMetadata };

export interface FileMetadata {
  id: string;
  fileName: string;
  title: string;
  description?: string;
  contentType: string;
  size: number;
  fileType?: string;
  gcsPath: string;
  uploadedAt: Date;
  expiresAt?: Date;
  downloadCount: number;
  ipAddress?: string;
  userId?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a crate with presigned URL capability
 * This is the unified upload function for all crates
 */
export async function uploadCrate(
  fileBuffer: Buffer | null,
  fileName: string,
  contentType: string,
  crateData: Partial<Crate>,
): Promise<Crate & { presignedUrl?: string }> {
  try {
    // Generate a unique ID for the crate
    const crateId = crateData.id || uuidv4();

    // Generate a presigned URL for client-side uploads if no buffer is provided
    let gcsPath = "";
    let presignedUrl: string | undefined = undefined;
    let fileSize = 0;

    if (!fileBuffer) {
      // Generate presigned URL for client-side upload using our Signer module
      const presignedUrlData = await generateSignedUploadUrl(
        crateId,
        fileName,
        contentType,
      );
      gcsPath = presignedUrlData.gcsPath;
      presignedUrl = presignedUrlData.url;
    } else {
      // Server-side upload with the provided buffer
      gcsPath = `crates/${crateId}/${encodeURIComponent(fileName)}`;

      // Create a GCS file object
      const file = bucket.file(gcsPath);

      // Use the original buffer
      let bufferToSave = fileBuffer;

      fileSize = bufferToSave.length;

      // Upload the file with metadata
      await file.save(bufferToSave, {
        metadata: {
          contentType,
          metadata: {
            crateId,
            originalName: fileName,
            title: crateData.title || fileName,
            ...(crateData.description && {
              description: crateData.description,
            }),
            ...(crateData.category && { category: crateData.category }),
          },
        },
        resumable: false,
      });
    }

    // Create the searchField for hybrid search
    const metaString = crateData.metadata
      ? Object.entries(crateData.metadata)
          .map(([k, v]) => `${k} ${v}`)
          .join(" ")
      : "";

    const tagsString = Array.isArray(crateData.tags) ? crateData.tags.join(" ") : "";
    const searchField = [
      crateData.title || fileName,
      crateData.description || "",
      tagsString,
      metaString,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Create default sharing config if not provided
    const sharing: CrateSharing = crateData.shared || {
      public: false,
      passwordProtected: false, // Ensure this is explicitly false if not set
    };

    // If passwordHash and passwordSalt are provided in crateData.shared, use them
    if (crateData.shared?.passwordHash && crateData.shared?.passwordSalt) {
      sharing.passwordHash = crateData.shared.passwordHash;
      sharing.passwordSalt = crateData.shared.passwordSalt;
      sharing.passwordProtected = true; // Ensure this is true if hash/salt are present
    }

    // Create the complete crate metadata
    const completeCrate: Crate = {
      id: crateId,
      title: crateData.title || fileName,
      description: crateData.description,
      ownerId: crateData.ownerId || "anonymous",
      createdAt: new Date(),
      mimeType: contentType,
      category: crateData.category || resolveCategory(fileName, contentType),
      gcsPath: gcsPath,
      shared: sharing,
      tags: crateData.tags || [], // Ensure tags is an array, not undefined
      searchField,
      size: fileSize,
      downloadCount: 0,
      metadata: crateData.metadata || {}, // Ensure metadata is an object, not undefined
      fileName: fileName, // Add the fileName field
      // No compression metadata - compression is disabled
    };

    // Store metadata in Firestore
    await saveCrateMetadata(completeCrate);

    // Log the upload event
    await logEvent("crate_upload", crateId);

    // Return the crate data with presigned URL if applicable
    return presignedUrl ? { ...completeCrate, presignedUrl } : completeCrate;
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

    // Generate signed download URL using our Signer module
    const url = await generateSignedDownloadUrl(
      gcsPath,
      actualFileName,
      expiresInMinutes,
    );

    // Increment download count by calling getCrateMetadata with increment flag
    await getCrateMetadata(fileId, true);

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
 * Get a file's content as a buffer
 */
export async function getFileContent(fileId: string): Promise<{
  buffer: Buffer;
  metadata: FileMetadata;
}> {
  try {
    // Get file metadata from Firestore
    const metadata = (await getCrateMetadata(
      fileId,
    )) as unknown as FileMetadata;
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

    console.log(
      `Retrieved file: ${metadata.fileName} - Size: ${content.length} bytes`,
    );

    // Increment download count
    await getCrateMetadata(fileId, true);

    return { buffer: content, metadata };
  } catch (error) {
    console.error("Error getting file content:", error);
    throw new Error("Failed to get file content");
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
    const metadata = (await getCrateMetadata(
      fileId,
    )) as unknown as FileMetadata;
    if (!metadata) {
      throw new Error("File not found");
    }

    // Stream directly from storage
    const file = bucket.file(metadata.gcsPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File not found in storage");
    }

    // Create a read stream
    const stream = file.createReadStream();

    // Increment download count
    await getCrateMetadata(fileId, true);

    return { stream, metadata };
  } catch (error) {
    console.error("Error streaming file:", error);
    throw new Error("Failed to stream file");
  }
}

/**
 * Get a crate's content as a buffer
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

    console.log(`Retrieved crate: ${crate.id} - Size: ${content.length} bytes`);

    // Increment download count
    await getCrateMetadata(crateId, true);

    return { buffer: content, crate };
  } catch (error) {
    console.error("Error getting crate content:", error);
    throw new Error("Failed to get crate content");
  }
}

/**
 * Generate a pre-signed upload URL for a crate
 * This is used for client-side uploads of large files
 */
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  ttlDays?: number,
): Promise<{ url: string; fileId: string; gcsPath: string }> {
  try {
    // Generate a unique file ID
    const fileId = uuidv4();

    // Generate the GCS path
    const gcsPath = `crates/${fileId}/${encodeURIComponent(fileName)}`;

    // Generate a pre-signed URL for upload using the signer module
    const { url } = await generateSignedUploadUrl(fileId, fileName, contentType);

    // Return the URL, file ID, and GCS path
    return { url, fileId, gcsPath };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}

/**
 * Delete a crate from storage and metadata
 * Wrapper around deleteFile to maintain API compatibility
 */
export async function deleteCrate(crateId: string, userId?: string): Promise<boolean> {
  try {
    // Get crate metadata
    const crate = await getCrateMetadata(crateId);
    if (!crate) {
      return false;
    }

    // Check if the user has permission to delete this crate
    if (userId && crate.ownerId !== userId && crate.ownerId !== "anonymous") {
      console.warn(`User ${userId} attempted to delete crate ${crateId} owned by ${crate.ownerId}`);
      return false;
    }

    // Use the existing deleteFile function
    const result = await deleteFile(crateId);
    
    // Log the deletion event with user info
    if (result) {
      await logEvent("crate_delete", crateId, undefined, { userId });
    }
    
    return result;
  } catch (error) {
    console.error("Error deleting crate:", error);
    return false;
  }
}
