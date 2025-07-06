"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaDownload,
  FaEye,
  FaCalendar,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackResponse {
  id: string;
  templateId: string;
  submitterId: string;
  submittedAt: string;
  responses: Record<string, any>;
  metadata: Record<string, string>;
}

interface FeedbackTemplate {
  id: string;
  title: string;
  description?: string;
  submissionCount: number;
}

interface Statistics {
  [fieldKey: string]: {
    count: number;
    responseRate: number;
    [key: string]: any;
  };
}

export default function FeedbackResponsesPage({
  params,
}: {
  params: { templateId: string };
}) {
  const router = useRouter();
  const { user, loading, getIdToken } = useAuth();
  const { templateId } = params;

  const [template, setTemplate] = useState<FeedbackTemplate | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=/feedback/responses/${templateId}`);
    }
  }, [user, loading, router, templateId]);

  useEffect(() => {
    if (user) {
      fetchResponses();
    }
  }, [user, templateId]);

  const fetchResponses = async () => {
    try {
      setIsLoading(true);

      // Get authentication token
      const token = await getIdToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/feedback/responses/${templateId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You can only view responses for templates you own");
        }
        if (response.status === 404) {
          throw new Error("Template not found");
        }
        throw new Error("Failed to fetch responses");
      }

      const data = await response.json();
      setTemplate(data.template);
      setResponses(data.responses || []);
      setStatistics(data.statistics || {});
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFieldStats = (stats: any, fieldType?: string): string => {
    if (stats.count === 0) return "No responses";

    const baseInfo = `${stats.count} responses (${stats.responseRate}%)`;

    switch (fieldType) {
      case "number":
      case "rating":
        return `${baseInfo}, avg: ${stats.average}, range: ${stats.min}-${stats.max}`;
      case "boolean":
        return `${baseInfo}, ${stats.truePercentage}% true`;
      case "select":
      case "multiselect":
        const top = Object.entries(stats.distribution || {})
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .map(([option, count]) => `${option}(${count})`)
          .join(", ");
        return `${baseInfo}, top: ${top}`;
      case "text":
        return `${baseInfo}, avg length: ${stats.averageLength} chars`;
      default:
        return baseInfo;
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    // Get all unique response keys
    const allKeys = new Set<string>();
    responses.forEach((response) => {
      Object.keys(response.responses).forEach((key) => allKeys.add(key));
    });

    // Create CSV headers
    const headers = ["ID", "Submitter", "Submitted At", ...Array.from(allKeys)];

    // Create CSV rows
    const rows = responses.map((response) => [
      response.id,
      response.submitterId,
      new Date(response.submittedAt).toLocaleString(),
      ...Array.from(allKeys).map((key) => {
        const value = response.responses[key];
        if (Array.isArray(value)) {
          return `"${value.join(", ")}"`;
        }
        return value || "";
      }),
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `feedback-responses-${template?.title?.replace(/[^a-z0-9]/gi, "_") || templateId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="bg-beige-200 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Error</h1>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/crates"
              className="inline-flex items-center text-red-600 hover:text-red-800"
            >
              <FaArrowLeft className="mr-2" /> Back to Crates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/crates"
            className="inline-flex items-center text-gray-600 hover:text-primary-500 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Crates
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Feedback Responses
              </h1>
              {template && (
                <>
                  <h2 className="text-xl text-gray-600 mb-2">
                    {template.title}
                  </h2>
                  {template.description && (
                    <p className="text-gray-600">{template.description}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    Total responses: {template.submissionCount}
                  </div>
                </>
              )}
            </div>

            {responses.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <FaDownload className="mr-2" /> Export CSV
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : responses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
            <div className="text-gray-500 mb-4">
              <FaEye className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No responses yet
              </h3>
              <p>Share your template ID to start collecting feedback.</p>
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <code className="text-sm">{templateId}</code>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Section */}
            {Object.keys(statistics).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Response Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(statistics).map(([fieldKey, stats]) => (
                    <div key={fieldKey} className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-gray-800 mb-2">
                        {fieldKey}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatFieldStats(stats)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Responses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Individual Responses ({responses.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {responses.map((response, index) => (
                  <div key={response.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Response #{index + 1}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <FaUser className="mr-1 h-3 w-3" />
                            {response.submitterId}
                          </div>
                          <div className="flex items-center">
                            <FaCalendar className="mr-1 h-3 w-3" />
                            {new Date(response.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {response.id}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(response.responses).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium text-gray-700">
                              {key}:
                            </span>
                            <span className="text-gray-600">
                              {Array.isArray(value)
                                ? value.join(", ")
                                : String(value)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>

                    {Object.keys(response.metadata).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Metadata
                        </h5>
                        <div className="space-y-1">
                          {Object.entries(response.metadata).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between text-xs text-gray-500"
                              >
                                <span>{key}:</span>
                                <span>{value}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
