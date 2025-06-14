/**
 * FileOps module for handling file operations like compression and decompression
 * Responsible for optimizing file storage and retrieval
 */
import { promisify } from "util";
import { gzip, gunzip } from "zlib";

// Convert callback-based zlib methods to Promise-based
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Result of a compression operation
 */
export interface CompressionResult {
  compressedBuffer: Buffer;
  compressionMetadata: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressionMethod: string;
  };
}

/**
 * Compress a buffer using gzip and determines if compression should be applied
 * @param buffer - The buffer to compress
 * @param contentType - MIME type of the file
 * @param fileName - Name of the file
 * @returns Promise resolving to the compression result or null if compression should not be applied
 */
export async function compressBuffer(
  buffer: Buffer,
  contentType?: string,
  fileName?: string
): Promise<CompressionResult | null> {
  // If contentType and fileName are provided, check if we should compress
  if (contentType && fileName && !shouldCompress(contentType, fileName)) {
    return null;
  }

  const originalSize = buffer.length;
  const compressedBuffer = await gzipAsync(buffer);
  const compressedSize = compressedBuffer.length;
  const compressionRatio =
    originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

  // If compression doesn't save at least 5%, return null
  if (compressionRatio < 5) {
    return null;
  }

  return {
    compressedBuffer,
    compressionMetadata: {
      originalSize,
      compressedSize,
      compressionRatio,
      compressionMethod: "gzip",
    },
  };
}

/**
 * Decompress a gzipped buffer
 * @param buffer - The compressed buffer
 * @returns Promise resolving to the decompressed buffer
 */
export async function decompressBuffer(buffer: Buffer): Promise<Buffer> {
  return await gunzipAsync(buffer);
}

/**
 * Determine if a file should be compressed based on content type and file name
 * This is a private helper function not exported from the module
 */
function shouldCompress(contentType: string, fileName: string): boolean {
  // Check by content type
  if (COMPRESSIBLE_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return true;
  }

  // If content type doesn't match, check by file extension
  const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return COMPRESSIBLE_EXTENSIONS.includes(fileExt);
}

/**
 * Content types that should be compressed when stored
 */
const COMPRESSIBLE_CONTENT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/html",
  "text/css",
  "text/javascript",
  "text/csv",
  "text/xml",
  "application/json",
  "application/ld+json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-yaml",
  "application/yaml",
  "application/pdf",
  "image/svg+xml",
];

/**
 * File extensions that should be compressed when stored
 */
const COMPRESSIBLE_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".json",
  ".csv",
  ".xml",
  ".ts",
  ".tsx",
  ".jsx",
  ".yaml",
  ".yml",
  ".pdf",
  ".svg",
];
