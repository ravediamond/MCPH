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
  const {
    getIdToken,
    loading: authLoading,
    user,
    signInWithGoogle,
  } = useAuth(); // Get authentication loading state and user

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

  // New sharing-related state variables
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [sharingPassword, setSharingPassword] = useState("");
  const [sharingError, setSharingError] = useState<string | null>(null);
  const [sharingSuccess, setSharingSuccess] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [sharingLoading, setSharingLoading] = useState(false);

  // Fetch crate metadata only when crateId changes or when auth state changes
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
          headers["Authorization"] = `Bearer ${idToken}`;
        }

        const response = await fetch(`/api/crates/${crateId}`, { headers });
        const data = await response.json(); // Always parse JSON first to check for passwordRequired

        if (response.status === 401 && data.passwordRequired) {
          // Password protected crate, and user is not owner
          setCrateInfo(data); // Set basic info, including isPasswordProtected
          setPasswordRequired(true);
          setLoading(false);
          return;
        }

        if (response.status === 403) {
          // Access denied - handle forbidden errors specifically
          throw new Error(
            "You don't have permission to access this crate. Please sign in or request access from the owner.",
          );
        }

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Crate not found or has expired"
              : "Failed to fetch crate information",
          );
        }

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

    // Only fetch crate data if authentication is not still loading
    if (crateId && !authLoading) {
      fetchCrateMetadata();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [crateId, authLoading, user]);

  // Fetch crate content based on category
  useEffect(() => {
    if (!crateInfo) return;

    const shouldFetchContent = () => {
      switch (crateInfo.category) {
        case CrateCategory.MARKDOWN:
        // Removed for v1: TODOLIST, DIAGRAM, DATA
        case CrateCategory.CODE:
        case CrateCategory.JSON:
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
        .then((content) => {
          setCrateContent(content);
          setPasswordRequired(false);
        })
        .catch((err) => {
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
      "Content-Type": "application/json",
    };

    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    // Use content endpoint for better performance and direct access
    const response = await fetch(`/api/crates/${crateId}/content`, {
      method: "POST",
      headers,
      body: JSON.stringify({ password }),
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
      .then((content) => {
        setCrateContent(content);
        setPasswordRequired(false);
      })
      .catch((err) => {
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
    // Ensure the URL points to the correct API endpoint for downloading crates
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

  // New function to handle opening the sharing modal
  const handleOpenSharingModal = () => {
    if (!crateInfo) return;

    setIsPublic(crateInfo.isPublic);
    setIsPasswordProtected(crateInfo.isPasswordProtected);
    setSharingPassword("");
    setSharingError(null);
    setSharingSuccess(null);
    setShareUrl(`${window.location.origin}/crate/${crateId}`);
    setShowSharingModal(true);
  };

  // New function to update sharing settings
  const handleUpdateSharing = async () => {
    if (!crateInfo) return;

    setSharingLoading(true);
    setSharingError(null);
    setSharingSuccess(null);

    try {
      // Get the auth token
      const idToken = await getIdToken();

      // Include the auth token in the request headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      // Prepare the request body
      const body: any = {
        public: isPublic,
        passwordProtected: isPasswordProtected,
      };

      // Include password if it's set and the crate is password protected
      if (isPasswordProtected && sharingPassword) {
        body.password = sharingPassword;
      }

      // If the password protection is turned off, remove the password
      if (!isPasswordProtected) {
        body.removePassword = true;
      }

      const response = await fetch(`/api/crates/${crateId}/share`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update sharing settings");
      }

      // Update local state
      setCrateInfo({
        ...crateInfo,
        isPublic: data.isShared,
        isPasswordProtected: data.passwordProtected,
      });

      setShareUrl(data.shareUrl);
      setSharingSuccess("Sharing settings updated successfully");

      // If the crate is now public, copy the link to clipboard
      if (data.isShared) {
        navigator.clipboard.writeText(data.shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch (error: any) {
      setSharingError(error.message || "Failed to update sharing settings");
    } finally {
      setSharingLoading(false);
    }
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
      // Get the auth token
      const idToken = await getIdToken();

      // Include the auth token in the request headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      } else {
        console.warn("No authentication token available for delete operation");
      }

      const response = await fetch(`/api/crates/${crateId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to delete crate (${response.status})`,
        );
      }

      // Redirect to the home page instead of the root
      window.location.href = "/home";
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
      // Removed for v1: TODOLIST, DIAGRAM, DATA categories
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

    // Removed DIAGRAM, TODOLIST for v1 simplification
    if (crateInfo.category === CrateCategory.MARKDOWN) {
      return "markdown";
    } else if (crateInfo.category === CrateCategory.JSON) {
      // Check if it's JSON 
      return "json";
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
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Note: Removed todolist rendering function for v1 simplification

  // Enhanced content preview renderer
  const renderPreview = () => {
    if (!crateContent || !crateInfo) return null;

    switch (crateInfo.category) {
      case CrateCategory.JSON: // Enhanced JSON rendering
        try {
          // Try to parse JSON for better rendering
          const jsonData = JSON.parse(crateContent);
          return (
            <div className="text-sm">
              <div className="bg-gray-50 p-2 mb-2 flex justify-between items-center rounded border border-gray-200">
                <span className="text-gray-700 font-medium">JSON Preview</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      window.open(`/api/crates/${crateId}/content`, "_blank")
                    }
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <FaExternalLinkAlt className="inline mr-1" />
                    Open Raw
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <FaDownload className="inline mr-1" />
                    Download
                  </button>
                </div>
              </div>
              <div className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-[500px]">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(jsonData, null, 2)}
                </pre>
              </div>
            </div>
          );
        } catch (e) {
          // Fallback to regular code highlighting if JSON parsing fails
          return (
            <div className="text-sm">
              <SyntaxHighlighter language={getLanguage()} showLineNumbers>
                {crateContent}
              </SyntaxHighlighter>
            </div>
          );
        }

      case CrateCategory.MARKDOWN: // Enhanced markdown rendering
        return (
          <div className="text-sm">
            <div className="bg-gray-50 p-2 mb-2 flex justify-between items-center rounded border border-gray-200">
              <span className="text-gray-700 font-medium">
                Markdown Preview
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    window.open(`/api/crates/${crateId}/content`, "_blank")
                  }
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <FaExternalLinkAlt className="inline mr-1" />
                  Open Raw
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <FaDownload className="inline mr-1" />
                  Download
                </button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none p-4 bg-white rounded border border-gray-100">
              <ReactMarkdown>{crateContent}</ReactMarkdown>
            </div>
          </div>
        );

      // Removed DIAGRAM category for v1 simplification

      case CrateCategory.CODE: // Enhanced code rendering
        return (
          <div className="text-sm">
            <div className="bg-gray-50 p-2 mb-2 flex justify-between items-center rounded border border-gray-200">
              <span className="text-gray-700 font-medium">Code Preview</span>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    window.open(`/api/crates/${crateId}/content`, "_blank")
                  }
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <FaExternalLinkAlt className="inline mr-1" />
                  Open Raw
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <FaDownload className="inline mr-1" />
                  Download
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[500px] rounded border border-gray-200">
              <SyntaxHighlighter language={getLanguage()} showLineNumbers>
                {crateContent}
              </SyntaxHighlighter>
            </div>
          </div>
        );

      case CrateCategory.IMAGE: // Enhanced image preview
        return (
          <div className="text-sm">
            <div className="bg-gray-50 p-2 mb-2 flex justify-between items-center rounded border border-gray-200">
              <span className="text-gray-700 font-medium">Image Preview</span>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    window.open(`/api/crates/${crateId}/content`, "_blank")
                  }
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <FaExternalLinkAlt className="inline mr-1" />
                  Open Full Size
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <FaDownload className="inline mr-1" />
                  Download
                </button>
              </div>
            </div>
            <div className="flex justify-center p-4 bg-white rounded border border-gray-100">
              <img
                src={`/api/crates/${crateId}/content`}
                alt={crateInfo.title}
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
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

      // Removed for v1: TODOLIST, DIAGRAM, DATA categories
      
      case CrateCategory.CODE:
        return (
          <div className="text-sm">
            <SyntaxHighlighter language={getLanguage()} showLineNumbers>
              {crateContent}
            </SyntaxHighlighter>
          </div>
        );

      case CrateCategory.JSON: // Added JSON category
        return (
          <div className="text-sm">
            <SyntaxHighlighter language={getLanguage()} showLineNumbers>
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-base font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-colors border border-blue-600 disabled:opacity-50"
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

          {error?.includes("permission") && (
            <div className="mb-4">
              <button
                onClick={() => signInWithGoogle()}
                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Sign in to access your crate
              </button>
              <p className="text-xs text-gray-500 mt-2">
                If you created this crate, signing in will give you access.
              </p>
            </div>
          )}

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
      {/* Sharing Modal */}
      {showSharingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Manage Sharing
              </h3>
              <button
                onClick={() => setShowSharingModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>

            {sharingError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
                {sharingError}
              </div>
            )}

            {sharingSuccess && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 text-sm rounded">
                {sharingSuccess}
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Make crate public (anyone with link can view)
                </span>
              </label>

              {isPublic && (
                <div className="ml-6 mt-2">
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={isPasswordProtected}
                      onChange={(e) => setIsPasswordProtected(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Require password to access
                    </span>
                  </label>

                  {isPasswordProtected && (
                    <div className="ml-6 mt-2">
                      <label className="block text-sm text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={sharingPassword}
                        onChange={(e) => setSharingPassword(e.target.value)}
                        placeholder="Enter a password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {isPublic && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Share URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="bg-primary-600 px-4 text-white rounded-r-md hover:bg-primary-700"
                  >
                    {linkCopied ? (
                      <FaCheck className="inline" />
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This link allows anyone to view your crate.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-5">
              <button
                onClick={() => setShowSharingModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSharing}
                disabled={sharingLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {sharingLoading ? "Updating..." : "Update Sharing"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="font-medium">{crateInfo.category}</div>
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
                <div>{formatBytes(crateInfo.size || 0)}</div>
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
                onClick={handleOpenSharingModal}
                className="flex items-center justify-center px-3 py-1.5 bg-green-100 text-sm text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                <FaShareAlt className="mr-1" /> Manage Sharing
              </button>

              {/* Show preview button for supported categories */}
              {(crateInfo.category === CrateCategory.MARKDOWN ||
                crateInfo.category === CrateCategory.CODE ||
                crateInfo.category === CrateCategory.JSON ||
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
                  <img
                    src={`/api/crates/${crateId}/content`}
                    alt={crateInfo.title}
                    className="max-w-full max-h-96 object-contain"
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
                  {renderPreview()}
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
