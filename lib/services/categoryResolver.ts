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
  "image/bmp": CrateCategory.IMAGE,
  "image/tiff": CrateCategory.IMAGE,

  // Data files
  "text/csv": CrateCategory.DATA,
  "application/pdf": CrateCategory.DATA,
  "application/vnd.ms-excel": CrateCategory.DATA,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    CrateCategory.DATA,
  "application/json": CrateCategory.DATA,
  "text/x-json": CrateCategory.DATA,
  "application/x-json": CrateCategory.DATA,
  "application/yaml": CrateCategory.DATA,
  "text/yaml": CrateCategory.DATA,
  "text/x-yaml": CrateCategory.DATA,
  "application/x-yaml": CrateCategory.DATA,
  "application/xml": CrateCategory.DATA,
  "text/xml": CrateCategory.DATA,

  // Knowledge/Documentation
  "text/markdown": CrateCategory.KNOWLEDGE,
  "text/x-markdown": CrateCategory.KNOWLEDGE,
  "text/plain": CrateCategory.KNOWLEDGE,

  // Code
  "application/javascript": CrateCategory.CODE,
  "text/javascript": CrateCategory.CODE,
  "text/html": CrateCategory.CODE,
  "text/css": CrateCategory.CODE,
  "text/typescript": CrateCategory.CODE,
  "application/typescript": CrateCategory.CODE,
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
  ".bmp": CrateCategory.IMAGE,
  ".tiff": CrateCategory.IMAGE,
  ".ico": CrateCategory.IMAGE,

  // Data files
  ".csv": CrateCategory.DATA,
  ".pdf": CrateCategory.DATA,
  ".xls": CrateCategory.DATA,
  ".xlsx": CrateCategory.DATA,
  ".json": CrateCategory.DATA,
  ".yaml": CrateCategory.DATA,
  ".yml": CrateCategory.DATA,
  ".xml": CrateCategory.DATA,
  ".parquet": CrateCategory.DATA,
  ".db": CrateCategory.DATA,
  ".sqlite": CrateCategory.DATA,

  // Knowledge/Documentation
  ".md": CrateCategory.KNOWLEDGE,
  ".markdown": CrateCategory.KNOWLEDGE,
  ".txt": CrateCategory.KNOWLEDGE,
  ".doc": CrateCategory.KNOWLEDGE,
  ".docx": CrateCategory.KNOWLEDGE,
  ".rtf": CrateCategory.KNOWLEDGE,

  // Code
  ".js": CrateCategory.CODE,
  ".ts": CrateCategory.CODE,
  ".tsx": CrateCategory.CODE,
  ".jsx": CrateCategory.CODE,
  ".html": CrateCategory.CODE,
  ".css": CrateCategory.CODE,
  ".py": CrateCategory.CODE,
  ".java": CrateCategory.CODE,
  ".cpp": CrateCategory.CODE,
  ".c": CrateCategory.CODE,
  ".go": CrateCategory.CODE,
  ".rs": CrateCategory.CODE,
  ".php": CrateCategory.CODE,
  ".rb": CrateCategory.CODE,
  ".swift": CrateCategory.CODE,
  ".kt": CrateCategory.CODE,
  ".scala": CrateCategory.CODE,
  ".sh": CrateCategory.CODE,
  ".bat": CrateCategory.CODE,
  ".sql": CrateCategory.CODE,
  ".log": CrateCategory.CODE,

  // Visualization
  ".chart": CrateCategory.VISUALIZATION,
  ".graph": CrateCategory.VISUALIZATION,
  ".plot": CrateCategory.VISUALIZATION,
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

  // Default to others if we can't determine the category
  return CrateCategory.OTHERS;
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
