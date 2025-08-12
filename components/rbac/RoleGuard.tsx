"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/lib/types/rbac";
import { isRoleHigherOrEqual } from "@/lib/rbac";

interface RoleGuardProps {
  role: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { role: userRole } = useAuth();

  const hasAccess = isRoleHigherOrEqual(userRole, role);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
