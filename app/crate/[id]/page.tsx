"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FaFileDownload,
  FaFile,
  FaClock,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheck,
  FaShareAlt,
  FaUpload,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaProjectDiagram,
  FaArrowLeft,
  FaFileCode,
  FaChartBar,
  FaUsers,
  FaDownload,
  FaEye,
  FaHistory,
  FaInfoCircle,
  FaServer,
  FaExternalLinkAlt,
  FaDatabase,
  FaLock,
  FaTasks,
  FaTable,
} from "react-icons/fa";
import dynamic from "next/dynamic";
import Image from "next/image";
import Card from "../../../components/ui/Card";
import StatsCard from "../../../components/ui/StatsCard";
import { Crate, CrateCategory } from "../../types/crate";
import { useAuth } from "../../../contexts/AuthContext"; // Import useAuth hook

// Dynamic imports for markdown and code rendering
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter"), {
  ssr: false,
});

// Dynamic import for mermaid diagram rendering
const MermaidDiagram = dynamic(
  () =>
    import("@lightenna/react-mermaid-diagram").then(
      (mod) => mod.MermaidDiagram,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-4 text-center text-gray-500 text-sm">
        Loading diagram...
      </div>
    ),
  },
);

// Interface for the API response (extends Crate with additional view-specific fields)
interface CrateResponse extends Partial<Crate> {
  id: string;
  title: string;
  expiresAt: string;
  isPublic: boolean;
  isPasswordProtected: boolean;
  isOwner: boolean;
  viewCount?: number;
  accessHistory?: {
    date: string;
    count: number;
  }[];
}

export default function CratePage() {
  const params = useParams();
  const crateId = params?.id as string;
  const { getIdToken } = useAuth(); // Get the getIdToken function from AuthContext

  const [crateInfo, setCrateInfo] = useState<CrateResponse | null>(null);
  const [crateContent, setCrateContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [accessStats, setAccessStats] = useState({
    today: 0,
    week: 0,
    month: 0,
  });
  const [showResetExpiry, setShowResetExpiry] = useState(false);
  const [resetExpiryLoading, setResetExpiryLoading] = useState(false);
  const [resetExpiryError, setResetExpiryError] = useState<string | null>(null);
  const [resetExpirySuccess, setResetExpirySuccess] = useState<string | null>(
    null,
  );
  const [expiryUnit, setExpiryUnit] = useState<"days" | "hours">("days");
  const [expiryAmount, setExpiryAmount] = useState<number>(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordRequired, setPasswordRequired] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch crate metadata only when crateId changes
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    async function fetchCrateMetadata() {
      setLoading(true);
      setError(null);
      setCrateInfo(null);
      setCrateContent(null);
      setPasswordRequired(false);

      try {
        // Get the auth token
        const idToken = await getIdToken();

        // Include the auth token in the request headers
        const headers: HeadersInit = {};
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        const response = await fetch(`/api/crates/${crateId}`, { headers });

        if (response.status === 401) {
          // Password protected crate
          setPasswordRequired(true);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Crate not found or has expired"
              : "Failed to fetch crate information",
          );
        }

        const data = await response.json();
        setCrateInfo(data);

        if (data.expiresAt) {
          updateTimeRemaining(data.expiresAt);
          timer = setInterval(() => updateTimeRemaining(data.expiresAt), 60000);
        }

        if (!data.accessHistory) {
          generateMockAccessStats(data.downloadCount || 0);
        } else {
          calculateAccessStats(data.accessHistory);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (crateId) fetchCrateMetadata();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [crateId]);

  // Fetch crate content based on category
  useEffect(() => {
    if (!crateInfo) return;

    const shouldFetchContent = () => {
      switch (crateInfo.category) {
        case CrateCategory.MARKDOWN:
        case CrateCategory.TODOLIST:
        case CrateCategory.DIAGRAM:
        case CrateCategory.DATA:
        case CrateCategory.CODE:
        case CrateCategory.JSON: // Added JSON category
          return true;
        default:
          return false;
      }
    };

    if (shouldFetchContent()) {
      setContentLoading(true);
      // Use content endpoint with empty password for non-password protected crates
      fetchCrateContent(passwordInput)
        .then(content => {
          setCrateContent(content);
          setPasswordRequired(false);
        })
        .catch(err => {
          console.error("Error fetching crate content:", err);
          setCrateContent(null);
        })
        .finally(() => setContentLoading(false));
    }
  }, [crateInfo, passwordInput]);

  // Function to fetch crate content with password if needed
  const fetchCrateContent = async (password?: string): Promise<string> => {
    // Get the auth token
    const idToken = await getIdToken();

    // Include the auth token in the request headers
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };

    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const response = await fetch(`/api/crates/${crateId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      if (response.status === 401) {
        setPasswordRequired(true);
        throw new Error("Password required");
      }
      throw new Error("Failed to fetch crate content");
    }

    return response.text();
  };

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setContentLoading(true);

    fetchCrateContent(passwordInput)
      .then(content => {
        setCrateContent(content);
        setPasswordRequired(false);
      })
      .catch(err => {
        setPasswordError("Invalid password. Please try again.");
        setCrateContent(null);
      })
      .finally(() => setContentLoading(false));
  };

  // In a real app, this would come from server analytics
  const generateMockAccessStats = (downloadCount: number) => {
    const today = Math.floor(downloadCount * 0.2) || 1;
    const week = Math.floor(downloadCount * 0.6) || 3;
    const month = downloadCount;

    setAccessStats({
      today,
      week,
      month,
    });

    // Generate mock access history data (last 7 days)
    const mockHistory = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const count =
        i === 0 ? today : Math.floor(Math.random() * (week / 7) * 1.5);

      mockHistory.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    if (crateInfo) {
      setCrateInfo({
        ...crateInfo,
        accessHistory: mockHistory,
      });
    }
  };

  const calculateAccessStats = (history: { date: string; count: number }[]) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const todayCount =
      history.find((entry) => entry.date === today)?.count || 0;

    const weekCount = history.reduce((sum, entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= oneWeekAgo) {
        return sum + entry.count;
      }
      return sum;
    }, 0);

    const monthCount = history.reduce((sum, entry) => sum + entry.count, 0);

    setAccessStats({
      today: todayCount,
      week: weekCount,
      month: monthCount,
    });
  };

  // Simplified time remaining calculation
  const updateTimeRemaining = (expiresAt: string | number | Date) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) {
      setTimeRemaining("Expired");
      setError("This crate has expired");
      return;
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      setTimeRemaining(`${diffDays}d ${diffHours}h`);
    } else if (diffHours > 0) {
      setTimeRemaining(`${diffHours}h ${diffMinutes}m`);
    } else {
      setTimeRemaining(`${diffMinutes}m`);
    }
  };

  // Format bytes to readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Simple date formatter
  const formatDate = (dateString: string | number | Date): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = () => {
    if (!crateInfo) return;
    window.location.href = `/api/crates/${crateId}/download`;
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/crate/${crateId}`)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
  };

  // Handler to reset expiry
  const handleResetExpiry = async () => {
    setResetExpiryLoading(true);
    setResetExpiryError(null);
    setResetExpirySuccess(null);
    try {
      let durationMs = 0;
      if (expiryUnit === "days") {
        durationMs = expiryAmount * 24 * 60 * 60 * 1000;
      } else {
        durationMs = expiryAmount * 60 * 60 * 1000;
      }
      // Max 29 days
      const maxMs = 29 * 24 * 60 * 60 * 1000;
      if (durationMs > maxMs) {
        setResetExpiryError("Expiry cannot be more than 29 days.");
        setResetExpiryLoading(false);
        return;
      }
      if (durationMs < 60 * 60 * 1000) {
        setResetExpiryError("Expiry must be at least 1 hour.");
        setResetExpiryLoading(false);
        return;
      }
      const pickedDate = new Date(Date.now() + durationMs);
      const response = await fetch(`/api/crates/${crateId}/expiry`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: pickedDate.toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to update expiry");
      setResetExpirySuccess("Expiry updated");
      setShowResetExpiry(false);
      setExpiryAmount(1);
      // Refresh crate info
      const refreshed = await fetch(`/api/crates/${crateId}`);
      if (refreshed.ok) {
        const data = await refreshed.json();
        setCrateInfo(data);
        if (data.expiresAt) updateTimeRemaining(data.expiresAt);
      }
    } catch (err: any) {
      setResetExpiryError(err.message || "Failed to update expiry");
    } finally {
      setResetExpiryLoading(false);
      setTimeout(() => setResetExpirySuccess(null), 2000);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this crate? This action cannot be undone.",
      )
    )
      return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/crates/${crateId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete crate");
      window.location.href = "/";
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete crate");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Get crate type icon based on category
  const getCrateIcon = () => {
    if (!crateInfo) return <FaFile className="text-gray-500" />;

    switch (crateInfo.category) {
      case CrateCategory.MARKDOWN:
        return <FaFileAlt className="text-purple-500" />;
      case CrateCategory.TODOLIST:
        return <FaTasks className="text-indigo-500" />;
      case CrateCategory.DIAGRAM:
        return <FaProjectDiagram className="text-green-500" />;
      case CrateCategory.DATA:
        return <FaTable className="text-blue-500" />;
      case CrateCategory.CODE:
        return <FaFileCode className="text-yellow-500" />;
      case CrateCategory.IMAGE:
        return <FaFileImage className="text-blue-500" />;
      case CrateCategory.JSON: // Added JSON category
        return <FaFileCode className="text-orange-500" />; // Using FaFileCode with a different color for now
      case CrateCategory.BINARY:
      default:
        // Fallback to mime type checking for legacy or unknown types
        const mimeType = crateInfo.mimeType?.toLowerCase() || "";
        if (mimeType.includes("image")) {
          return <FaFileImage className="text-blue-500" />;
        } else if (mimeType.includes("pdf")) {
          return <FaFilePdf className="text-red-500" />;
        } else {
          return <FaFile className="text-gray-500" />;
        }
    }
  };

  // Get appropriate syntax highlighting language
  const getLanguage = () => {
    if (!crateInfo) return "text";

    if (crateInfo.category === CrateCategory.DIAGRAM) {
      return "mermaid";
    } else if (crateInfo.category === CrateCategory.MARKDOWN ||
      crateInfo.category === CrateCategory.TODOLIST) {
      return "markdown";
    } else if (crateInfo.category === CrateCategory.DATA || crateInfo.category === CrateCategory.JSON) { // Added JSON category
      // Check if it's JSON or another data format
      return crateInfo.mimeType?.includes("json") ? "json" : "text";
    } else if (crateInfo.category === CrateCategory.CODE) {
      // Try to determine the language from the mime type or file extension
      const mimeType = crateInfo.mimeType?.toLowerCase() || "";
      if (mimeType.includes("javascript")) {
        return "javascript";
      } else if (mimeType.includes("typescript")) {
        return "typescript";
      } else if (mimeType.includes("html")) {
        return "html";
      } else if (mimeType.includes("css")) {
        return "css";
      } else {
        return "text";
      }
    } else {
      return "text";
    }
  };

  // Render metadata key-value pairs
  const renderMetadata = (metadata?: Record<string, string>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    return (
      <div className="mt-2 text-xs text-gray-600">
        <div className="font-semibold mb-1">Metadata:</div>
        <ul className="list-disc ml-4">
          {Object.entries(metadata).map(([key, value]) => (
            <li key={key}>
              <span className="font-medium">{key}:</span> {value}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render tags
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 text-xs">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Render a To-Do list from markdown content
  const renderTodoList = (markdownContent: string) => {
    const lines = markdownContent.split('\n');
    return (
      <ul className="list-none p-0 m-0">
        {lines.map((line, index) => {
          const taskMatch = line.match(/^- \[( |x|X)\] (.*)/);
          if (taskMatch) {
            const isChecked = taskMatch[1] !== ' ';
            const taskText = taskMatch[2];
            return (
              <li key={index} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className={`text-sm ${isChecked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {taskText}
                </span>
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  // Category-specific content renderer
  const renderContent = () => {
    if (!crateInfo || !crateContent) return null;

    switch (crateInfo.category) {
      case CrateCategory.MARKDOWN:
        return (
          <div className="p-4 prose max-w-none">
            <ReactMarkdown>{crateContent}</ReactMarkdown>
          </div>
        );

      case CrateCategory.TODOLIST:
        return (
          <div className="bg-gray-50 rounded border p-4 max-h-96 overflow-auto">
            {renderTodoList(crateContent)}
          </div>
        );

      case CrateCategory.DIAGRAM:
        return <MermaidDiagram>{crateContent}</MermaidDiagram>;

      case CrateCategory.DATA:
        return (
          <div className="text-sm">
            <SyntaxHighlighter
              language={getLanguage()}
              showLineNumbers
            >
              {crateContent}
            </SyntaxHighlighter>
          </div>
        );

      case CrateCategory.CODE:
        return (
          <div className="text-sm">
            <SyntaxHighlighter
              language={getLanguage()}
              showLineNumbers
            >
              {crateContent}
            </SyntaxHighlighter>
          </div>
        );

      case CrateCategory.JSON: // Added JSON category
        return (
          <div className="text-sm">
            <SyntaxHighlighter
              language={getLanguage()}
              showLineNumbers
            >
              {crateContent}
            </SyntaxHighlighter>
          </div>
        );

      default:
        return (
          <div className="p-4 text-gray-600 text-center">
            This content type doesn't have a preview.
          </div>
        );
    }
  };

  // Password form for protected crates
  const renderPasswordForm = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center justify-center mb-4">
            <FaLock className="text-primary-500 text-3xl" />
          </div>
          <h1 className="text-xl font-medium text-center text-gray-800 mb-4">
            Password Protected Crate
          </h1>
          <p className="text-gray-600 mb-4 text-center">
            This crate requires a password to access.
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {passwordError && (
              <div className="mb-4 text-red-600 text-sm">{passwordError}</div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={contentLoading}
                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {contentLoading ? "Loading..." : "Access Crate"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-primary-500 hover:text-primary-600 text-sm"
            >
              Return to Home
            </Link>
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-10 bg-primary-100 rounded-full mb-4"></div>
            <div className="h-5 w-40 bg-gray-200 rounded mb-3"></div>
            <div className="h-3 w-24 bg-gray-100 rounded mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (passwordRequired && !crateContent) {
    return renderPasswordForm();
  }

  if (error || !crateInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-sm p-6 text-center">
          <FaExclamationTriangle className="text-yellow-500 text-2xl mx-auto mb-3" />
          <h1 className="text-lg font-medium text-gray-800 mb-2">
            Crate Unavailable
          </h1>
          <p className="text-gray-600 mb-5 text-sm">
            {error || "Unable to retrieve crate information"}
          </p>

          <div className="flex justify-center space-x-4 mt-2">
            <Link
              href="/"
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
            >
              Home
            </Link>
            <Link
              href="/upload"
              className="px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-sm"
            >
              <FaUpload className="inline mr-1 text-xs" /> Upload
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Prepare usage chart data from access history
  const usageChartData = crateInfo.accessHistory
    ? crateInfo.accessHistory.map((entry) => ({
      label: entry.date.split("-").slice(1).join("/"), // Format as MM/DD
      value: entry.count,
    }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb navigation */}
        <div className="mb-3 flex items-center text-sm">
          <Link
            href="/"
            className="text-gray-500 hover:text-primary-500 transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">Crate Details</span>
        </div>

        {/* Main Info Card */}
        <Card className="mb-4">
          <Card.Header className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="p-2 bg-gray-50 rounded-full mr-3">
                {getCrateIcon()}
              </span>
              <div>
                <h1
                  className="font-medium text-gray-800 mb-0.5"
                  title={crateInfo.title}
                >
                  {crateInfo.title}
                </h1>
                <div className="text-xs text-gray-500">
                  {formatBytes(crateInfo.size || 0)} • {crateInfo.mimeType} •
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {crateInfo.category}
                  </span>
                </div>
              </div>
            </div>

            {timeRemaining && (
              <div className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 flex items-center">
                <FaClock className="mr-1" /> {timeRemaining} remaining
              </div>
            )}
          </Card.Header>

          <Card.Body>
            {/* Sharing status and password protection */}
            <div className="mb-4 flex items-center gap-3">
              {crateInfo.isPublic ? (
                <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                  <FaShareAlt className="mr-1" /> Public (anyone with link)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                  <FaLock className="mr-1" /> Private (only you)
                </span>
              )}
              {crateInfo.isPasswordProtected && (
                <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                  <FaLock className="mr-1" /> Password protected
                </span>
              )}
            </div>

            {/* Description */}
            {crateInfo.description && (
              <div className="text-sm text-gray-700 mb-4 pb-3 border-b border-gray-100">
                {crateInfo.description}
              </div>
            )}

            {/* Tags */}
            {renderTags(crateInfo.tags)}

            {/* Metadata display */}
            {renderMetadata(crateInfo.metadata)}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm mt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Category</div>
                <div className="font-medium">
                  {crateInfo.category}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Downloads</div>
                <div className="font-medium">{crateInfo.downloadCount}</div>
              </div>

              {crateInfo.expiresAt && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Expiration</div>
                  <div>{formatDate(crateInfo.expiresAt)}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-500 mb-1">Size</div>
                <div>
                  {formatBytes(crateInfo.size || 0)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-base font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-colors border border-blue-600"
              >
                <FaFileDownload className="mr-2 text-lg" />
                <span>Download</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {linkCopied ? (
                  <>
                    <FaCheck className="mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <FaShareAlt className="mr-1" /> Share
                  </>
                )}
              </button>

              {/* Show preview button for supported categories */}
              {(crateInfo.category === CrateCategory.MARKDOWN ||
                crateInfo.category === CrateCategory.TODOLIST ||
                crateInfo.category === CrateCategory.DIAGRAM ||
                crateInfo.category === CrateCategory.CODE ||
                crateInfo.category === CrateCategory.DATA ||
                crateInfo.category === CrateCategory.JSON || // Added JSON category
                crateInfo.category === CrateCategory.IMAGE) && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200 transition-colors ml-auto"
                  >
                    <FaEye className="mr-1" />{" "}
                    {showPreview ? "Hide Preview" : "View Content"}
                  </button>
                )}

              {/* Only show reset expiry and delete if owner */}
              {crateInfo.isOwner && (
                <>
                  <button
                    onClick={() => setShowResetExpiry(true)}
                    className="flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 border border-blue-700 font-semibold shadow transition-colors"
                    title="Reset Expiry"
                  >
                    <FaClock className="mr-1" /> Reset Expiry
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 border border-red-700 font-semibold shadow transition-colors"
                    title="Delete Crate"
                  >
                    {deleteLoading ? (
                      "Deleting..."
                    ) : (
                      <>
                        <FaFile className="mr-1" /> Delete
                      </>
                    )}
                  </button>
                </>
              )}

              {deleteError && (
                <div className="text-red-600 mt-2 text-sm">{deleteError}</div>
              )}
            </div>

            {/* Reset Expiry Modal/Inline */}
            {showResetExpiry && (
              <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-white shadow-lg max-w-md">
                <div className="mb-3 font-semibold text-gray-800 text-base">
                  Set new expiry duration (max 29 days):
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    min={expiryUnit === "days" ? 1 : 1}
                    max={expiryUnit === "days" ? 29 : 696}
                    value={expiryAmount}
                    onChange={(e) => setExpiryAmount(Number(e.target.value))}
                    className="border border-gray-300 px-2 py-1 rounded w-20 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                  <select
                    value={expiryUnit}
                    onChange={(e) =>
                      setExpiryUnit(e.target.value as "days" | "hours")
                    }
                    className="border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="days">days</option>
                    <option value="hours">hours</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetExpiry}
                    disabled={resetExpiryLoading || !expiryAmount}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-semibold shadow border border-blue-700 transition-colors"
                  >
                    {resetExpiryLoading ? "Updating..." : "Update Expiry"}
                  </button>
                  <button
                    onClick={() => {
                      setShowResetExpiry(false);
                      setResetExpiryError(null);
                      setExpiryAmount(1);
                      setExpiryUnit("days");
                    }}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
                {resetExpiryError && (
                  <div className="text-red-600 mt-3 text-sm">
                    {resetExpiryError}
                  </div>
                )}
                {resetExpirySuccess && (
                  <div className="text-green-600 mt-3 text-sm">
                    {resetExpirySuccess}
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Preview Card - Only shown when preview is toggled */}
        {showPreview && (
          <Card className="mb-4">
            <Card.Header className="flex justify-between items-center">
              <h2 className="font-medium text-gray-700">
                Crate Preview - {crateInfo.category}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </Card.Header>

            <Card.Body>
              {contentLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-pulse">Loading content...</div>
                </div>
              ) : crateInfo.category === CrateCategory.IMAGE ? (
                <div className="flex items-center justify-center">
                  <Image
                    src={`/api/crates/${crateId}/content`}
                    alt={crateInfo.title}
                    className="max-w-full max-h-96 object-contain"
                    width={600}
                    height={400}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/icon.png";
                      target.style.height = "80px";
                      target.style.width = "80px";
                    }}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded border overflow-auto max-h-96">
                  {renderContent()}
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Usage Stats Card */}
          <StatsCard
            title="Usage Statistics"
            icon={<FaChartBar className="text-primary-500" />}
            tooltip="Crate access statistics over time"
          >
            <div className="mb-5">
              <StatsCard.Grid columns={3} className="mb-4">
                <StatsCard.Stat
                  label="Today"
                  value={accessStats.today}
                  icon={<FaEye />}
                />
                <StatsCard.Stat
                  label="This week"
                  value={accessStats.week}
                  icon={<FaEye />}
                />
                <StatsCard.Stat
                  label="Total views"
                  value={crateInfo.viewCount || 0}
                  icon={<FaEye />}
                />
              </StatsCard.Grid>

              {usageChartData.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">
                    7-Day Access Trend
                  </div>
                  <StatsCard.Chart
                    data={usageChartData}
                    type="bar"
                    height={100}
                    color="#3b82f6"
                  />
                </div>
              )}
            </div>
          </StatsCard>

          {/* Storage Stats */}
          <StatsCard
            title="Storage Details"
            icon={<FaDatabase className="text-blue-500" />}
          >
            <div className="mb-2">
              <StatsCard.Grid columns={2} className="mb-4">
                <StatsCard.Stat
                  label="Size"
                  value={formatBytes(crateInfo.size || 0)}
                  icon={<FaFileAlt />}
                />
                <StatsCard.Stat
                  label="Downloads"
                  value={crateInfo.downloadCount || 0}
                  icon={<FaDownload />}
                />
              </StatsCard.Grid>
              <StatsCard.Stat
                label="Category"
                value={crateInfo.category || "Unknown"}
                icon={getCrateIcon()}
                className="mb-2"
              />
            </div>
          </StatsCard>

          {/* Time Related Stats */}
          <StatsCard
            title="Timeline"
            icon={<FaHistory className="text-purple-500" />}
          >
            <div className="space-y-4">
              <StatsCard.Stat
                label="Created on"
                value={formatDate(crateInfo.createdAt || new Date())}
                icon={<FaCalendarAlt />}
                className="mb-2"
              />

              {crateInfo.expiresAt && (
                <>
                  <StatsCard.Stat
                    label="Expires on"
                    value={formatDate(crateInfo.expiresAt)}
                    icon={<FaClock />}
                    className="mb-2"
                  />

                  {crateInfo.ttlDays && (
                    <div className="mt-3">
                      <StatsCard.Progress
                        label="Time Remaining"
                        value={Math.min(crateInfo.ttlDays, 30)} // Cap at 30 for display
                        max={30} // Assuming max expiry is 30 days
                        color={crateInfo.ttlDays < 3 ? "red" : "primary"}
                      />
                      <div className="text-xs text-gray-500 mt-1 flex justify-end">
                        <span>{crateInfo.ttlDays} days total TTL</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </StatsCard>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center text-sm mt-4 px-1">
          <Link
            href="/"
            className="text-primary-500 hover:text-primary-600 transition-colors flex items-center"
          >
            <FaArrowLeft className="mr-1 text-xs" /> Back to Home
          </Link>
          <Link
            href="/upload"
            className="text-primary-500 hover:text-primary-600 transition-colors flex items-center"
          >
            <FaUpload className="mr-1 text-xs" /> Upload New Crate
          </Link>
        </div>
      </div>
    </div>
  );
}
