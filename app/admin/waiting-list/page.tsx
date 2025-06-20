"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WaitingListEntry {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  notified: boolean;
}

const AdminWaitingListPage: React.FC = () => {
  const { user, isAdmin, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      fetchWaitingList();
    }
  }, [isAdmin, user]);

  const fetchWaitingList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available.");
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch("/api/admin/waiting-list", { headers });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch waiting list data");
      }

      const data = await response.json();
      setWaitingList(data.waitingList);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching waiting list data",
      );
      console.error("Error fetching waiting list:", err);
    }
    setIsLoading(false);
  };

  const handleToggleNotified = async (id: string, currentStatus: boolean) => {
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Authentication token not available.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(`/api/admin/waiting-list/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ notified: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      // Update local state
      setWaitingList((prevList) =>
        prevList.map((item) =>
          item.id === id ? { ...item, notified: !currentStatus } : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while updating status",
      );
      console.error("Error updating notification status:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return <p>Loading user data...</p>;
  }

  if (!user || !isAdmin) {
    return <p>Access Denied. Redirecting...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Pro Version Waiting List</h1>
        <Link
          href="/admin/dashboard"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
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

      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Subscribers ({waitingList.length})
          </h2>
          <button
            onClick={fetchWaitingList}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : waitingList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No subscribers in the waiting list yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-gray-300 border-b py-8">
                  <th className="text-left pl-4">Email</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {waitingList.map((entry) => (
                  <tr key={entry.id} className="h-20 border-gray-300 border-b">
                    <td className="pl-4">
                      <div className="flex items-center">
                        <p className="text-base font-medium leading-none text-gray-700">
                          {entry.email}
                        </p>
                      </div>
                    </td>
                    <td>
                      <p className="text-base font-medium leading-none text-gray-700">
                        {entry.name || "—"}
                      </p>
                    </td>
                    <td>
                      <p className="text-base font-medium leading-none text-gray-700">
                        {formatDate(entry.createdAt)}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          entry.notified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {entry.notified ? "Notified" : "Waiting"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          handleToggleNotified(entry.id, entry.notified)
                        }
                        className={`px-3 py-1.5 rounded text-sm ${
                          entry.notified
                            ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-300"
                        }`}
                      >
                        {entry.notified
                          ? "Mark as Waiting"
                          : "Mark as Notified"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWaitingListPage;
