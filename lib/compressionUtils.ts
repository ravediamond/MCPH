import { promisify } from "util";
import { gzip, gunzip } from "zlib";

// Convert callback-based zlib methods to Promise-based
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Content types that should be compressed when stored
 */
export const COMPRESSIBLE_CONTENT_TYPES = [
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
  // Office document formats
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/msword", // .doc
  "application/vnd.ms-excel", // .xls
  "application/vnd.ms-powerpoint", // .ppt
  // PDF format
  "application/pdf",
  // Other compressible formats
  "application/zip", // Already compressed, but might have uncompressed content
  "image/svg+xml", // SVG is XML-based and compressible
  "application/xhtml+xml",
  "application/rtf",
];

/**
 * File extensions that should be compressed when stored
 */
export const COMPRESSIBLE_EXTENSIONS = [
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
  // Office document formats
  ".docx",
  ".xlsx",
  ".pptx",
  ".doc",
  ".xls",
  ".ppt",
  // PDF format
  ".pdf",
  // Other compressible formats
  ".rtf",
  ".svg",
  ".xhtml",
];

/**
 * Check if content should be compressed based on contentType or filename
 * @param contentType - The MIME type of the content
 * @param fileName - The file name (used to check extension if contentType is not recognized)
 */
export function shouldCompress(contentType: string, fileName: string): boolean {
  // Check by content type
  if (COMPRESSIBLE_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return true;
  }

  // If content type doesn't match, check by file extension
  const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return COMPRESSIBLE_EXTENSIONS.includes(fileExt);
}

/**
 * Compress a buffer using gzip
 * @param buffer - The buffer to compress
 * @returns The compressed buffer and metadata object with compression info
 */
export async function compressBuffer(buffer: Buffer): Promise<{
  compressedBuffer: Buffer;
  compressionMetadata: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressionMethod: string;
  };
}> {
  const originalSize = buffer.length;
  const compressedBuffer = await gzipAsync(buffer);
  const compressedSize = compressedBuffer.length;
  const compressionRatio =
    originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

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
 * @returns The decompressed buffer
 */
export async function decompressBuffer(buffer: Buffer): Promise<Buffer> {
  return await gunzipAsync(buffer);
}
