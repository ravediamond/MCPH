"use client";

import React, { useEffect, useState } from "react";
import { FileMetadata } from "../../services/storageService";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import {
  FaFileAlt,
  FaDownload,
  FaShareAlt,
  FaTrash,
  FaSearch,
  FaClock,
  FaCalendarAlt,
  FaLock,
  FaUpload,
  FaCheck,
  FaTimesCircle,
  FaEye,
  FaExclamationCircle,
  FaFileImage,
  FaFilePdf,
  FaFileCode,
  FaProjectDiagram,
  FaKey,
} from "react-icons/fa";
import Card from "../../components/ui/Card";
import RecentlyClaimedCrates from "../../components/RecentlyClaimedCrates";
import { Crate, CrateSharing, CrateCategory } from "../../shared/types/crate";

type FileMetadataExtended = Omit<FileMetadata, "uploadedAt" | "expiresAt"> & {
  id: string;
  fileName: string;
  title?: string;
  description?: string;
  contentType: string;
  size: number;
  uploadedAt?: Date;
  expiresAt?: Date;
  downloadCount?: number;
  metadata?: Record<string, string>;
  isExpiringSoon?: boolean;
  daysTillExpiry?: number;
  shared?: CrateSharing; // Add shared property
  gcsPath?: string; // ensure gcsPath is part of the type, as it's used in crateToFileMetadata
  category?: CrateCategory; // Add category property from CrateCategory enum
  createdAt?: string | Date; // Add createdAt property to match CrateExtended
  tags?: string[]; // Add tags property to match CrateExtended
};

interface CrateExtended extends Omit<Crate, "expiresAt"> {
  isExpiringSoon?: boolean;
  daysTillExpiry?: number;
  expiresAt?: string; // Override expiresAt as string since it comes from API
  fileName: string; // Changed from optional to mandatory to match Crate interface
  shared: CrateSharing; // Ensure shared is part of the type
}

export default function HomePage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [files, setFiles] = useState<CrateExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastCrateId, setLastCrateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [userQuota, setUserQuota] = useState<{
    count: number;
    remaining: number;
  } | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [userStorage, setUserStorage] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);
  const [userSharedCrates, setUserSharedCrates] = useState<{
    count: number;
    limit: number;
    remaining: number;
  } | null>(null);

  // Advanced search state
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [advancedSearchParams, setAdvancedSearchParams] = useState({
    title: "",
    tags: "",
    type: "",
    project: "",
    status: "",
    priority: "",
    context: "",
  });

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "project">("list");

  // --- Embedding-based search state ---
  const [searchResults, setSearchResults] = useState<
    FileMetadataExtended[] | null
  >(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Function to fetch crates with pagination
  const fetchCrates = async (isLoadMore = false) => {
    if (!user) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Build URL with pagination parameters
      // Default page size of 20 items
      const pageSize = 20;
      let url = `/api/user/${user.uid}/crates?limit=${pageSize}`;

      // Add cursor-based pagination parameter if loading more
      if (isLoadMore && lastCrateId) {
        url += `&startAfter=${encodeURIComponent(lastCrateId)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch crates");
      }

      const data = await response.json();

      // Process crates to add any additional metadata
      const processedCrates = data.crates.map((crate: Crate) => {
        // Add any computed properties to the crate objects
        return {
          ...crate,
          // These were used for TTL expiry which is no longer supported
          isExpiringSoon: false,
          daysTillExpiry: 0,
        };
      });

      // Update pagination state
      setLastCrateId(data.lastCrateId);
      setHasMore(data.hasMore);

      // If loading more, append to existing files, otherwise replace them
      if (isLoadMore) {
        setFiles((prevFiles) => [...prevFiles, ...processedCrates]);
      } else {
        setFiles(processedCrates);
      }

      // If we got fewer items than requested and this isn't the first page,
      // we've likely reached the end
      if (isLoadMore && processedCrates.length < pageSize) {
        setHasMore(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Initial load of crates
  useEffect(() => {
    if (user) {
      fetchCrates();
    } else {
      setFiles([]);
      setLastCrateId(null);
      setHasMore(true);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setQuotaLoading(true);
      fetch(`/api/user/${user.uid}/quota`)
        .then((res) => res.json())
        .then((data) => {
          setUserQuota(data.usage || null);
          setUserStorage(data.storage || null);
          setUserSharedCrates(data.sharedCrates || null);
        })
        .catch(() => {
          setUserQuota(null);
          setUserStorage(null);
          setUserSharedCrates(null);
        })
        .finally(() => setQuotaLoading(false));
    } else {
      setUserQuota(null);
      setUserStorage(null);
    }
  }, [user]);

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/uploads/${fileId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFiles(files.filter((file) => file.id !== fileId));
      setActionSuccess("File deleted");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeleteModalVisible(false);
      setFileToDelete(null);
    }
  };

  // Filter files based on search query and exclude expired files
  const filteredFiles = React.useMemo(() => {
    const now = new Date();
    // Only include files that are not expired
    const notExpired = files.filter((file) => {
      if (!file.expiresAt) return true;
      return new Date(file.expiresAt) > now;
    });
    // If search bar is empty, show all notExpired files
    if (!searchQuery.trim()) return notExpired;
    // If searchResults is not null, show searchResults
    if (searchResults !== null) return searchResults;
    // Default fallback
    return notExpired;
  }, [files, searchResults, searchQuery]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (date: string | number | Date): string => {
    return new Date(date).toLocaleDateString();
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

  // Get file type icon with proper styling
  const getFileIcon = (file: FileMetadataExtended) => {
    const contentType = file.contentType.toLowerCase();
    const fileName = file.fileName.toLowerCase();

    if (contentType.includes("image")) {
      return <FaFileImage size={18} className="text-blue-500" />;
    } else if (contentType.includes("pdf")) {
      return <FaFilePdf size={18} className="text-red-500" />;
    } else if (
      contentType.includes("json") ||
      contentType.includes("javascript") ||
      contentType.includes("typescript")
    ) {
      return <FaFileCode size={18} className="text-yellow-600" />;
    } else if (
      (contentType.includes("text") && fileName.includes("mermaid")) ||
      fileName.endsWith(".mmd")
    ) {
      return <FaProjectDiagram size={18} className="text-green-500" />;
    } else if (
      contentType.includes("text") ||
      contentType.includes("markdown")
    ) {
      return <FaFileAlt size={18} className="text-purple-500" />;
    } else {
      return <FaFileAlt size={18} className="text-gray-500" />;
    }
  };

  // Copy sharing link
  const copyShareLink = (fileId: string) => {
    const link = `${window.location.origin}/crate/${fileId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setActionSuccess("Link copied to clipboard");
        setTimeout(() => setActionSuccess(null), 2000);
      })
      .catch(() => {
        setError("Failed to copy link");
      });
  };

  // Handler for search input (only search on Enter)
  const handleSearchKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        // Map Firestore search results to our application format
        const results = (data.results || [])
          .map((doc: any) => {
            // We only need to handle the Firestore API response format
            const fields = doc.fields || {};
            return {
              id: doc.name?.split("/")?.pop() || "",
              fileName: fields.fileName?.stringValue || "",
              title: fields.title?.stringValue || "",
              description: fields.description?.stringValue || "",
              contentType: fields.contentType?.stringValue || "",
              size: fields.size?.integerValue
                ? parseInt(fields.size.integerValue)
                : 0,
              uploadedAt: fields.uploadedAt?.timestampValue || "",
              expiresAt: fields.expiresAt?.timestampValue || "",
              downloadCount: fields.downloadCount?.integerValue
                ? parseInt(fields.downloadCount.integerValue)
                : 0,
              metadata: fields.metadata?.mapValue?.fields
                ? Object.fromEntries(
                    Object.entries(fields.metadata.mapValue.fields).map(
                      ([k, v]: any) => [k, v.stringValue],
                    ),
                  )
                : undefined,
            };
          })
          .filter((file: any) => file.id && file.fileName); // Filter out any invalid entries

        setSearchResults(results);
      } catch (err: any) {
        setSearchError(err.message || "Search failed");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // Handle advanced search
  const handleAdvancedSearch = async () => {
    setSearchLoading(true);
    setSearchError(null);

    // Build search query from advanced parameters
    let query = "";
    if (advancedSearchParams.title) query += advancedSearchParams.title + " ";
    if (advancedSearchParams.tags) query += advancedSearchParams.tags + " ";
    if (advancedSearchParams.project)
      query += advancedSearchParams.project + " ";
    if (advancedSearchParams.type) query += advancedSearchParams.type + " ";
    if (advancedSearchParams.status) query += advancedSearchParams.status + " ";
    if (advancedSearchParams.priority)
      query += advancedSearchParams.priority + " ";
    if (advancedSearchParams.context)
      query += advancedSearchParams.context + " ";

    // Trim and ensure we have a query
    query = query.trim();
    if (!query) {
      setSearchLoading(false);
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      // Map Firestore search results to our application format
      const results = (data.results || [])
        .map((doc: any) => {
          // We only need to handle the Firestore API response format
          const fields = doc.fields || {};
          return {
            id: doc.name?.split("/")?.pop() || "",
            fileName: fields.fileName?.stringValue || "",
            title: fields.title?.stringValue || "",
            description: fields.description?.stringValue || "",
            contentType: fields.contentType?.stringValue || "",
            size: fields.size?.integerValue
              ? parseInt(fields.size.integerValue)
              : 0,
            uploadedAt: fields.uploadedAt?.timestampValue || "",
            expiresAt: fields.expiresAt?.timestampValue || "",
            downloadCount: fields.downloadCount?.integerValue
              ? parseInt(fields.downloadCount.integerValue)
              : 0,
            metadata: fields.metadata?.mapValue?.fields
              ? Object.fromEntries(
                  Object.entries(fields.metadata.mapValue.fields).map(
                    ([k, v]: any) => [k, v.stringValue],
                  ),
                )
              : undefined,
            tags: fields.tags?.arrayValue?.values
              ? fields.tags.arrayValue.values.map((v: any) => v.stringValue)
              : [],
          };
        })
        .filter((file: any) => file.id && file.fileName); // Filter out any invalid entries

      setSearchResults(results);
      // Also update the simple search query to match
      setSearchQuery(query);
    } catch (err: any) {
      setSearchError(err.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Utility to map CrateExtended to FileMetadataExtended
  function crateToFileMetadata(crate: CrateExtended): FileMetadataExtended {
    return {
      id: crate.id,
      fileName: crate.title || crate.id, // fallback to id if title is missing
      title: crate.title,
      description: crate.description,
      contentType: crate.mimeType,
      size: crate.size,
      gcsPath: crate.gcsPath || "", // Added to match FileMetadata
      uploadedAt: crate.createdAt ? new Date(crate.createdAt) : new Date(),
      expiresAt: crate.expiresAt ? new Date(crate.expiresAt) : undefined,
      downloadCount: crate.downloadCount,
      metadata: crate.metadata,
      isExpiringSoon: crate.isExpiringSoon,
      daysTillExpiry: crate.daysTillExpiry,
      shared: crate.shared, // Map shared property
      category: crate.category, // Map the category property
      createdAt: crate.createdAt, // Map the createdAt property
      tags: crate.tags, // Map the tags property
    };
  }

  // Group files by project for project view
  const groupedByProject = React.useMemo(() => {
    const files = filteredFiles || [];
    const groups: Record<string, FileMetadataExtended[]> = {
      "No Project": [],
    };

    files.forEach((file) => {
      let assigned = false;

      // Check if file has tags and look for project tags
      if (file.tags && file.tags.length > 0) {
        for (const tag of file.tags) {
          if (tag.startsWith("project:")) {
            const projectName = tag.substring(8); // Remove "project:" prefix
            if (!groups[projectName]) {
              groups[projectName] = [];
            }
            groups[projectName].push(
              "contentType" in file
                ? (file as FileMetadataExtended)
                : crateToFileMetadata(file as CrateExtended),
            );
            assigned = true;
            break;
          }
        }
      }

      // If no project tag found, add to "No Project" group
      if (!assigned) {
        groups["No Project"].push(
          "contentType" in file
            ? (file as FileMetadataExtended)
            : crateToFileMetadata(file as CrateExtended),
        );
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredFiles]);

  // Function to add a tag to a crate
  const addTag = async (crateId: string, tag: string) => {
    try {
      const response = await fetch(`/api/crate/${crateId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });

      if (!response.ok) {
        throw new Error("Failed to add tag");
      }

      // Update the file in our local state
      setFiles((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id === crateId) {
            // Add the tag if it doesn't exist already
            const tags = file.tags || [];
            if (!tags.includes(tag)) {
              return {
                ...file,
                tags: [...tags, tag],
              };
            }
          }
          return file;
        }),
      );

      setActionSuccess(`Added tag: ${tag}`);
      setTimeout(() => setActionSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tag");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
        <div className="w-full max-w-4xl animate-pulse p-8 text-center">
          <div className="h-8 bg-gray-200 rounded mb-4 w-48 mx-auto"></div>
          <div className="h-4 bg-gray-100 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
        <Card className="max-w-md w-full p-8 text-center">
          <FaLock className="text-primary-500 text-3xl mx-auto mb-4" />
          <h1 className="text-2xl font-medium mb-2">My crates</h1>
          <p className="text-gray-600 mb-6">Sign in to access your crates</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Sign in with Google
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* MCP API Quota Info */}
        {user && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <FaKey className="mr-2" />
              API Usage Quota
            </h2>
            {quotaLoading ? (
              <div className="text-gray-500 text-sm">Loading quota...</div>
            ) : userQuota ? (
              <div className="text-sm text-gray-700">
                Remaining MCP calls this month:{" "}
                <span
                  className={
                    userQuota.remaining === 0
                      ? "text-red-600 font-semibold"
                      : "font-semibold"
                  }
                >
                  {userQuota.remaining}
                </span>
                <span className="ml-2 text-gray-400">/ 1000</span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No quota information found.
              </div>
            )}
            {userStorage && (
              <div className="text-sm text-gray-700 mt-1">
                Storage used:{" "}
                <span className="font-semibold">
                  {formatFileSize(userStorage.used)}
                </span>{" "}
                /{" "}
                <span className="font-semibold">
                  {formatFileSize(userStorage.limit)}
                </span>
                <span className="ml-2">
                  ({((userStorage.used / userStorage.limit) * 100).toFixed(1)}%
                  used, {formatFileSize(userStorage.remaining)} left)
                </span>
              </div>
            )}
            {userSharedCrates && (
              <div className="text-sm text-gray-700 mt-1">
                Shared crates:{" "}
                <span
                  className={
                    userSharedCrates.remaining === 0
                      ? "text-red-600 font-semibold"
                      : "font-semibold"
                  }
                >
                  {userSharedCrates.count}
                </span>{" "}
                /{" "}
                <span className="font-semibold">{userSharedCrates.limit}</span>
                <span className="ml-2">
                  (
                  {(
                    (userSharedCrates.count / userSharedCrates.limit) *
                    100
                  ).toFixed(1)}
                  % used, {userSharedCrates.remaining} left)
                </span>
              </div>
            )}
            {/* Create API Key Button */}
            <div className="mt-4">
              <Link
                href="/api-keys"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow border border-blue-700"
              >
                <FaKey className="mr-2" /> Manage API Keys
              </Link>
            </div>
          </div>
        )}
        {/* Header with search */}
        <div className="flex flex-col items-center justify-center mb-8 mt-4">
          <h1 className="text-2xl font-medium text-gray-800 mb-4">My crates</h1>

          {/* Search and filters container */}
          <div className="w-full">
            {/* Search bar and toggle */}
            <div className="flex justify-center mb-3">
              <div className="relative w-full max-w-xl">
                {!isAdvancedSearch ? (
                  <>
                    <input
                      type="text"
                      placeholder="Search crates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="py-3 px-4 pl-10 border border-gray-200 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  </>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg w-full shadow-sm p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          placeholder="Search by title"
                          value={advancedSearchParams.title}
                          onChange={(e) =>
                            setAdvancedSearchParams({
                              ...advancedSearchParams,
                              title: e.target.value,
                            })
                          }
                          className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags
                        </label>
                        <input
                          type="text"
                          placeholder="Any tag"
                          value={advancedSearchParams.tags}
                          onChange={(e) =>
                            setAdvancedSearchParams({
                              ...advancedSearchParams,
                              tags: e.target.value,
                            })
                          }
                          className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project
                        </label>
                        <input
                          type="text"
                          placeholder="project:name"
                          value={advancedSearchParams.project}
                          onChange={(e) =>
                            setAdvancedSearchParams({
                              ...advancedSearchParams,
                              project: e.target.value,
                            })
                          }
                          className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <input
                          type="text"
                          placeholder="type:name"
                          value={advancedSearchParams.type}
                          onChange={(e) =>
                            setAdvancedSearchParams({
                              ...advancedSearchParams,
                              type: e.target.value,
                            })
                          }
                          className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <input
                          type="text"
                          placeholder="status:name"
                          value={advancedSearchParams.status}
                          onChange={(e) =>
                            setAdvancedSearchParams({
                              ...advancedSearchParams,
                              status: e.target.value,
                            })
                          }
                          className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <input
                          type="text"
                          placeholder="priority:level"
                          value={advancedSearchParams.priority}
                          onChange={(e) =>
                            setAdvancedSearchParams({
                              ...advancedSearchParams,
                              priority: e.target.value,
                            })
                          }
                          className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleAdvancedSearch}
                        className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-sm"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  title={isAdvancedSearch ? "Simple search" : "Advanced search"}
                >
                  {isAdvancedSearch ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* View mode toggle and quick tag filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between max-w-4xl mx-auto mb-4">
              <div className="flex space-x-2 mb-3 md:mb-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                    viewMode === "list"
                      ? "bg-primary-100 text-primary-700 border-primary-200 border"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  List View
                </button>
                <button
                  onClick={() => setViewMode("project")}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                    viewMode === "project"
                      ? "bg-primary-100 text-primary-700 border-primary-200 border"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Project View
                </button>
              </div>

              {/* Quick tag filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSearchQuery("project:")}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                >
                  Project Tags
                </button>
                <button
                  onClick={() => setSearchQuery("type:")}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200"
                >
                  Type Tags
                </button>
                <button
                  onClick={() => setSearchQuery("status:")}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200"
                >
                  Status Tags
                </button>
                <button
                  onClick={() => setSearchQuery("priority:")}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200"
                >
                  Priority Tags
                </button>
                <button
                  onClick={() => setSearchQuery("context:")}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm hover:bg-yellow-200"
                >
                  Context Tags
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {actionSuccess && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 flex items-center">
            <FaCheck className="mr-2" /> {actionSuccess}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 flex items-center">
            <FaTimesCircle className="mr-2" /> {error}
          </div>
        )}

        {/* Recently Claimed Crates */}
        {user && <RecentlyClaimedCrates />}

        {/* File Grid */}
        <div>
          {searchLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="mt-2 text-gray-500">Searching...</div>
              </div>
            </div>
          ) : searchResults !== null ? (
            searchResults.length === 0 ? (
              <Card className="p-8 text-center">
                <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-2" />
                <p className="text-gray-500">No matching crates found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {searchResults.map((file) => (
                  <Card
                    key={file.id}
                    hoverable
                    className="transition-all overflow-hidden"
                  >
                    {/* ...existing file card rendering... */}
                    <div className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {getFileIcon(
                            "contentType" in file
                              ? (file as FileMetadataExtended)
                              : crateToFileMetadata(file as CrateExtended),
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <Link href={`/crate/${file.id}`} className="block">
                            <h3
                              className="font-medium text-sm text-gray-800 hover:text-primary-600 transition-colors truncate"
                              title={file.fileName}
                            >
                              {file.title || file.fileName}
                            </h3>
                          </Link>

                          {/* File Description - improved snippet */}
                          {file.description && (
                            <p
                              className="text-xs text-gray-600 mt-1 line-clamp-2"
                              title={file.description}
                            >
                              {file.description}
                            </p>
                          )}

                          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                            <div className="truncate mr-2">
                              {formatFileSize(file.size)}
                            </div>
                            <div className="flex items-center whitespace-nowrap">
                              <FaDownload className="mr-1" size={10} />{" "}
                              {file.downloadCount || 0}
                            </div>
                          </div>

                          {/* Tags - if available */}
                          {file.tags && file.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {file.tags.map((tag, index) => {
                                // Determine tag type/color based on prefix
                                let tagClass = "bg-gray-100 text-gray-600"; // default style
                                if (tag.startsWith("project:")) {
                                  tagClass = "bg-blue-100 text-blue-700";
                                } else if (tag.startsWith("type:")) {
                                  tagClass = "bg-green-100 text-green-700";
                                } else if (tag.startsWith("status:")) {
                                  tagClass = "bg-purple-100 text-purple-700";
                                } else if (tag.startsWith("priority:")) {
                                  tagClass = "bg-red-100 text-red-700";
                                } else if (tag.startsWith("context:")) {
                                  tagClass = "bg-yellow-100 text-yellow-700";
                                }

                                return (
                                  <span
                                    key={index}
                                    className={`inline-block ${tagClass} text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80`}
                                    onClick={() => setSearchQuery(tag)}
                                    title={`Search for ${tag}`}
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Shared status indicator */}
                          <div className="mt-1 text-xs">
                            {file.shared?.public ? (
                              <span className="text-green-600 font-medium">
                                Shared
                              </span>
                            ) : (
                              <span className="text-gray-500">Private</span>
                            )}
                          </div>
                          {renderMetadata(file.metadata)}
                        </div>
                      </div>
                      <div className="flex justify-end mt-2 space-x-1">
                        <button
                          onClick={() => copyShareLink(file.id)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                          title="Copy link"
                        >
                          <FaShareAlt size={12} />
                        </button>
                        <Link
                          href={`/crate/${file.id}`}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                          title="View details"
                        >
                          <FaEye size={12} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card className="p-8 text-center">
              <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-gray-500">
                {searchQuery
                  ? "No matching crates found"
                  : "No crates uploaded yet"}
              </p>
              {!searchQuery && (
                <Link
                  href="/upload"
                  className="inline-flex items-center mt-4 text-primary-500"
                >
                  <FaUpload className="mr-1" /> Upload your first crate
                </Link>
              )}
            </Card>
          ) : viewMode === "list" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  hoverable
                  className="transition-all overflow-hidden h-full"
                >
                  <div className="p-4">
                    {/* File Header with Icon and Title */}
                    <div className="flex items-start mb-3">
                      <div className="mt-0.5 mr-3">
                        {getFileIcon(
                          "contentType" in file
                            ? (file as FileMetadataExtended)
                            : crateToFileMetadata(file as CrateExtended),
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <Link href={`/crate/${file.id}`} className="block">
                          <h3
                            className="font-medium text-base text-gray-800 hover:text-primary-600 transition-colors truncate"
                            title={file.fileName}
                          >
                            {file.title || file.fileName}
                          </h3>
                        </Link>

                        {/* File Description - improved with truncation */}
                        {file.description && (
                          <p
                            className="text-xs text-gray-600 mt-1 line-clamp-2"
                            title={file.description}
                          >
                            {file.description}
                          </p>
                        )}
                      </div>

                      {/* Expiry Indicator */}
                      {file.isExpiringSoon && (
                        <div
                          className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 mt-1 ml-2"
                          title={`Expires in ${file.daysTillExpiry} day${file.daysTillExpiry !== 1 ? "s" : ""}`}
                        ></div>
                      )}
                    </div>

                    {/* Divider */}
                    <hr className="my-2 border-gray-100" />

                    {/* File Details Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Category */}
                      <div className="text-xs">
                        <span className="text-gray-500 mr-1">Category:</span>
                        <span className="font-medium text-gray-700">
                          {file.category
                            ? file.category.charAt(0).toUpperCase() +
                              file.category.slice(1).toLowerCase()
                            : "Unknown"}
                        </span>
                      </div>

                      {/* Size */}
                      <div className="text-xs">
                        <span className="text-gray-500 mr-1">Size:</span>
                        <span className="font-medium text-gray-700">
                          {formatFileSize(file.size)}
                        </span>
                      </div>

                      {/* Created Date - with better formatting */}
                      <div className="text-xs">
                        <span className="text-gray-500 mr-1">Created:</span>
                        <span className="font-medium text-gray-700">
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "Unknown"}
                        </span>
                      </div>

                      {/* Downloads */}
                      <div className="text-xs">
                        <span className="text-gray-500 mr-1">Downloads:</span>
                        <span className="font-medium text-gray-700">
                          {file.downloadCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Tags - if available */}
                    {file.tags && file.tags.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag, index) => {
                            // Determine tag type/color based on prefix
                            let tagClass = "bg-gray-100 text-gray-600"; // default style
                            if (tag.startsWith("project:")) {
                              tagClass = "bg-blue-100 text-blue-700";
                            } else if (tag.startsWith("type:")) {
                              tagClass = "bg-green-100 text-green-700";
                            } else if (tag.startsWith("status:")) {
                              tagClass = "bg-purple-100 text-purple-700";
                            } else if (tag.startsWith("priority:")) {
                              tagClass = "bg-red-100 text-red-700";
                            } else if (tag.startsWith("context:")) {
                              tagClass = "bg-yellow-100 text-yellow-700";
                            }

                            return (
                              <span
                                key={index}
                                className={`inline-block ${tagClass} text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80`}
                                onClick={() => setSearchQuery(tag)}
                                title={`Search for ${tag}`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sharing Status */}
                    <div className="flex items-center text-xs mb-3">
                      {file.shared?.public ? (
                        <span className="inline-flex items-center text-green-600 font-medium">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-500">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          Private
                        </span>
                      )}

                      {file.shared?.passwordHash && (
                        <span className="inline-flex items-center ml-2 text-amber-600">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                          Password Protected
                        </span>
                      )}
                    </div>

                    {/* Custom Metadata - if available */}
                    {file.metadata && Object.keys(file.metadata).length > 0 && (
                      <div className="text-xs text-gray-600 mb-3">
                        <span className="font-medium block mb-1">
                          Metadata:
                        </span>
                        <div className="grid grid-cols-1 gap-1 ml-2">
                          {Object.entries(file.metadata).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium mr-1">{key}:</span>
                              <span className="truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Quick Actions */}
                    <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
                      {/* Quick tag buttons */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => addTag(file.id, "project:default")}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-700 transition-colors text-xs"
                          title="Add to default project"
                        >
                          <span className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                            </svg>
                            Project
                          </span>
                        </button>
                      </div>

                      {/* Main action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyShareLink(file.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                          title="Copy link"
                        >
                          <FaShareAlt size={14} />
                        </button>

                        <Link
                          href={`/crate/${file.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                          title="View details"
                        >
                          <FaEye size={14} />
                        </Link>

                        <Link
                          href={`/download/${file.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                          title="Download"
                        >
                          <FaDownload size={14} />
                        </Link>

                        <button
                          onClick={() => {
                            setFileToDelete(file.id);
                            setDeleteModalVisible(true);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Project View - Group by project
            <div className="space-y-8">
              {Object.entries(groupedByProject).map(([projectName, files]) => (
                <div
                  key={projectName}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Project header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      {projectName === "No Project"
                        ? "Uncategorized"
                        : projectName}
                      <span className="ml-2 text-sm text-gray-500">
                        ({files.length} crates)
                      </span>
                    </h3>
                  </div>

                  {/* Project crates grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {files.map((file) => (
                        <Card
                          key={file.id}
                          hoverable
                          className="transition-all overflow-hidden h-full"
                        >
                          <div className="p-3">
                            <div className="flex items-start">
                              <div className="mt-0.5 mr-2">
                                {getFileIcon(file)}
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link
                                  href={`/crate/${file.id}`}
                                  className="block"
                                >
                                  <h3
                                    className="font-medium text-sm text-gray-800 hover:text-primary-600 transition-colors truncate"
                                    title={file.fileName}
                                  >
                                    {file.title || file.fileName}
                                  </h3>
                                </Link>

                                {/* Description snippet */}
                                {file.description && (
                                  <p
                                    className="text-xs text-gray-600 mt-1 line-clamp-1"
                                    title={file.description}
                                  >
                                    {file.description}
                                  </p>
                                )}

                                {/* File details */}
                                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                  <div className="truncate mr-2">
                                    {formatFileSize(file.size)}
                                  </div>
                                  <div className="whitespace-nowrap">
                                    {file.createdAt &&
                                      new Date(
                                        file.createdAt,
                                      ).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                  </div>
                                </div>

                                {/* Tags - show non-project tags only in project view */}
                                {file.tags && file.tags.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {file.tags
                                      .filter(
                                        (tag) => !tag.startsWith("project:"),
                                      )
                                      .map((tag, idx) => {
                                        // Determine tag type/color based on prefix
                                        let tagClass =
                                          "bg-gray-100 text-gray-600"; // default style
                                        if (tag.startsWith("type:")) {
                                          tagClass =
                                            "bg-green-100 text-green-700";
                                        } else if (tag.startsWith("status:")) {
                                          tagClass =
                                            "bg-purple-100 text-purple-700";
                                        } else if (
                                          tag.startsWith("priority:")
                                        ) {
                                          tagClass = "bg-red-100 text-red-700";
                                        } else if (tag.startsWith("context:")) {
                                          tagClass =
                                            "bg-yellow-100 text-yellow-700";
                                        }

                                        return (
                                          <span
                                            key={idx}
                                            className={`inline-block ${tagClass} text-xs px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80`}
                                            onClick={() => setSearchQuery(tag)}
                                            title={`Search for ${tag}`}
                                          >
                                            {tag}
                                          </span>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick actions */}
                            <div className="flex justify-end mt-2 space-x-1">
                              <button
                                onClick={() => copyShareLink(file.id)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                title="Copy link"
                              >
                                <FaShareAlt size={12} />
                              </button>
                              <Link
                                href={`/crate/${file.id}`}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                title="View details"
                              >
                                <FaEye size={12} />
                              </Link>
                              <Link
                                href={`/download/${file.id}`}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                title="Download"
                              >
                                <FaDownload size={12} />
                              </Link>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simple file stats */}
        {filteredFiles.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 flex justify-between">
            <span>Total: {filteredFiles.length} crates</span>
            <span>
              {formatFileSize(
                filteredFiles.reduce((sum, file) => sum + file.size, 0),
              )}
            </span>
          </div>
        )}

        {/* Load More Button */}
        {!loading && !searchResults && hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => fetchCrates(true)}
              disabled={loadingMore}
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Loading...
                </span>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" />
              <h3 className="font-medium text-lg">Delete File?</h3>
              <p className="text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setDeleteModalVisible(false);
                  setFileToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
