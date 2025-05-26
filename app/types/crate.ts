/**
 * Crate schema - Unified metadata format for all uploaded content
 */

/**
 * Supported content categories and their rendering strategy
 */
export enum CrateCategory {
    MARKDOWN = "markdown",     // Render via Markdown viewer
    TODOLIST = "todolist",     // Render in custom To-Do-List component
    DIAGRAM = "diagram",       // Render in Mermaid (or equivalent) diagram viewer
    DATA = "data",             // Display as table or JSON tree
    CODE = "code",             // Syntax-highlighted code block
    IMAGE = "image",           // Inline <img> preview + download button
    JSON = "json",             // Render as JSON tree or raw JSON
    BINARY = "binary"          // Show only "Download via signed URL" button
}

/**
 * Access Control List (ACL) for a Crate
 */
export interface CrateSharing {
    public: boolean;            // Open link ACL
    sharedWith?: string[];      // Explicit UIDs allowed
    passwordProtected?: boolean; // Whether download is password-guarded
}

/**
 * Crate metadata schema - represents a unified document for all uploaded files
 */
export interface Crate {
    id: string;                // Firestore doc ID (also GCS object key)
    title: string;             // User-supplied title
    description?: string;      // Optional longer description
    ownerId: string;           // UID of uploader
    createdAt: Date;           // Timestamp when created
    ttlDays: number;           // "time-to-live" in days
    mimeType: string;          // e.g. "text/markdown", "image/png"
    category: CrateCategory;   // One of the supported content categories
    gcsPath: string;           // GCS object path (e.g. "crates/{id}")
    shared: CrateSharing;      // Access control information
    tags?: string[];           // Optional user tags
    searchField?: string;      // title + tags + description (for hybrid search)
    size: number;              // File size in bytes
    downloadCount: number;     // Number of times the crate was downloaded

    // Optional metadata
    metadata?: Record<string, string>;  // Key-value user metadata
    compressed?: boolean;
    compressionRatio?: number;
}