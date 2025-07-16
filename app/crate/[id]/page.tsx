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
  FaComments,
  FaTwitter,
  FaReddit,
  FaLinkedin,
  FaDiscord,
  FaTelegram,
  FaEnvelope,
  FaLink,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaCopy,
} from "react-icons/fa";
import dynamic from "next/dynamic";
import Image from "next/image";
import Card from "../../../components/ui/Card";
import StatsCard from "../../../components/ui/StatsCard";
import { Crate, CrateCategory } from "../../../shared/types/crate";
import { useAuth } from "../../../contexts/AuthContext"; // Import useAuth hook

// Dynamic imports for markdown and code rendering
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter"), {
  ssr: false,
});

// Import syntax highlighting theme
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

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
interface CrateResponse extends Omit<Partial<Crate>, "expiresAt"> {
  id: string;
  title: string;
  expiresAt?: string;
  isPublic: boolean;
  isPasswordProtected: boolean;
  isOwner: boolean;
  viewCount?: number;
  tags?: string[];
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
  // No more expiry reset functionality as crates no longer expire when logged in
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

  // New copy-related state variables
  const [copyLoading, setCopyLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Social sharing state variables
  const [socialShareMessage, setSocialShareMessage] = useState("");
  const [socialLinkCopied, setSocialLinkCopied] = useState(false);

  // Editing state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

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
          // Ensure tags is always an array
          const processedData = {
            ...data,
            tags: Array.isArray(data.tags) ? data.tags : [],
          };
          setCrateInfo(processedData); // Set basic info, including isPasswordProtected
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

        // Process tags to ensure they're in the correct format
        const processedTags = (() => {
          if (Array.isArray(data.tags)) {
            return data.tags;
          } else if (typeof data.tags === "object" && data.tags !== null) {
            // Handle case where tags is an object - convert to array of values
            return Object.values(data.tags);
          } else if (typeof data.tags === "string") {
            return [data.tags];
          } else {
            return [];
          }
        })();

        const processedData = {
          ...data,
          tags: processedTags,
        };

        setCrateInfo(processedData);

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
        case CrateCategory.TEXT:
        case CrateCategory.CODE:
        case CrateCategory.DATA:
        case CrateCategory.DATA:
        case CrateCategory.TEXT:
        case CrateCategory.POLL:
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

  // Convert markdown to platform-specific formats
  const convertMarkdownForPlatform = (
    markdown: string,
    platform: string,
  ): string => {
    if (!markdown) return markdown;

    let converted = markdown;

    switch (platform) {
      case "discord":
      case "reddit":
        // These platforms support markdown natively, so keep it as-is
        return converted;

      case "telegram":
        // Telegram supports basic markdown but with different syntax
        converted = converted
          // Bold: **text** or __text__ -> *text*
          .replace(/\*\*(.*?)\*\*/g, "*$1*")
          .replace(/__(.*?)__/g, "*$1*")
          // Italic: *text* or _text_ -> _text_
          .replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, "_$1_");
        // Code: `text` -> `text` (same)
        // Links: [text](url) -> [text](url) (same)
        return converted;

      case "twitter":
      case "linkedin":
      case "email":
      default:
        // Convert markdown to plain text for platforms that don't support it
        converted = converted
          // Remove bold/italic formatting but keep the text
          .replace(/\*\*(.*?)\*\*/g, "$1") // **bold** -> bold
          .replace(/__(.*?)__/g, "$1") // __bold__ -> bold
          .replace(/\*(.*?)\*/g, "$1") // *italic* -> italic
          .replace(/_(.*?)_/g, "$1") // _italic_ -> italic
          // Convert links to just the URL or "text (url)" format
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") // [text](url) -> text (url)
          // Remove code formatting
          .replace(/`([^`]+)`/g, "$1") // `code` -> code
          // Remove headers
          .replace(/^#+\s*/gm, ""); // # Header -> Header
        return converted;
    }
  };

  // Social sharing functions
  const generateShareUrl = (platform: string, customMessage?: string) => {
    const currentUrl = `${window.location.origin}/crate/${crateId}`;
    const rawMessage =
      customMessage ||
      socialShareMessage ||
      `Check out this AI artifact: ${crateInfo?.title} - ${currentUrl}`;

    // Convert markdown based on platform
    const message = convertMarkdownForPlatform(rawMessage, platform);
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(
      crateInfo?.title || `Crate ${crateId}`,
    );

    switch (platform) {
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodedMessage}`;
      case "reddit":
        // For Reddit, use text post format with title and body
        const redditTitle = encodeURIComponent(
          crateInfo?.title || `Check out this AI artifact`,
        );
        const redditBody = encodeURIComponent(
          `${message}\n\nLink: ${currentUrl}`,
        );
        return `https://www.reddit.com/submit?selftext=true&title=${redditTitle}&selftext=${redditBody}`;
      case "linkedin":
        // LinkedIn doesn't accept custom text via URL, so just share the URL
        // The user will need to add their custom message manually in LinkedIn
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case "discord":
        return null; // Discord doesn't have a direct share URL
      case "telegram":
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
      case "email":
        return `mailto:?subject=${encodedTitle}&body=${encodedMessage}`;
      default:
        return null;
    }
  };

  const handleSocialShare = (platform: string) => {
    const customMessage = socialShareMessage.trim() || undefined;
    const shareUrl = generateShareUrl(platform, customMessage);

    if (platform === "discord") {
      // For Discord, copy the markdown-formatted message to clipboard
      const rawMessage =
        customMessage ||
        `Check out this AI artifact: **${crateInfo?.title}** - ${window.location.origin}/crate/${crateId}`;
      const formattedMessage = convertMarkdownForPlatform(rawMessage, platform);
      navigator.clipboard.writeText(formattedMessage);
      setSocialLinkCopied(true);
      setTimeout(() => setSocialLinkCopied(false), 2000);
    } else if (platform === "linkedin") {
      // For LinkedIn, open the share dialog and show a message about adding custom text
      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
        // Show a brief message about manually adding the custom text
        if (customMessage) {
          // Copy the message to clipboard for easy pasting
          navigator.clipboard.writeText(
            convertMarkdownForPlatform(customMessage, platform),
          );
          setSocialLinkCopied(true);
          setTimeout(() => setSocialLinkCopied(false), 3000);
        }
      }
    } else if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopySocialLink = async () => {
    try {
      const currentUrl = `${window.location.origin}/crate/${crateId}`;
      await navigator.clipboard.writeText(currentUrl);
      setSocialLinkCopied(true);
      setTimeout(() => setSocialLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Editing functions
  const handleEditStart = () => {
    if (!crateInfo) return;
    setEditTitle(crateInfo.title || "");
    setEditDescription(crateInfo.description || "");
    setEditTags(crateInfo.tags || []);
    setNewTag("");
    setEditError(null);
    setEditSuccess(null);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditDescription("");
    setEditTags([]);
    setNewTag("");
    setEditError(null);
    setEditSuccess(null);
  };

  const handleAddTag = () => {
    if (!newTag.trim() || editTags.includes(newTag.trim())) {
      setNewTag("");
      return;
    }
    setEditTags([...editTags, newTag.trim()]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveEdit = async () => {
    if (!crateInfo) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const idToken = await getIdToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const response = await fetch(`/api/crates/${crateId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          tags: editTags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update crate");
      }

      // Update local state
      setCrateInfo({
        ...crateInfo,
        title: editTitle.trim(),
        description: editDescription.trim(),
        tags: editTags,
      });

      setEditSuccess("Crate updated successfully!");
      setIsEditing(false);
      setTimeout(() => setEditSuccess(null), 3000);
    } catch (error: any) {
      setEditError(error.message || "Failed to update crate");
    } finally {
      setEditLoading(false);
    }
  };

  // New function to handle opening the sharing modal
  const handleOpenSharingModal = () => {
    if (!crateInfo) return;

    console.log("[DEBUG] Opening sharing modal with crate info:", {
      isPublic: crateInfo.isPublic,
      isPasswordProtected: crateInfo.isPasswordProtected,
    });

    setIsPublic(crateInfo.isPublic);
    setIsPasswordProtected(crateInfo.isPasswordProtected);
    setSharingPassword("");
    setSharingError(null);
    setSharingSuccess(null);
    setShareUrl(`${window.location.origin}/crate/${crateId}`);
    setSocialShareMessage(
      `Check out this AI artifact: ${crateInfo.title} - ${window.location.origin}/crate/${crateId}`,
    );
    setShowSharingModal(true);
  };

  // New function to copy crate to user's collection
  const handleCopyCrate = async () => {
    if (!crateInfo) return;

    setCopyLoading(true);
    setCopyError(null);
    setCopySuccess(null);

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

      const response = await fetch(`/api/crates/${crateId}/copy`, {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to copy crate");
      }

      setCopySuccess(
        `Crate copied successfully! New crate: "${data.crate.title}"`,
      );

      // Auto-clear success message after 5 seconds
      setTimeout(() => setCopySuccess(null), 5000);
    } catch (error: any) {
      setCopyError(error.message || "Failed to copy crate");
      // Auto-clear error message after 5 seconds
      setTimeout(() => setCopyError(null), 5000);
    } finally {
      setCopyLoading(false);
    }
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

      console.log("[DEBUG] Sharing update response:", data);

      // Update local state
      const updatedCrateInfo = {
        ...crateInfo,
        isPublic: data.isShared,
        isPasswordProtected: data.passwordProtected,
      };

      console.log("[DEBUG] Updating crate info:", updatedCrateInfo);
      setCrateInfo(updatedCrateInfo);

      setShareUrl(data.shareUrl);
      setSharingSuccess("Sharing settings updated successfully");

      // If the crate is now public, copy the link to clipboard
      if (data.isShared) {
        navigator.clipboard.writeText(data.shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }

      // Auto-close modal after successful update
      setTimeout(() => {
        setShowSharingModal(false);
        setSharingSuccess(null);
      }, 1500);
    } catch (error: any) {
      setSharingError(error.message || "Failed to update sharing settings");
    } finally {
      setSharingLoading(false);
    }
  };

  // Handler to reset expiry has been removed as crates no longer expire when logged in
  // and automatically expire after 7 days when not logged in

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
      case CrateCategory.TEXT:
        return <FaFileAlt className="text-purple-500" />;
      case CrateCategory.CODE:
        return <FaFileCode className="text-yellow-500" />;
      case CrateCategory.IMAGE:
        return <FaFileImage className="text-blue-500" />;
      case CrateCategory.DATA:
        return <FaFileCode className="text-orange-500" />;
      case CrateCategory.DATA:
        return <FaFileCode className="text-green-500" />;
      case CrateCategory.POLL:
        return <FaComments className="text-purple-600" />;
      case CrateCategory.TEXT:
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

  // Format category for display
  const formatCategoryForDisplay = (category: string | undefined) => {
    if (!category) return "Unknown";

    switch (category) {
      case CrateCategory.POLL:
        return "Feedback";
      case CrateCategory.TEXT:
        return "Text";
      case CrateCategory.CODE:
        return "Code";
      case CrateCategory.DATA:
        return "Data";
      case CrateCategory.IMAGE:
        return "Image";
      case CrateCategory.RECIPE:
        return "Recipe";
      default:
        // Capitalize first letter for any other categories
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  // Get appropriate syntax highlighting language
  const getLanguage = () => {
    if (!crateInfo) return "text";

    // Removed DIAGRAM, TODOLIST for v1 simplification
    if (crateInfo.category === CrateCategory.TEXT) {
      return "markdown";
    } else if (crateInfo.category === CrateCategory.DATA) {
      // Check if it's JSON or YAML based on file content/type
      const mimeType = crateInfo.mimeType?.toLowerCase() || "";
      const fileName = crateInfo.fileName?.toLowerCase() || "";
      if (mimeType.includes("json") || fileName.endsWith(".json")) {
        return "json";
      } else if (
        mimeType.includes("yaml") ||
        fileName.endsWith(".yaml") ||
        fileName.endsWith(".yml")
      ) {
        return "yaml";
      } else {
        return "text";
      }
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

  // Copy content to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("Content copied to clipboard!");
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setCopyError("Failed to copy content");
      setTimeout(() => setCopyError(null), 2000);
    }
  };

  // Enhanced SyntaxHighlighter component with copy button
  const EnhancedSyntaxHighlighter: React.FC<{
    children: string;
    language: string;
    title?: string;
  }> = ({ children, language, title }) => {
    return (
      <div className="relative group">
        {title && (
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 rounded-t text-sm font-medium text-gray-700">
            {title}
          </div>
        )}
        <div className="relative">
          <SyntaxHighlighter
            language={language}
            showLineNumbers
            style={oneLight}
            customStyle={{
              margin: 0,
              borderRadius: title ? "0 0 0.5rem 0.5rem" : "0.5rem",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
          >
            {children}
          </SyntaxHighlighter>
          <button
            onClick={() => copyToClipboard(children)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white hover:bg-gray-50 border border-gray-300 rounded p-2 shadow-sm"
            title="Copy to clipboard"
          >
            <FaCopy className="text-gray-600 hover:text-gray-800" size={14} />
          </button>
        </div>
      </div>
    );
  };

  // Format tag display - similar to home page tag formatting
  const formatTagDisplay = (tag: string, fullDisplay = true) => {
    if (!tag.includes(":")) return tag;

    const [type, value] = tag.split(":");

    return fullDisplay ? `${type}: ${value}` : value;
  };

  // Get tag style based on tag prefix
  const getTagStyle = (tag: string) => {
    if (tag.startsWith("project:")) {
      return "bg-purple-100 text-purple-800";
    } else if (tag.startsWith("status:")) {
      return "bg-blue-100 text-blue-800";
    } else if (tag.startsWith("priority:")) {
      return "bg-red-100 text-red-800";
    } else if (tag.startsWith("tag:")) {
      return "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  // Render tags for the crate
  const renderTags = (tags?: string[] | any) => {
    if (isEditing) {
      return (
        <div className="mb-4 border border-blue-200 p-3 rounded">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Tags ({editTags.length})
          </h3>

          {/* Existing tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {editTags.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center ${getTagStyle(tag)} text-sm px-3 py-1.5 rounded-full shadow-sm`}
              >
                {formatTagDisplay(tag)}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-xs hover:text-red-500"
                  title="Remove tag"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
          </div>

          {/* Add new tag */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag (e.g., project:myapp, status:draft)"
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Add tag"
            >
              <FaPlus size={12} />
            </button>
          </div>
        </div>
      );
    }

    // Process tags to ensure we have a usable array (non-editing mode)
    let processedTags: string[] = [];

    if (Array.isArray(tags)) {
      processedTags = tags;
    } else if (typeof tags === "object" && tags !== null) {
      // Handle case where tags is an object - convert to array of values
      processedTags = Object.values(tags);
    } else if (typeof tags === "string") {
      processedTags = [tags];
    }

    // Check if processed tags exists and has items
    if (processedTags.length === 0) {
      return null;
    }

    return (
      <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <div className="flex items-center mb-3">
          <svg
            className="w-4 h-4 mr-2 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700">
            Tags ({processedTags.length})
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {processedTags.map((tag, index) => (
            <span
              key={index}
              className={`inline-flex items-center ${getTagStyle(tag)} text-sm px-3 py-2 rounded-full shadow-sm font-medium border`}
              title={tag}
            >
              {formatTagDisplay(tag)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render metadata for the crate
  const renderMetadata = (metadata?: Record<string, string>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    return (
      <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center mb-3">
          <svg
            className="w-4 h-4 mr-2 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-sm font-semibold text-blue-700">Metadata</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(metadata).map(([key, value]) => (
            <div
              key={key}
              className="bg-white p-3 rounded border border-blue-200"
            >
              <div className="text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                {key}
              </div>
              <div className="text-sm text-blue-700">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Note: Removed todolist rendering function for v1 simplification

  // Enhanced content preview renderer
  const renderPreview = () => {
    if (!crateContent || !crateInfo) return null;

    switch (crateInfo.category) {
      case CrateCategory.DATA: // Enhanced JSON rendering
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
              <EnhancedSyntaxHighlighter
                language={getLanguage()}
                title="Content"
              >
                {crateContent}
              </EnhancedSyntaxHighlighter>
            </div>
          );
        }

      case CrateCategory.DATA: // Enhanced YAML rendering
        return (
          <div className="text-sm">
            <div className="bg-gray-50 p-2 mb-2 flex justify-between items-center rounded border border-gray-200">
              <span className="text-gray-700 font-medium">YAML Preview</span>
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
              <EnhancedSyntaxHighlighter language="yaml" title="YAML Content">
                {crateContent}
              </EnhancedSyntaxHighlighter>
            </div>
          </div>
        );

      case CrateCategory.TEXT: // Enhanced markdown rendering
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
              <EnhancedSyntaxHighlighter
                language={getLanguage()}
                title="Code Content"
              >
                {crateContent}
              </EnhancedSyntaxHighlighter>
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

      case CrateCategory.TEXT: // Enhanced text rendering
        return (
          <div className="text-sm">
            <div className="bg-gray-50 p-2 mb-2 flex justify-between items-center rounded border border-gray-200">
              <span className="text-gray-700 font-medium">Text Preview</span>
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
            <div className="overflow-auto max-h-[500px] rounded border border-gray-200 p-4 bg-white">
              <pre className="whitespace-pre-wrap font-mono text-gray-800">
                {crateContent}
              </pre>
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
      case CrateCategory.TEXT:
        return (
          <div className="p-4 prose max-w-none">
            <ReactMarkdown>{crateContent}</ReactMarkdown>
          </div>
        );

      // Removed for v1: TODOLIST, DIAGRAM, DATA categories

      case CrateCategory.CODE:
        return (
          <div className="text-sm">
            <EnhancedSyntaxHighlighter language={getLanguage()} title="Code">
              {crateContent}
            </EnhancedSyntaxHighlighter>
          </div>
        );

      case CrateCategory.DATA: // Added JSON category
        return (
          <div className="text-sm">
            <EnhancedSyntaxHighlighter language={getLanguage()} title="JSON">
              {crateContent}
            </EnhancedSyntaxHighlighter>
          </div>
        );

      case CrateCategory.TEXT: // Added TEXT category
        return (
          <div className="text-sm">
            <pre className="whitespace-pre-wrap p-4 font-mono text-gray-800 bg-gray-50 rounded border border-gray-200">
              {crateContent}
            </pre>
          </div>
        );

      case CrateCategory.DATA: // Added YAML category
        return (
          <div className="text-sm">
            <EnhancedSyntaxHighlighter language={getLanguage()} title="YAML">
              {crateContent}
            </EnhancedSyntaxHighlighter>
          </div>
        );

      case CrateCategory.POLL:
        // For feedback templates, show the template structure and fields
        let feedbackData;
        try {
          feedbackData = crateContent ? JSON.parse(crateContent) : null;
        } catch (e) {
          feedbackData = null;
        }

        if (!feedbackData) {
          return (
            <div className="p-4 text-gray-600 text-center">
              Unable to load feedback template data.
            </div>
          );
        }

        return (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Feedback Template Preview
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {feedbackData.description || "No description provided"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      feedbackData.isOpen
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {feedbackData.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Visibility:</span>
                  <span className="ml-2 text-gray-600">
                    {feedbackData.isPublic ? "Public" : "Private"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Fields:</span>
                  <span className="ml-2 text-gray-600">
                    {feedbackData.fields?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Responses:</span>
                  <span className="ml-2 text-gray-600">
                    {feedbackData.submissionCount || 0}
                  </span>
                </div>
              </div>

              {feedbackData.fields && feedbackData.fields.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">
                    Form Fields:
                  </h4>
                  <div className="space-y-3">
                    {feedbackData.fields.map((field: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-800">
                            {field.label}
                          </span>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Key:{" "}
                          <code className="bg-gray-200 px-1 rounded">
                            {field.key}
                          </code>
                        </div>
                        {field.options && (
                          <div className="text-sm text-gray-600 mt-1">
                            Options: {field.options.join(", ")}
                          </div>
                        )}
                        {field.placeholder && (
                          <div className="text-sm text-gray-600 mt-1">
                            Placeholder: "{field.placeholder}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedbackData.linkedCrates &&
                feedbackData.linkedCrates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      Linked Crates:
                    </h4>
                    <div className="text-sm text-gray-600">
                      {feedbackData.linkedCrates.join(", ")}
                    </div>
                  </div>
                )}
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
      {/* Breadcrumb Navigation */}
      <div className="max-w-6xl mx-auto mb-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link
            href="/home"
            className="hover:text-primary-600 transition-colors duration-200 flex items-center"
          >
            <FaArrowLeft className="mr-1" size={12} />
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href="/crates"
            className="hover:text-primary-600 transition-colors duration-200"
          >
            My Crates
          </Link>
          <span className="text-gray-400">/</span>
          <span
            className="text-gray-800 font-medium truncate max-w-xs"
            title={crateInfo?.title}
          >
            {crateInfo?.title || "Crate"}
          </span>
        </nav>
      </div>

      {/* Sharing Modal */}
      {showSharingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-4">
              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    Public Access
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isPublic
                      ? "Anyone with the link can view this crate"
                      : "Only you can access this crate"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    isPublic ? "bg-primary-600" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={isPublic}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPublic ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Password Protection Toggle - only shown when public */}
              {isPublic && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      Password Protection
                    </h4>
                    <p className="text-sm text-gray-500">
                      {isPasswordProtected
                        ? "Viewers must enter a password to access"
                        : "No password required for access"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                      isPasswordProtected ? "bg-yellow-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={isPasswordProtected}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPasswordProtected ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Password Input - only shown when password protection is enabled */}
              {isPublic && isPasswordProtected && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Password
                  </label>
                  <input
                    type="password"
                    value={sharingPassword}
                    onChange={(e) => setSharingPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a strong password to protect your crate
                  </p>
                </div>
              )}
            </div>

            {isPublic && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Share URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className={`px-4 py-2 text-white rounded-r-md transition-colors ${
                      linkCopied
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-primary-600 hover:bg-primary-700"
                    }`}
                  >
                    {linkCopied ? (
                      <>
                        <FaCheck className="inline mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FaShareAlt className="inline mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-blue-600">
                  <FaInfoCircle className="inline mr-1" />
                  Anyone with this link can{" "}
                  {isPasswordProtected
                    ? "view your crate (with password)"
                    : "view your crate"}
                </p>
              </div>
            )}

            {/* Social Sharing Section - Only shown when public */}
            {isPublic && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Share on Social Media
                </h4>

                {/* Custom Message Editor */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Customize Share Message
                    <span className="text-gray-500 font-normal ml-1">
                      (Markdown supported)
                    </span>
                  </label>
                  <textarea
                    value={socialShareMessage}
                    onChange={(e) => setSocialShareMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="**Bold text**, *italic text*, [link text](url), `code`..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    ✓ Discord: Copies formatted message • Reddit: Creates text
                    post with title & body • LinkedIn: Opens share dialog +
                    copies message for pasting • Twitter/Telegram/Email: Full
                    support
                  </p>
                </div>

                {/* Social Platform Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={() => handleSocialShare("twitter")}
                    className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-500 hover:text-blue-600 hover:border-blue-300"
                    title="Share on Twitter/X"
                  >
                    <FaTwitter className="mr-2 text-lg" />
                    <span className="text-sm font-medium">Twitter/X</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare("reddit")}
                    className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-orange-50 text-orange-500 hover:text-orange-600 hover:border-orange-300"
                    title="Create Reddit text post with title and body"
                  >
                    <FaReddit className="mr-2 text-lg" />
                    <span className="text-sm font-medium">Reddit</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare("linkedin")}
                    className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-700 hover:text-blue-800 hover:border-blue-300"
                    title="Open LinkedIn share dialog (copies message for manual pasting)"
                  >
                    <FaLinkedin className="mr-2 text-lg" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare("discord")}
                    className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 hover:border-indigo-300"
                    title="Copy formatted message to clipboard for Discord"
                  >
                    <FaDiscord className="mr-2 text-lg" />
                    <span className="text-sm font-medium">Discord</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare("telegram")}
                    className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-blue-50 text-blue-400 hover:text-blue-500 hover:border-blue-300"
                    title="Share on Telegram"
                  >
                    <FaTelegram className="mr-2 text-lg" />
                    <span className="text-sm font-medium">Telegram</span>
                  </button>

                  <button
                    onClick={() => handleSocialShare("email")}
                    className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg transition-all hover:bg-gray-50 text-gray-500 hover:text-gray-600 hover:border-gray-300"
                    title="Share via Email"
                  >
                    <FaEnvelope className="mr-2 text-lg" />
                    <span className="text-sm font-medium">Email</span>
                  </button>
                </div>

                {/* Copy Link Button */}
                <button
                  onClick={handleCopySocialLink}
                  className={`w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    socialLinkCopied
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {socialLinkCopied ? (
                    <>
                      <FaCheck className="mr-2" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <FaLink className="mr-2" />
                      Copy Link
                    </>
                  )}
                </button>

                <p className="mt-2 text-xs text-gray-500">
                  • <strong>Discord:</strong> Copies formatted message to
                  clipboard
                  <br />• <strong>Reddit:</strong> Creates text post with title
                  & body
                  <br />• <strong>LinkedIn:</strong> Opens share dialog + copies
                  message for pasting
                  <br />• <strong>Twitter/Telegram/Email:</strong> Opens with
                  custom message
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSharingModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSharing}
                disabled={
                  sharingLoading ||
                  (isPasswordProtected && isPublic && !sharingPassword)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                {sharingLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Main Info Card */}
        <Card className="mb-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <Card.Header className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
            <div className="flex items-center flex-1">
              <span className="p-3 bg-white rounded-xl shadow-md border border-gray-200 mr-4">
                {getCrateIcon()}
              </span>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="font-medium text-gray-800 mb-0.5 w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Crate title"
                  />
                ) : (
                  <h1
                    className="text-2xl font-semibold text-gray-900 mb-2"
                    title={crateInfo.title}
                  >
                    {crateInfo.title}
                  </h1>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {formatBytes(crateInfo.size || 0)}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {crateInfo.mimeType}
                  </span>
                  <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {(() => {
                      switch (crateInfo.category) {
                        case CrateCategory.POLL:
                          return (
                            <>
                              <FaComments className="mr-1" size={12} /> Feedback
                            </>
                          );
                        case CrateCategory.TEXT:
                          return (
                            <>
                              <FaFileAlt className="mr-1" size={12} /> Markdown
                            </>
                          );
                        case CrateCategory.CODE:
                          return (
                            <>
                              <FaFileCode className="mr-1" size={12} /> Code
                            </>
                          );
                        case CrateCategory.DATA:
                          return (
                            <>
                              <FaFileCode className="mr-1" size={12} /> JSON
                            </>
                          );
                        case CrateCategory.DATA:
                          return (
                            <>
                              <FaFileCode className="mr-1" size={12} /> YAML
                            </>
                          );
                        case CrateCategory.IMAGE:
                          return (
                            <>
                              <FaFileImage className="mr-1" size={12} /> Image
                            </>
                          );
                        case CrateCategory.TEXT:
                          return (
                            <>
                              <FaFileAlt className="mr-1" size={12} /> Text
                            </>
                          );
                        case CrateCategory.TEXT:
                          return (
                            <>
                              <FaFileAlt className="mr-1" size={12} /> Binary
                            </>
                          );
                        default:
                          return (
                            <>
                              <FaFileAlt className="mr-1" size={12} />{" "}
                              {formatCategoryForDisplay(crateInfo.category)}
                            </>
                          );
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Edit controls */}
              {crateInfo.isOwner && (
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        disabled={editLoading}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Save changes"
                      >
                        <FaSave size={16} />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={editLoading}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Cancel editing"
                      >
                        <FaTimes size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditStart}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit crate details"
                    >
                      <FaEdit size={16} />
                    </button>
                  )}
                </div>
              )}

              {timeRemaining && (
                <div className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 flex items-center">
                  <FaClock className="mr-1" /> {timeRemaining} remaining
                </div>
              )}
            </div>
          </Card.Header>

          <Card.Body className="p-6">
            {/* Sharing status and password protection */}
            <div className="mb-6 flex items-center gap-3">
              {crateInfo.isPublic ? (
                <span className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-green-100 text-green-800 border border-green-200 font-medium">
                  <FaShareAlt className="mr-2" size={14} /> Public (anyone with
                  link)
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                  <FaLock className="mr-2" size={14} /> Private (only you)
                </span>
              )}
              {crateInfo.isPasswordProtected && (
                <span className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 font-medium">
                  <FaLock className="mr-2" size={14} /> Password protected
                </span>
              )}
            </div>

            {/* Description */}
            {(crateInfo.description || isEditing) && (
              <div className="mb-6 pb-4 border-b border-gray-200">
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={4}
                      placeholder="Add a description for this crate..."
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </h3>
                    <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {crateInfo.description}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {renderTags(crateInfo.tags)}

            {/* Metadata display */}
            {renderMetadata(crateInfo.metadata)}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Category
                </div>
                <div className="font-semibold text-gray-900">
                  {formatCategoryForDisplay(crateInfo.category)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  {crateInfo.category === CrateCategory.POLL
                    ? "Responses"
                    : "Downloads"}
                </div>
                <div className="font-semibold text-gray-900 flex items-center">
                  {crateInfo.category === CrateCategory.POLL ? (
                    <>
                      <FaChartBar className="mr-2 text-purple-600" size={16} />
                      {crateInfo.metadata?.submissionCount || 0}
                    </>
                  ) : (
                    <>
                      <FaDownload className="mr-2 text-blue-600" size={16} />
                      {crateInfo.downloadCount}
                    </>
                  )}
                </div>
              </div>

              {crateInfo.expiresAt && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Expiration
                  </div>
                  <div className="font-semibold text-gray-900 flex items-center">
                    <FaClock className="mr-2 text-orange-600" size={14} />
                    {formatDate(crateInfo.expiresAt)}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Size
                </div>
                <div className="font-semibold text-gray-900">
                  {formatBytes(crateInfo.size || 0)}
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {copySuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {copySuccess}
              </div>
            )}
            {copyError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {copyError}
              </div>
            )}
            {editSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {editSuccess}
              </div>
            )}
            {editError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {editError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {/* Primary Actions */}
              {crateInfo.category === CrateCategory.POLL ? (
                // Feedback template specific actions
                <>
                  {!crateInfo.isOwner && (
                    <Link
                      href={`/feedback/submit/${crateId}`}
                      className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white text-base font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 border border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaFileDownload className="mr-2 text-lg" />
                      <span>Submit Feedback</span>
                    </Link>
                  )}
                  {crateInfo.isOwner && (
                    <Link
                      href={`/feedback/responses/${crateId}`}
                      className="flex items-center justify-center px-6 py-3 bg-green-500 text-white text-base font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-3 focus:ring-green-300 focus:ring-offset-2 transition-all duration-200 border border-green-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaChartBar className="mr-2 text-lg" />
                      <span>View Responses</span>
                    </Link>
                  )}
                </>
              ) : (
                // Regular file download
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white text-base font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 border border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaFileDownload className="mr-2 text-lg" />
                  <span>Download</span>
                </button>
              )}

              {/* Copy to My Crates - show for non-owners who are signed in */}
              {!crateInfo.isOwner && user && (
                <button
                  onClick={handleCopyCrate}
                  disabled={copyLoading}
                  className="flex items-center justify-center px-6 py-3 bg-purple-500 text-white text-base font-semibold rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-3 focus:ring-purple-300 focus:ring-offset-2 transition-all duration-200 border border-purple-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                >
                  <FaUpload className="mr-2 text-lg" />
                  <span>
                    {copyLoading ? "Copying..." : "Copy to My Crates"}
                  </span>
                </button>
              )}

              {/* Sign in to Copy - show for non-owners who are not signed in */}
              {!crateInfo.isOwner && !user && (
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white text-base font-medium rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors border border-gray-600"
                >
                  <FaUpload className="mr-2 text-lg" />
                  <span>Sign in to Copy</span>
                </button>
              )}

              {/* Secondary Actions */}

              {/* Show preview button for supported categories (excluding feedback) */}
              {(crateInfo.category === CrateCategory.TEXT ||
                crateInfo.category === CrateCategory.CODE ||
                crateInfo.category === CrateCategory.DATA ||
                crateInfo.category === CrateCategory.IMAGE) && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <FaEye className="mr-1" />{" "}
                  {showPreview ? "Hide Preview" : "View Content"}
                </button>
              )}

              {/* Owner-only Actions */}
              {crateInfo.isOwner && (
                <>
                  <button
                    onClick={handleOpenSharingModal}
                    className="flex items-center justify-center px-3 py-1.5 bg-green-100 text-sm text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    <FaShareAlt className="mr-1" /> Manage Sharing
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
          </Card.Body>
        </Card>

        {/* Preview Card - Only shown when preview is toggled */}
        {showPreview && (
          <Card className="mb-6 shadow-lg border border-gray-200">
            <Card.Header className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
              <div className="flex items-center">
                <FaEye className="mr-2 text-blue-600" size={18} />
                <h2 className="text-lg font-semibold text-gray-800">
                  Content Preview •{" "}
                  {formatCategoryForDisplay(crateInfo.category)}
                </h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                title="Close preview"
              >
                <FaTimes size={16} />
              </button>
            </Card.Header>

            <Card.Body className="p-6">
              {contentLoading ? (
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading content...
                  </div>
                </div>
              ) : crateInfo.category === CrateCategory.IMAGE ? (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
                  <img
                    src={`/api/crates/${crateId}/content`}
                    alt={crateInfo.title}
                    className="max-w-full max-h-96 object-contain rounded shadow-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/icon.png";
                      target.style.height = "80px";
                      target.style.width = "80px";
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {renderPreview()}
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Usage Stats Card */}
          <StatsCard
            title="Usage Statistics"
            icon={<FaChartBar className="text-blue-600" />}
            tooltip="Crate access statistics over time"
            className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
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
                value={formatCategoryForDisplay(crateInfo.category)}
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

                  {/* TTL display removed as ttlDays is no longer supported */}
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
