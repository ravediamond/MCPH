"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define a type for the stats
interface AdminStats {
  // Core metrics
  totalCrates?: number;
  totalUsers?: number;
  totalMcpCalls?: number;

  // Per-user metrics
  averageCratesPerUser?: number;
  averageMcpCallsPerUser?: number;
  maxCratesPerUser?: number;
  maxMcpCallsPerUser?: number;
  userWithMostCrates?: { userId: string; count: number; email?: string };
  userWithMostMcpCalls?: { userId: string; count: number; email?: string };

  // Time-based metrics
  maxMcpCallsPerDay?: number;
  mcpCallsTrend?: Array<{ date: string; count: number }>;
  activeUsersLast30Days?: number;
  newUsersLast30Days?: number;

  // Client metrics
  topClients?: Array<{ clientId: string; count: number; name?: string }>;

  // Storage metrics
  totalStorage?: number;
  storageUtilization?: number;
  avgCrateSize?: number;

  // Distribution metrics
  topFileTypes?: Array<{ type: string; count: number }>;
  userGrowthRate?: number;
  cratesDistribution?: {
    smallCrates: number; // < 1MB
    mediumCrates: number; // 1MB-10MB
    largeCrates: number; // 10MB-100MB
    veryLargeCrates: number; // >100MB
  };

  // API usage metrics
  apiKeysTotal?: number;
  apiKeyUsageAvg?: number;
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

          // Fetch all stats in parallel for better performance
          const [
            cratesResponse,
            usersResponse,
            mcpCallsResponse,
            storageResponse,
            firestoreResponse,
          ] = await Promise.all([
            fetch("/api/admin/stats/crates", { headers }),
            fetch("/api/admin/stats/users", { headers }),
            fetch("/api/admin/stats/mcp-calls", { headers }),
            fetch("/api/admin/stats/storage", { headers }),
            fetch("/api/admin/stats/firestore", { headers }),
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

          if (!mcpCallsResponse.ok) {
            const errorData = await mcpCallsResponse.json();
            throw new Error(
              errorData.error || "Failed to fetch MCP call stats",
            );
          }
          const mcpCallsData = await mcpCallsResponse.json();

          if (!storageResponse.ok) {
            const errorData = await storageResponse.json();
            throw new Error(errorData.error || "Failed to fetch storage stats");
          }
          const storageData = await storageResponse.json();

          if (!firestoreResponse.ok) {
            const errorData = await firestoreResponse.json();
            console.warn("Firestore stats warning:", errorData.error);
            // Don't throw here, just log a warning since this is optional
          }
          const firestoreData = firestoreResponse.ok
            ? await firestoreResponse.json()
            : {};

          // Combine all stats into one object
          setStats({
            // Core metrics
            totalCrates: cratesData.count,
            totalUsers: usersData.count,
            totalMcpCalls: mcpCallsData.totalCalls,

            // Per-user metrics
            averageCratesPerUser: cratesData.averagePerUser,
            averageMcpCallsPerUser: mcpCallsData.averagePerUser,
            maxCratesPerUser: cratesData.maxPerUser,
            maxMcpCallsPerUser: mcpCallsData.maxPerUser,
            userWithMostCrates: cratesData.userWithMost,
            userWithMostMcpCalls: mcpCallsData.userWithMost,

            // Time-based metrics
            maxMcpCallsPerDay: mcpCallsData.maxPerDay,
            mcpCallsTrend: mcpCallsData.trend,
            activeUsersLast30Days: usersData.activeUsersLast30Days,
            newUsersLast30Days: usersData.newUsersLast30Days,

            // Client metrics
            topClients: mcpCallsData.topClients,

            // Storage metrics
            totalStorage: storageData.totalStorage,
            storageUtilization: storageData.utilization,
            avgCrateSize: storageData.avgCrateSize,

            // Distribution metrics
            topFileTypes: storageData.topFileTypes,
            userGrowthRate: usersData.userGrowthRate,
            cratesDistribution: storageData.sizeDistribution,

            // API usage metrics
            apiKeysTotal: firestoreData.apiKeysCount,
            apiKeyUsageAvg: firestoreData.apiKeyUsageAvg,
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

            {/* Per-user averages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Avg. Crates Per User
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.averageCratesPerUser?.toFixed(1) ?? "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Avg. MCP Calls Per User
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.averageMcpCallsPerUser?.toFixed(1) ?? "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  New Users (30 days)
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.newUsersLast30Days?.toLocaleString() ?? "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Active Users (30 days)
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.activeUsersLast30Days?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-1 text-xs text-gray-500">
                  {stats.totalUsers && stats.activeUsersLast30Days
                    ? `${((stats.activeUsersLast30Days / stats.totalUsers) * 100).toFixed(1)}% of total users`
                    : ""}
                </div>
              </div>
            </div>

            {/* Top Users Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {stats.userWithMostCrates && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-blue-800 text-sm font-medium mb-1">
                    User with Most Crates
                  </h3>
                  <p className="text-xl font-bold text-blue-900">
                    {stats.userWithMostCrates.count?.toLocaleString() ?? "N/A"}{" "}
                    crates
                  </p>
                  <div className="mt-1 text-xs text-blue-700 truncate">
                    User:{" "}
                    {stats.userWithMostCrates.email ||
                      stats.userWithMostCrates.userId ||
                      "Unknown"}
                  </div>
                </div>
              )}

              {stats.userWithMostMcpCalls && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-purple-800 text-sm font-medium mb-1">
                    User with Most MCP Calls
                  </h3>
                  <p className="text-xl font-bold text-purple-900">
                    {stats.userWithMostMcpCalls.count?.toLocaleString() ??
                      "N/A"}{" "}
                    calls
                  </p>
                  <div className="mt-1 text-xs text-purple-700 truncate">
                    User:{" "}
                    {stats.userWithMostMcpCalls.email ||
                      stats.userWithMostMcpCalls.userId ||
                      "Unknown"}
                  </div>
                </div>
              )}
            </div>

            {/* User Growth Rate */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium mb-1">
                    User Growth Rate (30 days)
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.userGrowthRate !== undefined
                      ? `${stats.userGrowthRate > 0 ? "+" : ""}${stats.userGrowthRate.toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                {stats.userGrowthRate !== undefined && (
                  <div className="ml-auto text-5xl">
                    {stats.userGrowthRate > 0
                      ? "📈"
                      : stats.userGrowthRate < 0
                        ? "📉"
                        : "➡️"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MCP API Usage Stats */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">MCP API Usage</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-5">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Max MCP Calls Per Day
                </h3>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.maxMcpCallsPerDay?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-1 text-xs text-gray-600">
                  Highest volume of API calls in a single day
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-5">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  Max MCP Calls Per User
                </h3>
                <p className="text-2xl font-bold text-indigo-700">
                  {stats.maxMcpCallsPerUser?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-1 text-xs text-gray-600">
                  Highest API usage by a single user
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5">
                <h3 className="text-gray-600 text-sm font-medium mb-1">
                  API Keys
                </h3>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.apiKeysTotal?.toLocaleString() ?? "N/A"}
                </p>
                <div className="mt-1 text-xs text-gray-600">
                  Total active API keys
                </div>
                {stats.apiKeyUsageAvg && (
                  <div className="mt-1 text-xs text-gray-600">
                    Avg. usage: {stats.apiKeyUsageAvg.toFixed(1)} calls/key
                  </div>
                )}
              </div>
            </div>

            {/* MCP Calls Trend Chart */}
            {stats.mcpCallsTrend && stats.mcpCallsTrend.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                <h3 className="text-gray-700 text-sm font-medium mb-3">
                  MCP API Calls Trend
                </h3>
                <div className="h-48 w-full">
                  {/* This is where a chart would go - for now we'll show a simple bar representation */}
                  <div className="flex h-36 items-end space-x-1">
                    {stats.mcpCallsTrend.map((point, i) => {
                      const maxCount = Math.max(
                        ...stats.mcpCallsTrend!.map((p) => p.count),
                      );
                      const height =
                        maxCount > 0 ? (point.count / maxCount) * 100 : 0;
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className="w-6 bg-purple-500 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                            {point.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MCP Calls Per Client */}
            {stats.topClients && stats.topClients.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-gray-700 text-lg font-medium mb-3">
                  Top Clients by MCP Calls
                </h3>

                {/* Visual representation - horizontal bar chart */}
                <div className="mb-4">
                  {stats.topClients.slice(0, 5).map((client, index) => {
                    const percentage = stats.totalMcpCalls
                      ? (client.count / stats.totalMcpCalls) * 100
                      : 0;
                    const maxCount = Math.max(
                      ...stats.topClients!.slice(0, 5).map((c) => c.count),
                    );
                    const width =
                      maxCount > 0 ? (client.count / maxCount) * 100 : 0;

                    return (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className="text-sm font-medium truncate"
                            style={{ maxWidth: "60%" }}
                          >
                            {client.name || client.clientId}
                          </span>
                          <span className="text-sm text-gray-500">
                            {client.count.toLocaleString()} (
                            {percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-purple-600 h-2.5 rounded-full"
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Rank
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Client ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Client Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Call Count
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.topClients.map((client, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.clientId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {client.count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stats.totalMcpCalls &&
                              (
                                (client.count / stats.totalMcpCalls) *
                                100
                              ).toFixed(2)}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Crate Stats and Storage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Crate Distribution */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Crate Distribution
              </h2>

              {stats.cratesDistribution ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Small Crates (&lt;1MB)
                      </h3>
                      <p className="text-xl font-bold text-blue-700">
                        {stats.cratesDistribution.smallCrates.toLocaleString()}
                      </p>
                      {stats.totalCrates && (
                        <div className="text-xs text-blue-600 mt-1">
                          {(
                            (stats.cratesDistribution.smallCrates /
                              stats.totalCrates) *
                            100
                          ).toFixed(1)}
                          % of total
                        </div>
                      )}
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Medium Crates (1-10MB)
                      </h3>
                      <p className="text-xl font-bold text-green-700">
                        {stats.cratesDistribution.mediumCrates.toLocaleString()}
                      </p>
                      {stats.totalCrates && (
                        <div className="text-xs text-green-600 mt-1">
                          {(
                            (stats.cratesDistribution.mediumCrates /
                              stats.totalCrates) *
                            100
                          ).toFixed(1)}
                          % of total
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Large Crates (10-100MB)
                      </h3>
                      <p className="text-xl font-bold text-orange-700">
                        {stats.cratesDistribution.largeCrates.toLocaleString()}
                      </p>
                      {stats.totalCrates && (
                        <div className="text-xs text-orange-600 mt-1">
                          {(
                            (stats.cratesDistribution.largeCrates /
                              stats.totalCrates) *
                            100
                          ).toFixed(1)}
                          % of total
                        </div>
                      )}
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Very Large Crates (&gt;100MB)
                      </h3>
                      <p className="text-xl font-bold text-red-700">
                        {stats.cratesDistribution.veryLargeCrates.toLocaleString()}
                      </p>
                      {stats.totalCrates && (
                        <div className="text-xs text-red-600 mt-1">
                          {(
                            (stats.cratesDistribution.veryLargeCrates /
                              stats.totalCrates) *
                            100
                          ).toFixed(1)}
                          % of total
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  Size distribution data not available
                </div>
              )}

              {/* Average Crate Size */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-700 text-sm font-medium mb-1">
                  Average Crate Size
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {formatFileSize(stats.avgCrateSize || 0)}
                </p>
              </div>
            </div>

            {/* Storage Utilization */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Storage Utilization
              </h2>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-700 text-sm font-medium">
                    Total Storage
                  </h3>
                  <span className="text-xl font-bold text-blue-700">
                    {formatFileSize(stats.totalStorage || 0)}
                  </span>
                </div>

                {/* Storage utilization progress bar */}
                {stats.storageUtilization !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>
                        Utilization: {stats.storageUtilization.toFixed(1)}%
                      </span>
                      <span
                        className={
                          stats.storageUtilization > 90
                            ? "text-red-600 font-bold"
                            : ""
                        }
                      >
                        {stats.storageUtilization > 90
                          ? "CRITICAL"
                          : stats.storageUtilization > 70
                            ? "High"
                            : "Normal"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${
                          stats.storageUtilization > 90
                            ? "bg-red-600"
                            : stats.storageUtilization > 70
                              ? "bg-orange-500"
                              : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(100, stats.storageUtilization)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top File Types */}
              {stats.topFileTypes && stats.topFileTypes.length > 0 && (
                <div>
                  <h3 className="text-gray-700 text-lg font-medium mb-3">
                    Top File Types
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.topFileTypes.slice(0, 4).map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 flex items-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                          <span className="text-indigo-700 font-bold text-sm">
                            {getFileTypeEmoji(item.type)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{item.type}</div>
                          <div className="text-lg font-bold">
                            {item.count.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Data Section */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Admin Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                onClick={() => {
                  // Export stats to CSV logic would go here
                  alert("This would export current stats data to CSV");
                }}
              >
                Export Stats to CSV
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                onClick={() => {
                  // Generate report logic would go here
                  alert("This would generate a full PDF report");
                }}
              >
                Generate Full Report
              </button>
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
