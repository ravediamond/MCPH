"use client";

import { Role } from "@/lib/types/rbac";
import { getRoleDisplayName } from "@/lib/rbac";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

/**
 * Component that displays a user's role as a styled badge
 */
export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const displayName = getRoleDisplayName(role);

  // Define role-specific colors
  const getRoleColor = (role: Role): string => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return "bg-red-100 text-red-800 border-red-200";
      case Role.ADMIN:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case Role.SENIOR_MODERATOR:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case Role.MODERATOR:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case Role.PREMIUM_USER:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case Role.USER:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case Role.SYSTEM:
        return "bg-black text-white border-gray-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const colorClass = getRoleColor(role);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      {displayName}
    </span>
  );
}
