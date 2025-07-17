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
import SmartCallToAction from "../../../components/SmartCallToAction";
import PasswordPrompt from "../../../components/crate/PasswordPrompt";
import CrateSharingModal from "../../../components/crate/CrateSharingModal";
import CrateHeader from "../../../components/crate/CrateHeader";
import CrateStats from "../../../components/crate/CrateStats";
import CrateContentPreview from "../../../components/crate/CrateContentPreview";
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

  // Duplication state variables
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);

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

        // Increment view count on page load (for all crates)
        try {
          const viewResponse = await fetch(`/api/crates/${crateId}/view`, {
            method: "POST",
          });

          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            // Update the local view count
            setCrateInfo((prevInfo) => ({
              ...processedData,
              viewCount: viewData.viewCount,
            }));
          }
        } catch (viewError) {
          console.warn("Failed to track page view:", viewError);
        }

        if (data.expiresAt) {
          updateTimeRemaining(data.expiresAt);
          timer = setInterval(() => updateTimeRemaining(data.expiresAt), 60000);
        }

        // Set access history (if available) for future use
        if (data.accessHistory && data.accessHistory.length > 0) {
          processedData.accessHistory = data.accessHistory;
        } else {
          processedData.accessHistory = [];
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

  // Handle view content action with download tracking
  const handleViewContent = async () => {
    setShowPreview(!showPreview);

    // Track download count when content is actually viewed (only on first view)
    if (!showPreview) {
      try {
        const response = await fetch(`/api/crates/${crateId}/access`, {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          // Update the local download count
          if (crateInfo) {
            setCrateInfo({
              ...crateInfo,
              downloadCount: data.downloadCount,
            });
          }
        }
      } catch (downloadError) {
        console.warn("Failed to track download:", downloadError);
      }
    }
  };

  // Handle crate duplication
  const handleDuplicateCrate = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = `/login?next=/crate/${crateId}`;
      return;
    }

    setDuplicateLoading(true);
    setDuplicateError(null);
    setDuplicateSuccess(null);

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Authentication failed");
      }

      const response = await fetch(`/api/crates/${crateId}/duplicate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to duplicate crate");
      }

      setDuplicateSuccess("Crate duplicated successfully! Redirecting...");

      // Redirect to the new crate after a short delay
      setTimeout(() => {
        window.location.href = `/crate/${data.crateId}`;
      }, 1500);
    } catch (error: any) {
      setDuplicateError(error.message || "Failed to duplicate crate");
      setTimeout(() => setDuplicateError(null), 5000);
    } finally {
      setDuplicateLoading(false);
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
      <PasswordPrompt
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        passwordError={passwordError}
        contentLoading={contentLoading}
        onSubmit={handlePasswordSubmit}
      />
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
      <CrateSharingModal
        showSharingModal={showSharingModal}
        setShowSharingModal={setShowSharingModal}
        sharingError={sharingError}
        sharingSuccess={sharingSuccess}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        isPasswordProtected={isPasswordProtected}
        setIsPasswordProtected={setIsPasswordProtected}
        sharingPassword={sharingPassword}
        setSharingPassword={setSharingPassword}
        shareUrl={shareUrl}
        linkCopied={linkCopied}
        setLinkCopied={setLinkCopied}
        crateId={crateId}
        socialLinkCopied={socialLinkCopied}
        setSocialLinkCopied={setSocialLinkCopied}
        socialShareMessage={socialShareMessage}
        setSocialShareMessage={setSocialShareMessage}
        handleSocialShare={handleSocialShare}
        handleCopySocialLink={handleCopySocialLink}
        handleUpdateSharing={handleUpdateSharing}
        sharingLoading={sharingLoading}
        crateTitle={crateInfo?.title || "Untitled Crate"}
      />

      <div className="max-w-5xl mx-auto">
        {/* Main Info Card */}
        <CrateHeader
          crateInfo={crateInfo}
          isEditing={isEditing}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editLoading={editLoading}
          timeRemaining={timeRemaining}
          copySuccess={copySuccess}
          copyError={copyError}
          editSuccess={editSuccess}
          editError={editError}
          deleteError={deleteError}
          deleteLoading={deleteLoading}
          copyLoading={copyLoading}
          showPreview={showPreview}
          user={user}
          handleSaveEdit={handleSaveEdit}
          handleEditCancel={handleEditCancel}
          handleEditStart={handleEditStart}
          handleDownload={handleDownload}
          handleCopyCrate={handleCopyCrate}
          handleViewContent={handleViewContent}
          handleOpenSharingModal={handleOpenSharingModal}
          handleDelete={handleDelete}
          signInWithGoogle={signInWithGoogle}
          handleCopyLink={handleCopyLink}
          linkCopied={linkCopied}
          getCrateIcon={getCrateIcon}
          formatBytes={formatBytes}
          formatCategoryForDisplay={formatCategoryForDisplay}
          formatDate={formatDate}
          renderTags={renderTags}
          renderMetadata={renderMetadata}
          crateId={crateId}
          crateContent={crateContent}
          contentLoading={contentLoading}
        />

        {/* Content Preview */}
        <CrateContentPreview
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          crateInfo={crateInfo}
          contentLoading={contentLoading}
          crateId={crateId}
          formatCategoryForDisplay={formatCategoryForDisplay}
          renderPreview={renderPreview}
        />

        {/* Stats Section */}
        <CrateStats
          crateInfo={crateInfo}
          formatBytes={formatBytes}
          formatCategoryForDisplay={formatCategoryForDisplay}
          formatDate={formatDate}
          getCrateIcon={getCrateIcon}
        />

        {/* Smart Call-to-Action - Only show for non-owners */}
        {crateInfo && crateInfo.isPublic && !crateInfo.isOwner && (
          <SmartCallToAction
            crateId={crateId}
            crateTitle={crateInfo.title}
            viewCount={crateInfo.viewCount || 0}
            isOwner={crateInfo.isOwner}
            isPublic={crateInfo.isPublic}
            onDuplicate={handleDuplicateCrate}
          />
        )}

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

      {/* Duplication Status Messages */}
      {duplicateSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {duplicateSuccess}
        </div>
      )}
      {duplicateError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {duplicateError}
        </div>
      )}
    </div>
  );
}
