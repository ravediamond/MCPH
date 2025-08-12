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

export interface AccessHistoryEntry {
  date: string; // YYYY-MM-DD format
  views: number; // View count for this day
  downloads: number; // Download count for this day
}

export enum AuditEventType {
  // Authentication events
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  API_KEY_CREATED = "API_KEY_CREATED",
  API_KEY_DELETED = "API_KEY_DELETED",

  // Crate operations
  CRATE_CREATED = "CRATE_CREATED",
  CRATE_UPDATED = "CRATE_UPDATED",
  CRATE_DELETED = "CRATE_DELETED",
  CRATE_VIEWED = "CRATE_VIEWED",
  CRATE_DOWNLOADED = "CRATE_DOWNLOADED",
  CRATE_SHARED = "CRATE_SHARED",
  CRATE_UNSHARED = "CRATE_UNSHARED",
  CRATE_COPIED = "CRATE_COPIED",

  // Admin operations
  USER_ROLE_ASSIGNED = "USER_ROLE_ASSIGNED",
  USER_ROLE_REMOVED = "USER_ROLE_REMOVED",
  USER_DISABLED = "USER_DISABLED",
  USER_ENABLED = "USER_ENABLED",
  ADMIN_CRATE_DELETED = "ADMIN_CRATE_DELETED",

  // MCP operations
  MCP_TOOL_CALLED = "MCP_TOOL_CALLED",
  MCP_CLIENT_REGISTERED = "MCP_CLIENT_REGISTERED",

  // Security events
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
}

export enum AuditSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;

  // Request context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;

  // Resource context
  resourceId?: string;
  resourceType?: string;
  resourceOwner?: string;

  // Event details
  action: string; // Human readable action description
  details?: Record<string, any>; // Additional event-specific data
  metadata?: Record<string, any>; // System metadata

  // Result
  success: boolean;
  errorMessage?: string;

  // MCP specific
  mcpTool?: string;
  mcpClientId?: string;
  apiKeyId?: string;
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
  viewCount?: number; // Number of times the crate was viewed
  fileName: string; // Original filename of the uploaded file
  expiresAt?: Date; // Optional expiration date, used for anonymous uploads (30 days)
  accessHistory?: AccessHistoryEntry[]; // Daily access statistics

  // Optional metadata
  metadata?: Record<string, string>; // Key-value user metadata
}
