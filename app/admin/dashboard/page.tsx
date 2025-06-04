"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define a type for the stats
interface AdminStats {
  totalFiles?: number;
  totalFirestoreData?: number; // Example: count of documents in a specific collection
  totalUsers?: number;
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

          const filesResponse = await fetch("/api/admin/stats/crates", {
            headers,
          });
          if (!filesResponse.ok) {
            const errorData = await filesResponse.json();
            throw new Error(errorData.error || "Failed to fetch file stats");
          }
          const filesData = await filesResponse.json();

          const firestoreResponse = await fetch("/api/admin/stats/firestore", {
            headers,
          });
          if (!firestoreResponse.ok) {
            const errorData = await firestoreResponse.json();
            throw new Error(
              errorData.error || "Failed to fetch Firestore stats",
            );
          }
          const firestoreData = await firestoreResponse.json();

          const usersResponse = await fetch("/api/admin/stats/users", {
            headers,
          });
          if (!usersResponse.ok) {
            const errorData = await usersResponse.json();
            throw new Error(errorData.error || "Failed to fetch user stats");
          }
          const usersData = await usersResponse.json();

          setStats({
            totalFiles: filesData.count,
            totalFirestoreData: firestoreData.count,
            totalUsers: usersData.count,
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
  }, [isAdmin, user, getIdToken]); // Add user and getIdToken to dependency array

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
          {/* Add other admin tools here */}
        </div>
      </div>

      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded mb-4">
          Error: {error}
        </p>
      )}
      {statsLoading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">
              Total Files in Bucket
            </h2>
            <p className="text-4xl font-bold">{stats.totalFiles ?? "N/A"}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">
              Total Data in Firestore (File Metadatas)
            </h2>
            <p className="text-4xl font-bold">
              {stats.totalFirestoreData ?? "N/A"}
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Total Users</h2>
            <p className="text-4xl font-bold">{stats.totalUsers ?? "N/A"}</p>
          </div>
          {/* Add more KPI cards here as needed */}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
