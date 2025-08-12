"use client";

import { useState } from "react";
import { Role, UserRole } from "@/lib/types/rbac";
import { getRoleDisplayName, getAssignableRoles } from "@/lib/rbac";
import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge } from "./RoleBadge";

interface RoleManagerProps {
  userRole: UserRole;
  onRoleChange: (userId: string, newRole: Role) => Promise<boolean>;
  onRoleRemove: (userId: string) => Promise<boolean>;
}

/**
 * Component for managing user roles (admin only)
 */
export function RoleManager({
  userRole,
  onRoleChange,
  onRoleRemove,
}: RoleManagerProps) {
  const { role: currentUserRole } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(userRole.role);

  const assignableRoles = getAssignableRoles(currentUserRole);
  const canManageRole = assignableRoles.includes(userRole.role);

  const handleRoleChange = async () => {
    if (selectedRole === userRole.role) return;

    setIsChangingRole(true);
    try {
      const success = await onRoleChange(userRole.userId, selectedRole);
      if (!success) {
        setSelectedRole(userRole.role); // Reset on failure
      }
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleRoleRemove = async () => {
    setIsChangingRole(true);
    try {
      await onRoleRemove(userRole.userId);
    } finally {
      setIsChangingRole(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-white">
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          User ID: {userRole.userId}
        </div>
        <div className="text-sm text-gray-500">
          Assigned: {userRole.assignedAt.toDateString()}
        </div>
        <div className="text-sm text-gray-500">By: {userRole.assignedBy}</div>
      </div>

      <div className="flex items-center space-x-2">
        <RoleBadge role={userRole.role} />

        {canManageRole && (
          <>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              disabled={isChangingRole}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>

            <button
              onClick={handleRoleChange}
              disabled={isChangingRole || selectedRole === userRole.role}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingRole ? "Updating..." : "Update"}
            </button>

            <button
              onClick={handleRoleRemove}
              disabled={isChangingRole}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingRole ? "Removing..." : "Remove"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
