"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define a type for the stats (simplified for v1)
interface AdminStats {
  // Core metrics
  totalCrates?: number;
  totalUsers?: number;
  totalDownloads?: number;
  totalViews?: number;
  totalMcpCalls?: number; // Added for MCP calls tracking
}

const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, loading, getIdToken } = useAuth(); // Add getIdToken
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({});
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true); // For loading state of stats

  useEffect(() => {
    if (!loading && !user) {
      router.push("/home"); // Or your login page
    } else if (!loading && user && !isAdmin) {
      router.push("/home"); // Not an admin, redirect to home
      alert("Access denied. You are not an admin.");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin && user) {
      // Ensure user is available for token
      const fetchStats = async () => {
        setStatsLoading(true);
        setError(null);
        try {
          const token = await getIdToken();
          if (!token) {
            throw new Error("Authentication token not available.");
          }

          const headers = { Authorization: `Bearer ${token}` };

          // Simplified for v1: Fetch only core stats
          const [cratesResponse, usersResponse, mcpCallsResponse] =
            await Promise.all([
              fetch("/api/admin/stats/crates", { headers }),
              fetch("/api/admin/stats/users", { headers }),
              fetch("/api/admin/stats/mcp-calls", { headers }),
            ]);

          // Check responses and parse data
          if (!cratesResponse.ok) {
            const errorData = await cratesResponse.json();
            throw new Error(errorData.error || "Failed to fetch crate stats");
          }
          const cratesData = await cratesResponse.json();

          if (!usersResponse.ok) {
            const errorData = await usersResponse.json();
            throw new Error(errorData.error || "Failed to fetch user stats");
          }
          const usersData = await usersResponse.json();

          // Process MCP calls data
          let mcpCallsData = { totalCalls: 0 };
          if (mcpCallsResponse.ok) {
            mcpCallsData = await mcpCallsResponse.json();
          }

          // Combine simplified stats
          setStats({
            // Core metrics only for v1
            totalCrates: cratesData.count,
            totalUsers: usersData.count,
            totalDownloads: cratesData.totalDownloads || 0,
            totalViews: cratesData.totalViews || 0,
            totalMcpCalls: mcpCallsData.totalCalls || 0, // Map totalCalls to totalMcpCalls for dashboard
          });
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An unknown error occurred while fetching stats",
          );
          console.error("Error fetching admin stats:", err);
        }
        setStatsLoading(false);
      };
      fetchStats();
    }
  }, [isAdmin, user, getIdToken]);

  if (loading) {
    return <p>Loading user data...</p>;
  }

  if (!user || !isAdmin) {
    return <p>Access Denied. Redirecting...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Admin Navigation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/feedback"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Manage Feedback
          </Link>
          {/* Add user management link */}
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Manage Users
          </Link>
          {/* Add crate management link */}
          <Link
            href="/admin/crates"
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Manage Crates
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded mb-4">
          Error: {error}
        </p>
      )}

      {statsLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div>
          {/* Platform Overview - Key Metrics */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5 border-l-4 border-blue-500">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Total Crates
                </h3>
                <p className="text-3xl font-bold text-blue-700">
                  {stats.totalCrates?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  All crates uploaded to the platform
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-5 border-l-4 border-green-500">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Total Users
                </h3>
                <p className="text-3xl font-bold text-green-700">
                  {stats.totalUsers?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  Registered users on the platform
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-5 border-l-4 border-purple-500">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Total MCP Calls
                </h3>
                <p className="text-3xl font-bold text-purple-700">
                  {stats.totalMcpCalls?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  Lifetime MCP API calls
                </div>
              </div>
            </div>
          </div>

          {/* User Metrics Dashboard */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Metrics</h2>

            {/* Simplified v1 metrics note */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-800">
                    Simplified Metrics for v1
                  </p>
                  <p className="text-sm text-blue-700">
                    Detailed user metrics will be available in future updates.
                    Current dashboard shows core platform statistics only.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic user stats - simplified for v1 */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                User Overview
              </h3>
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="mb-4 md:mb-0">
                  <div className="text-sm text-gray-600">
                    Total Registered Users
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.totalUsers?.toLocaleString() ?? "N/A"}
                  </div>
                </div>
                <div className="mb-4 md:mb-0">
                  <div className="text-sm text-gray-600">Content Created</div>
                  <div className="text-2xl font-bold">
                    {stats.totalCrates?.toLocaleString() ?? "N/A"} crates
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">API Usage</div>
                  <div className="text-2xl font-bold">
                    {stats.totalMcpCalls?.toLocaleString() ?? "N/A"} calls
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MCP API Usage Stats - Simplified for v1 */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">MCP API Usage</h2>

            {/* Simplified v1 metrics note */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
              <div className="flex items-start">
                <div className="text-purple-600 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-purple-800">
                    Basic API Stats for v1
                  </p>
                  <p className="text-sm text-purple-700">
                    Detailed API usage analytics will be available in future
                    versions. Currently showing basic usage metrics.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic MCP stats - simplified for v1 */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-5">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                API Overview
              </h3>
              <div className="flex flex-col md:flex-row md:justify-between">
                <div>
                  <div className="text-sm text-gray-600">
                    Total MCP API Calls
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.totalMcpCalls?.toLocaleString() ?? "N/A"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lifetime API usage
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simplified Crate Stats for v1 */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Crate Statistics</h2>

            {/* Simplified v1 metrics note */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-800">
                    Basic Crate Stats for v1
                  </p>
                  <p className="text-sm text-blue-700">
                    Detailed file statistics and storage metrics will be
                    available in future updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic crate stats - simplified for v1 */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Crate Overview
              </h3>
              <div className="flex flex-col md:flex-row md:justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Crates</div>
                  <div className="text-2xl font-bold">
                    {stats.totalCrates?.toLocaleString() ?? "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Downloads</div>
                  <div className="text-2xl font-bold">
                    {stats.totalDownloads?.toLocaleString() ?? "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Views</div>
                  <div className="text-2xl font-bold">
                    {stats.totalViews?.toLocaleString() ?? "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Data Section */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Admin Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // Refresh stats logic
                  window.location.reload();
                }}
              >
                Refresh Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

function formatFileSize(size: number) {
  if (size === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileTypeEmoji(fileType: string) {
  // Simple emoji mapping based on file type
  const emojiMap: { [key: string]: string } = {
    "image/jpeg": "📷",
    "image/png": "🖼️",
    "image/gif": "🎞️",
    "application/pdf": "📄",
    "text/plain": "📄",
    "application/vnd.ms-excel": "📊",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
    "application/vnd.ms-powerpoint": "📈",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "📈",
    "application/zip": "📦",
    "application/x-rar-compressed": "📦",
    "text/csv": "📊",
    "application/javascript": "📜",
    "application/json": "📂",
    default: "📁",
  };
  return emojiMap[fileType] || emojiMap["default"];
}
