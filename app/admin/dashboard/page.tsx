"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminStats {
  totalCrates?: number;
  totalUsers?: number;
  totalDownloads?: number;
  totalViews?: number;
  totalMcpCalls?: number;
  totalWaitingList?: number;
}

const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({});
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/home");
    } else if (!loading && user && !isAdmin) {
      router.push("/home");
      alert("Access denied. You are not an admin.");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin && user) {
      const fetchStats = async () => {
        setStatsLoading(true);
        setError(null);
        try {
          const token = await getIdToken();
          if (!token) {
            throw new Error("Authentication token not available.");
          }

          const headers = { Authorization: `Bearer ${token}` };

          const [
            cratesResponse,
            usersResponse,
            mcpCallsResponse,
            waitingListResponse,
          ] = await Promise.all([
            fetch("/api/admin/stats/crates", { headers }),
            fetch("/api/admin/stats/users", { headers }),
            fetch("/api/admin/stats/mcp-calls", { headers }),
            fetch("/api/admin/waiting-list", { headers }),
          ]);

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

          let mcpCallsData = { totalCalls: 0 };
          if (mcpCallsResponse.ok) {
            mcpCallsData = await mcpCallsResponse.json();
          }

          let waitingListData = { waitingList: [] };
          if (waitingListResponse.ok) {
            waitingListData = await waitingListResponse.json();
          }

          setStats({
            totalCrates: cratesData.count,
            totalUsers: usersData.count,
            totalDownloads: cratesData.totalDownloads || 0,
            totalViews: cratesData.totalViews || 0,
            totalMcpCalls: mcpCallsData.totalCalls || 0,
            totalWaitingList: waitingListData.waitingList?.length || 0,
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
          <Link
            href="/admin/waiting-list"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
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
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Pro Waiting List
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
                  Lifetime MCP calls
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-5 border-l-4 border-orange-500">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Pro Waiting List
                </h3>
                <p className="text-3xl font-bold text-orange-700">
                  {stats.totalWaitingList?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <Link
                    href="/admin/waiting-list"
                    className="text-orange-600 hover:underline"
                  >
                    View subscribers
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Metrics</h2>

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

          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">MCP API Usage</h2>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-5">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                API Overview
              </h3>
              <div className="flex flex-col md:flex-row md:justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total MCP Calls</div>
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

          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Crate Statistics</h2>

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

          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Admin Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => {
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
