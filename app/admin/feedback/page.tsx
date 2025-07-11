"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface FeedbackItem {
  id: string;
  message: string;
  type: "bug" | "feature" | "general";
  email: string | null;
  timestamp: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  userAgent?: string;
  ip?: string;
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "new" | "in-progress" | "resolved" | "closed"
  >("all");
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (user === null || (user && !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setLoading(true);

        let feedbackQuery;
        if (filter === "all") {
          feedbackQuery = query(
            collection(firestore, "recipe"),
            orderBy("timestamp", "desc"),
          );
        } else {
          feedbackQuery = query(
            collection(firestore, "recipe"),
            where("status", "==", filter),
            orderBy("timestamp", "desc"),
          );
        }

        const querySnapshot = await getDocs(feedbackQuery);
        const feedbackItems: FeedbackItem[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<FeedbackItem, "id">;
          feedbackItems.push({
            id: doc.id,
            ...data,
          });
        });

        setFeedback(feedbackItems);
        setError(null);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to load feedback. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (user && isAdmin) {
      fetchFeedback();
    }
  }, [user, isAdmin, filter]);

  const updateFeedbackStatus = async (
    id: string,
    newStatus: FeedbackItem["status"],
  ) => {
    try {
      const feedbackRef = doc(firestore, "recipe", id);
      await updateDoc(feedbackRef, {
        status: newStatus,
      });

      // Update local state
      setFeedback((prevFeedback) =>
        prevFeedback.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Error updating feedback status:", err);
      setError("Failed to update status. Please try again.");
    }
  };

  const deleteFeedbackItem = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this feedback? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const feedbackRef = doc(firestore, "recipe", id);
      await deleteDoc(feedbackRef);

      // Update local state
      setFeedback((prevFeedback) =>
        prevFeedback.filter((item) => item.id !== id),
      );
    } catch (err) {
      console.error("Error deleting feedback:", err);
      setError("Failed to delete feedback. Please try again.");
    }
  };

  if (!user || (user && !isAdmin)) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Feedback Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label
          htmlFor="status-filter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-gray-800 border border-gray-700 text-white rounded-md px-4 py-2 w-full md:w-auto"
        >
          <option value="all">All Feedback</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading feedback...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-8 border border-gray-700 rounded-lg">
          <p className="text-gray-400">No feedback found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Message
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {feedback.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        item.type === "bug"
                          ? "bg-red-100 text-red-800"
                          : item.type === "feature"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-200">{item.message}</div>
                    {item.userAgent && (
                      <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                        {item.userAgent}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-200">
                      {item.email || "Anonymous"}
                    </div>
                    {item.ip && (
                      <div className="text-xs text-gray-400">{item.ip}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(item.timestamp).toLocaleDateString()}
                    <br />
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        item.status === "new"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateFeedbackStatus(
                            item.id,
                            e.target.value as FeedbackItem["status"],
                          )
                        }
                        className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1"
                      >
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => deleteFeedbackItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
