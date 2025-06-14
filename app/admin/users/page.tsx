"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLogin?: string;
  isAdmin: boolean;
  isDisabled: boolean;
  cratesCount?: number;
  mcpCallsCount?: number;
  lastActive?: string;
  storageUsed?: number;
}

const AdminUsersPage: React.FC = () => {
  const { user, isAdmin, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdminsOnly, setShowAdminsOnly] = useState(false);
  const [showDisabledOnly, setShowDisabledOnly] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check authentication and admin status
  useEffect(() => {
    if (!loading && !user) {
      router.push("/home");
    } else if (!loading && user && !isAdmin) {
      router.push("/home");
      alert("Access denied. You are not an admin.");
    }
  }, [user, isAdmin, loading, router]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await getIdToken();
        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        console.error("Error fetching users:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, user, getIdToken]);

  // Filter users based on search and filters
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.email?.toLowerCase().includes(lowerSearchTerm) ||
          user.displayName?.toLowerCase().includes(lowerSearchTerm) ||
          user.uid.toLowerCase().includes(lowerSearchTerm),
      );
    }

    // Apply admin filter
    if (showAdminsOnly) {
      result = result.filter((user) => user.isAdmin);
    }

    // Apply disabled filter
    if (showDisabledOnly) {
      result = result.filter((user) => user.isDisabled);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, showAdminsOnly, showDisabledOnly]);

  // Toggle user admin status
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "revoke" : "grant"} admin rights for this user?`,
      )
    ) {
      return;
    }

    setActionInProgress(userId);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(`/api/admin/users/${userId}/admin-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update admin status");
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.uid === userId ? { ...u, isAdmin: !currentStatus } : u,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update admin status",
      );
      console.error("Error updating admin status:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle user disabled status
  const toggleDisabledStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "enable" : "disable"} this user?`,
      )
    ) {
      return;
    }

    setActionInProgress(userId);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      const response = await fetch(
        `/api/admin/users/${userId}/disabled-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isDisabled: !currentStatus }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update disabled status");
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.uid === userId ? { ...u, isDisabled: !currentStatus } : u,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user status",
      );
      console.error("Error updating user status:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Show user details
  const openUserDetails = (user: User) => {
    setSelectedUser(user);
  };

  // Close user details modal
  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  if (loading) {
    return <p>Loading user data...</p>;
  }

  if (!user || !isAdmin) {
    return <p>Access Denied. Redirecting...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {/* Navigation */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Users
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by email, name, or ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                  checked={showAdminsOnly}
                  onChange={() => setShowAdminsOnly(!showAdminsOnly)}
                />
                <span className="ml-2 text-gray-700">Admins Only</span>
              </label>
            </div>

            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                  checked={showDisabledOnly}
                  onChange={() => setShowDisabledOnly(!showDisabledOnly)}
                />
                <span className="ml-2 text-gray-700">Disabled Users</span>
              </label>
            </div>

            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              onClick={() => {
                setSearchTerm("");
                setShowAdminsOnly(false);
                setShowDisabledOnly(false);
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found matching your criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className={user.isDisabled ? "bg-red-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.displayName
                            ? user.displayName.charAt(0).toUpperCase()
                            : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {user.displayName || "No Name"}
                            {user.isAdmin && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {user.uid}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isDisabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => openUserDetails(user)}
                        >
                          Details
                        </button>
                        <button
                          className={`${
                            user.isAdmin
                              ? "text-orange-600 hover:text-orange-900"
                              : "text-indigo-600 hover:text-indigo-900"
                          } ${actionInProgress === user.uid ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() =>
                            toggleAdminStatus(user.uid, user.isAdmin)
                          }
                          disabled={actionInProgress === user.uid}
                        >
                          {actionInProgress === user.uid
                            ? "Processing..."
                            : user.isAdmin
                              ? "Revoke Admin"
                              : "Make Admin"}
                        </button>
                        <button
                          className={`${
                            user.isDisabled
                              ? "text-green-600 hover:text-green-900"
                              : "text-red-600 hover:text-red-900"
                          } ${actionInProgress === user.uid ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() =>
                            toggleDisabledStatus(user.uid, user.isDisabled)
                          }
                          disabled={actionInProgress === user.uid}
                        >
                          {actionInProgress === user.uid
                            ? "Processing..."
                            : user.isDisabled
                              ? "Enable User"
                              : "Disable User"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  User Details
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={closeUserDetails}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    Basic Information
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">
                        Display Name
                      </span>
                      <p className="font-medium">
                        {selectedUser.displayName || "No display name"}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">User ID</span>
                      <p className="font-medium text-xs break-all">
                        {selectedUser.uid}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Created At</span>
                      <p className="font-medium">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Last Login</span>
                      <p className="font-medium">
                        {formatDate(selectedUser.lastLogin)}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <p className="font-medium flex items-center">
                        {selectedUser.isDisabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {selectedUser.isAdmin && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-4">
                    Usage Information
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">
                        Crates Count
                      </span>
                      <p className="font-medium">
                        {selectedUser.cratesCount?.toLocaleString() || "0"}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">MCP Calls</span>
                      <p className="font-medium">
                        {selectedUser.mcpCallsCount?.toLocaleString() || "0"}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">
                        Storage Used
                      </span>
                      <p className="font-medium">
                        {formatFileSize(selectedUser.storageUsed)}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Last Active</span>
                      <p className="font-medium">
                        {formatDate(selectedUser.lastActive)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium mb-4">Actions</h4>

                <div className="flex flex-wrap gap-4">
                  <button
                    className={`px-4 py-2 rounded-md ${
                      selectedUser.isAdmin
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    }`}
                    onClick={() =>
                      toggleAdminStatus(selectedUser.uid, selectedUser.isAdmin)
                    }
                    disabled={actionInProgress === selectedUser.uid}
                  >
                    {selectedUser.isAdmin
                      ? "Revoke Admin Rights"
                      : "Grant Admin Rights"}
                  </button>

                  <button
                    className={`px-4 py-2 rounded-md ${
                      selectedUser.isDisabled
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                    onClick={() =>
                      toggleDisabledStatus(
                        selectedUser.uid,
                        selectedUser.isDisabled,
                      )
                    }
                    disabled={actionInProgress === selectedUser.uid}
                  >
                    {selectedUser.isDisabled ? "Enable User" : "Disable User"}
                  </button>

                  <Link
                    href={`/admin/users/${selectedUser.uid}/crates`}
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md"
                  >
                    View Crates
                  </Link>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md"
                onClick={closeUserDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
