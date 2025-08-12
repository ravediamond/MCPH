"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Permission } from "@/lib/types/rbac";

interface PermissionGuardProps {
  permission: Permission;
  resourceOwnerId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
  permission,
  resourceOwnerId,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  const hasAccess = hasPermission(permission, { resourceOwnerId });

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
