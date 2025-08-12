// RBAC (Role-Based Access Control) Types

export enum Permission {
  // User permissions
  USER_READ_PROFILE = "user:read:profile",
  USER_UPDATE_PROFILE = "user:update:profile",

  // Crate permissions
  CRATE_CREATE = "crate:create",
  CRATE_READ_OWN = "crate:read:own",
  CRATE_READ_ANY = "crate:read:any",
  CRATE_UPDATE_OWN = "crate:update:own",
  CRATE_UPDATE_ANY = "crate:update:any",
  CRATE_DELETE_OWN = "crate:delete:own",
  CRATE_DELETE_ANY = "crate:delete:any",
  CRATE_SHARE_OWN = "crate:share:own",
  CRATE_SHARE_ANY = "crate:share:any",

  // Admin permissions
  ADMIN_USERS_READ = "admin:users:read",
  ADMIN_USERS_UPDATE = "admin:users:update",
  ADMIN_USERS_DELETE = "admin:users:delete",
  ADMIN_SYSTEM_READ = "admin:system:read",
  ADMIN_SYSTEM_UPDATE = "admin:system:update",
  ADMIN_ANALYTICS_READ = "admin:analytics:read",

  // API Key permissions
  API_KEY_CREATE = "api_key:create",
  API_KEY_READ_OWN = "api_key:read:own",
  API_KEY_READ_ANY = "api_key:read:any",
  API_KEY_DELETE_OWN = "api_key:delete:own",
  API_KEY_DELETE_ANY = "api_key:delete:any",

  // Moderation permissions
  MODERATION_CONTENT_REVIEW = "moderation:content:review",
  MODERATION_CONTENT_REMOVE = "moderation:content:remove",
  MODERATION_USER_SUSPEND = "moderation:user:suspend",
}

export enum Role {
  // Basic user roles
  USER = "user",
  PREMIUM_USER = "premium_user",

  // Moderation roles
  MODERATOR = "moderator",
  SENIOR_MODERATOR = "senior_moderator",

  // Admin roles
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",

  // System roles
  SYSTEM = "system",
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.USER_READ_PROFILE,
    Permission.USER_UPDATE_PROFILE,
    Permission.CRATE_CREATE,
    Permission.CRATE_READ_OWN,
    Permission.CRATE_UPDATE_OWN,
    Permission.CRATE_DELETE_OWN,
    Permission.CRATE_SHARE_OWN,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ_OWN,
    Permission.API_KEY_DELETE_OWN,
  ],

  [Role.PREMIUM_USER]: [
    ...ROLE_PERMISSIONS[Role.USER],
    // Premium users get same permissions as regular users for now
    // Can be extended with premium features later
  ],

  [Role.MODERATOR]: [
    ...ROLE_PERMISSIONS[Role.USER],
    Permission.CRATE_READ_ANY,
    Permission.MODERATION_CONTENT_REVIEW,
    Permission.MODERATION_CONTENT_REMOVE,
  ],

  [Role.SENIOR_MODERATOR]: [
    ...ROLE_PERMISSIONS[Role.MODERATOR],
    Permission.MODERATION_USER_SUSPEND,
    Permission.CRATE_UPDATE_ANY,
  ],

  [Role.ADMIN]: [
    ...ROLE_PERMISSIONS[Role.SENIOR_MODERATOR],
    Permission.ADMIN_USERS_READ,
    Permission.ADMIN_USERS_UPDATE,
    Permission.ADMIN_SYSTEM_READ,
    Permission.ADMIN_ANALYTICS_READ,
    Permission.API_KEY_READ_ANY,
    Permission.CRATE_DELETE_ANY,
  ],

  [Role.SUPER_ADMIN]: [
    ...ROLE_PERMISSIONS[Role.ADMIN],
    Permission.ADMIN_USERS_DELETE,
    Permission.ADMIN_SYSTEM_UPDATE,
    Permission.API_KEY_DELETE_ANY,
    Permission.CRATE_SHARE_ANY,
  ],

  [Role.SYSTEM]: [
    // System role has all permissions
    ...Object.values(Permission),
  ],
};

// User role information
export interface UserRole {
  userId: string;
  role: Role;
  assignedBy: string; // User ID who assigned this role
  assignedAt: Date;
  expiresAt?: Date; // Optional expiration
  isActive: boolean;
}

// Permission check context
export interface PermissionContext {
  userId?: string;
  resourceOwnerId?: string;
  resourceId?: string;
  organizationId?: string;
}

// Role hierarchy - higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.PREMIUM_USER]: 2,
  [Role.MODERATOR]: 3,
  [Role.SENIOR_MODERATOR]: 4,
  [Role.ADMIN]: 5,
  [Role.SUPER_ADMIN]: 6,
  [Role.SYSTEM]: 7,
};

// Firebase custom claims structure
export interface FirebaseCustomClaims {
  role?: Role;
  permissions?: Permission[];
  admin?: boolean; // Keep for backward compatibility
}
