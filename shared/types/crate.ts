export enum CrateCategory {
  RECIPE = "recipe",
  TEXT = "text",
  IMAGE = "image",
  CODE = "code",
  DATA = "data",
  POLL = "poll",
}

export interface CrateSharing {
  public: boolean;
  passwordHash?: string | null;
}

export interface Crate {
  id: string; // Firestore doc ID (also GCS object key)
  title: string; // User-supplied title
  description?: string; // Optional longer description
  ownerId: string; // UID of uploader
  createdAt: Date; // Timestamp when created
  mimeType: string; // e.g. "text/markdown", "image/png"
  category: CrateCategory; // One of the supported content categories
  gcsPath: string; // GCS object path (e.g. "crates/{id}")
  shared: CrateSharing; // Access control information
  tags?: string[]; // Optional user tags
  searchField?: string; // title + tags + description (for hybrid search)
  size: number; // File size in bytes
  downloadCount: number; // Number of times the crate was downloaded
  fileName: string; // Original filename of the uploaded file
  expiresAt?: Date; // Optional expiration date, used for anonymous uploads (30 days)

  // Optional metadata
  metadata?: Record<string, string>; // Key-value user metadata
}
