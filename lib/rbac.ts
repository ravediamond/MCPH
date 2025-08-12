// RBAC Utility Functions

import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  PermissionContext,
  FirebaseCustomClaims,
} from "./types/rbac";

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user has a specific permission based on their role
 */
export function hasPermission(
  userRole: Role | undefined,
  permission: Permission,
  context?: PermissionContext,
): boolean {
  if (!userRole) return false;

  // Check direct permission
  if (roleHasPermission(userRole, permission)) {
    // For resource-specific permissions, check ownership
    if (context?.resourceOwnerId && context?.userId) {
      const isOwner = context.resourceOwnerId === context.userId;

      // If permission is for "own" resources, user must be owner
      if (permission.includes(":own")) {
        return isOwner;
      }

      // If permission is for "any" resources, allow if user has permission
      if (permission.includes(":any")) {
        return true;
      }

      // For non-specific permissions on owned resources, allow
      if (isOwner && !permission.includes(":any")) {
        return true;
      }
    }

    return true;
  }

  return false;
}

/**
 * Check if a user can perform an action on a specific resource
 */
export function canAccessResource(
  userRole: Role | undefined,
  userId: string,
  resourceOwnerId: string,
  requiredPermission: Permission,
): boolean {
  return hasPermission(userRole, requiredPermission, {
    userId,
    resourceOwnerId,
  });
}

/**
 * Get the highest role between two roles
 */
export function getHigherRole(role1: Role, role2: Role): Role {
  const hierarchy1 = ROLE_HIERARCHY[role1] || 0;
  const hierarchy2 = ROLE_HIERARCHY[role2] || 0;
  return hierarchy1 >= hierarchy2 ? role1 : role2;
}

/**
 * Check if one role is higher than another
 */
export function isRoleHigher(role1: Role, role2: Role): boolean {
  const hierarchy1 = ROLE_HIERARCHY[role1] || 0;
  const hierarchy2 = ROLE_HIERARCHY[role2] || 0;
  return hierarchy1 > hierarchy2;
}

/**
 * Check if one role is higher or equal to another
 */
export function isRoleHigherOrEqual(role1: Role, role2: Role): boolean {
  const hierarchy1 = ROLE_HIERARCHY[role1] || 0;
  const hierarchy2 = ROLE_HIERARCHY[role2] || 0;
  return hierarchy1 >= hierarchy2;
}

/**
 * Convert Firebase custom claims to role and permissions
 */
export function parseCustomClaims(claims: FirebaseCustomClaims): {
  role: Role;
  permissions: Permission[];
} {
  // Handle legacy admin claim
  if (claims.admin && !claims.role) {
    return {
      role: Role.ADMIN,
      permissions: getRolePermissions(Role.ADMIN),
    };
  }

  const role = claims.role || Role.USER;
  const permissions = claims.permissions || getRolePermissions(role);

  return { role, permissions };
}

/**
 * Create Firebase custom claims from role
 */
export function createCustomClaims(
  role: Role,
  customPermissions?: Permission[],
): FirebaseCustomClaims {
  const rolePermissions = getRolePermissions(role);
  const permissions = customPermissions || rolePermissions;

  return {
    role,
    permissions,
    admin: isRoleHigherOrEqual(role, Role.ADMIN), // Keep for backward compatibility
  };
}

/**
 * Validate if a user can assign a role to another user
 */
export function canAssignRole(assignerRole: Role, targetRole: Role): boolean {
  // Users can only assign roles lower than their own
  // Super admins can assign any role except SYSTEM
  if (assignerRole === Role.SUPER_ADMIN) {
    return targetRole !== Role.SYSTEM;
  }

  return isRoleHigher(assignerRole, targetRole);
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(assignerRole: Role): Role[] {
  return Object.values(Role).filter((role) =>
    canAssignRole(assignerRole, role),
  );
}

/**
 * Check if user is admin (backward compatibility)
 */
export function isAdmin(role: Role): boolean {
  return isRoleHigherOrEqual(role, Role.ADMIN);
}

/**
 * Get user-friendly role name
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    [Role.USER]: "User",
    [Role.PREMIUM_USER]: "Premium User",
    [Role.MODERATOR]: "Moderator",
    [Role.SENIOR_MODERATOR]: "Senior Moderator",
    [Role.ADMIN]: "Administrator",
    [Role.SUPER_ADMIN]: "Super Administrator",
    [Role.SYSTEM]: "System",
  };

  return displayNames[role] || role;
}

/**
 * Get user-friendly permission name
 */
export function getPermissionDisplayName(permission: Permission): string {
  return permission
    .replace(/:/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
