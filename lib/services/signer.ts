/**
 * Signer module for generating pre-signed URLs for GCS
 * Responsible for URL generation and GCS path creation
 */
import { bucket } from "../gcpStorageClient";

/**
 * Result of generating a pre-signed URL
 */
export interface SignedUrlResult {
  url: string; // The pre-signed URL for upload
  gcsPath: string; // The GCS path where the file will be stored
}

/**
 * Generate a pre-signed URL for uploading a file directly to GCS
 * @param fileId - Unique ID for the file (typically a UUID)
 * @param fileName - Original file name
 * @param contentType - MIME type of the content
 * @param expiresInMinutes - URL expiration time in minutes (defaults to 15 minutes)
 * @returns Object containing the signed URL and GCS path
 */
export async function generateSignedUploadUrl(
  fileId: string,
  fileName: string,
  contentType: string,
  expiresInMinutes: number = 15,
): Promise<SignedUrlResult> {
  try {
    // Generate GCS path for the file
    const gcsPath = `crates/${fileId}/${encodeURIComponent(fileName)}`;

    // Create a GCS file object
    const file = bucket.file(gcsPath);

    // Generate a signed URL for uploads
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      contentType,
      extensionHeaders: {
        "x-goog-content-length-range": "0,104857600", // Limit to 100MB
      },
    });

    return { url, gcsPath };
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    if (
      error.message &&
      error.message.includes("Cannot sign data without `client_email`")
    ) {
      throw new Error(
        "Failed to generate upload URL due to a signing error. " +
          "This usually means the GCS client is missing `client_email` or `private_key` in its credentials.",
      );
    }
    throw new Error(
      "Failed to generate upload URL. Original error: " +
        (error.message || "Unknown error"),
    );
  }
}

/**
 * Generate a signed download URL for a file
 * @param gcsPath - The GCS path where the file is stored
 * @param fileName - The file name to use in the Content-Disposition header
 * @param expiresInMinutes - URL expiration time in minutes (defaults to 60 minutes)
 * @returns Signed download URL
 */
export async function generateSignedDownloadUrl(
  gcsPath: string,
  fileName: string,
  expiresInMinutes: number = 60,
): Promise<string> {
  try {
    // Create a GCS file object
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
      responseDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    return url;
  } catch (error) {
    console.error("Error generating signed download URL:", error);
    throw new Error("Failed to generate download link");
  }
}
