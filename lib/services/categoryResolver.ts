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

  // Text/Documentation
  "text/markdown": CrateCategory.TEXT,
  "text/x-markdown": CrateCategory.TEXT,
  "text/plain": CrateCategory.TEXT,

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

  // Text/Documentation
  ".md": CrateCategory.TEXT,
  ".markdown": CrateCategory.TEXT,

  // Recipe/Workflow files - specific extensions that indicate AI task instructions
  ".recipe": CrateCategory.RECIPE,
  ".workflow": CrateCategory.RECIPE,
  ".instructions": CrateCategory.RECIPE,
  ".txt": CrateCategory.TEXT,
  ".doc": CrateCategory.TEXT,
  ".docx": CrateCategory.TEXT,
  ".rtf": CrateCategory.TEXT,

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

  // Chart files -> Images
  ".chart": CrateCategory.IMAGE,
  ".graph": CrateCategory.IMAGE,
  ".plot": CrateCategory.IMAGE,
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

  // Default to text if we can't determine the category
  return CrateCategory.TEXT;
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
