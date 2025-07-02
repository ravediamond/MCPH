/**
 * CategoryResolver module for determining file categories based on content type and extension
 * Responsible for mapping files to appropriate category enums
 */
import { CrateCategory } from "../../shared/types/crate";

/**
 * Mapping of MIME types to crate categories
 */
const MIME_TYPE_TO_CATEGORY: Record<string, CrateCategory> = {
  // Images
  "image/png": CrateCategory.IMAGE,
  "image/jpeg": CrateCategory.IMAGE,
  "image/gif": CrateCategory.IMAGE,
  "image/webp": CrateCategory.IMAGE,
  "image/svg+xml": CrateCategory.IMAGE,

  // Markdown
  "text/markdown": CrateCategory.MARKDOWN,
  "text/x-markdown": CrateCategory.MARKDOWN,

  // JSON
  "application/json": CrateCategory.JSON,
  "text/x-json": CrateCategory.JSON,
  "application/x-json": CrateCategory.JSON,

  // YAML
  "application/yaml": CrateCategory.YAML,
  "text/yaml": CrateCategory.YAML,
  "text/x-yaml": CrateCategory.YAML,
  "application/x-yaml": CrateCategory.YAML,

  // Code
  "text/csv": CrateCategory.CODE,
  "application/javascript": CrateCategory.CODE,
  "text/javascript": CrateCategory.CODE,
  "text/html": CrateCategory.CODE,
  "text/css": CrateCategory.CODE,
  "text/typescript": CrateCategory.CODE,
  "application/typescript": CrateCategory.CODE,
  "application/xml": CrateCategory.CODE,
  "text/xml": CrateCategory.CODE,

  // Text
  "text/plain": CrateCategory.TEXT,
};

/**
 * Mapping of file extensions to crate categories
 */
const EXTENSION_TO_CATEGORY: Record<string, CrateCategory> = {
  // Images
  ".png": CrateCategory.IMAGE,
  ".jpg": CrateCategory.IMAGE,
  ".jpeg": CrateCategory.IMAGE,
  ".gif": CrateCategory.IMAGE,
  ".webp": CrateCategory.IMAGE,
  ".svg": CrateCategory.IMAGE,

  // Markdown
  ".md": CrateCategory.MARKDOWN,
  ".markdown": CrateCategory.MARKDOWN,

  // JSON
  ".json": CrateCategory.JSON,

  // YAML
  ".yaml": CrateCategory.YAML,
  ".yml": CrateCategory.YAML,

  // Code
  ".csv": CrateCategory.CODE,
  ".js": CrateCategory.CODE,
  ".ts": CrateCategory.CODE,
  ".html": CrateCategory.CODE,
  ".css": CrateCategory.CODE,
  ".py": CrateCategory.CODE,
  ".java": CrateCategory.CODE,
  ".xml": CrateCategory.CODE,
  ".log": CrateCategory.CODE,

  // Text
  ".txt": CrateCategory.TEXT,
  ".tsx": CrateCategory.CODE,
  ".jsx": CrateCategory.CODE,
};

/**
 * Determine the appropriate category for a file based on its MIME type and filename
 * @param fileName - The name of the file
 * @param contentType - The MIME type of the file
 * @returns The resolved category
 */
export function resolveCategory(
  fileName: string,
  contentType: string,
): CrateCategory {
  // First check MIME type
  if (contentType && MIME_TYPE_TO_CATEGORY[contentType]) {
    return MIME_TYPE_TO_CATEGORY[contentType];
  }

  // Then check file extension
  const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  if (extension && EXTENSION_TO_CATEGORY[extension]) {
    return EXTENSION_TO_CATEGORY[extension];
  }

  // Default to binary if we can't determine the category
  return CrateCategory.BINARY;
}

/**
 * Get all recognized MIME types for a specific category
 * @param category - The category to get MIME types for
 * @returns Array of MIME types for the category
 */
export function getMimeTypesForCategory(category: CrateCategory): string[] {
  return Object.entries(MIME_TYPE_TO_CATEGORY)
    .filter(([_, value]) => value === category)
    .map(([key]) => key);
}
