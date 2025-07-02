"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import DeleteModal from "../../components/home/DeleteModal";
import APIQuotaInfo from "../../components/home/APIQuotaInfo";
import SearchBar from "../../components/home/SearchBar";
import CrateTag from "../../components/home/CrateTag";
import CratesList from "../../components/home/CratesList";
import { Crate } from "@/app/types/crate";

interface UserQuota {
  remaining: number;
}

interface UserStorage {
  used: number;
  limit: number;
  remaining: number;
}

interface UserSharedCrates {
  count: number;
  limit: number;
  remaining: number;
}

export default function HomePage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [userQuota, setUserQuota] = useState<UserQuota | null>(null);
  const [userStorage, setUserStorage] = useState<UserStorage | null>(null);
  const [userSharedCrates, setUserSharedCrates] =
    useState<UserSharedCrates | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [files, setFiles] = useState<Crate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>("");
  const [searchResults, setSearchResults] = useState<Crate[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [advancedSearchFields, setAdvancedSearchFields] = useState({
    fileName: "",
    tags: "",
    type: "",
    project: "",
    status: "",
    priority: "",
    context: "",
  });

  // --- Embedding-based search state ---
  const [embeddingSearchResults, setEmbeddingSearchResults] = useState<
    Crate[] | null
  >(null);
  const [embeddingSearchLoading, setEmbeddingSearchLoading] = useState(false);
  const [embeddingSearchError, setEmbeddingSearchError] = useState<
    string | null
  >(null);

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
      if (isLoadMore && lastVisible) {
        url += `&startAfter=${encodeURIComponent(lastVisible)}`;
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
      setLastVisible(data.lastCrateId);
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
      setLastVisible(null);
      setHasMore(true);
      setLoading(false);
    }
  }, [user]);

  // Quota and storage info
  useEffect(() => {
    if (user) {
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
        });
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
              <span className="font-medium">{key}:</span> {String(value)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Get file type icon with proper styling
  const getFileIcon = (file: Crate) => {
    const contentType = file.mimeType?.toLowerCase() || "";
    const fileName = file.title?.toLowerCase() || "";

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
      setSearchResults(null);
      setError(null);
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
        setError(err.message || "Search failed");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  // Handle advanced search
  const handleAdvancedSearch = async () => {
    setSearchLoading(true);
    setSearchResults(null);
    setError(null);

    // Build search query from advanced parameters
    let query = "";
    if (advancedSearchFields.fileName)
      query += advancedSearchFields.fileName + " ";
    if (advancedSearchFields.tags) query += advancedSearchFields.tags + " ";
    if (advancedSearchFields.project)
      query += advancedSearchFields.project + " ";
    if (advancedSearchFields.type) query += advancedSearchFields.type + " ";
    if (advancedSearchFields.status) query += advancedSearchFields.status + " ";
    if (advancedSearchFields.priority)
      query += advancedSearchFields.priority + " ";
    if (advancedSearchFields.context)
      query += advancedSearchFields.context + " ";

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
      setError(err.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Utility to map CrateExtended to FileMetadataExtended
  function crateToFileMetadata(crate: Crate): Crate {
    return {
      ...crate,
      isExpiringSoon: false, // Add this property
      daysTillExpiry: 0, // Add this property
    };
  }

  // Group files by project for project view
  const groupedByProject = React.useMemo(() => {
    const files = filteredFiles || [];
    const groups: Record<string, Crate[]> = {
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
            groups[projectName].push(crateToFileMetadata(file));
            assigned = true;
            break;
          }
        }
      }

      // If no project tag found, add to "No Project" group
      if (!assigned) {
        groups["No Project"].push(crateToFileMetadata(file));
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
          <APIQuotaInfo
            userQuota={userQuota}
            userStorage={userStorage}
            userSharedCrates={userSharedCrates}
            quotaLoading={quotaLoading}
            formatFileSize={formatFileSize}
          />
        )}
        {/* Header with search */}
        <div className="flex flex-col items-center justify-center mb-8 mt-4">
          <h1 className="text-2xl font-medium text-gray-800 mb-4">My crates</h1>

          {/* Search and filters container */}
          <div className="w-full">
            {/* Search bar and toggle */}
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isAdvancedSearch={isAdvancedSearch}
              setIsAdvancedSearch={setIsAdvancedSearch}
              advancedSearchFields={advancedSearchFields}
              setAdvancedSearchFields={setAdvancedSearchFields}
              handleSearchKeyDown={handleSearchKeyDown}
              handleAdvancedSearch={handleAdvancedSearch}
            />

            {/* View mode toggle and quick tag filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between max-w-4xl mx-auto mb-4">
              <div className="flex space-x-2 mb-3 md:mb-0"></div>
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
          <CratesList
            loading={loading}
            searchLoading={searchLoading}
            searchResults={searchResults}
            filteredFiles={filteredFiles}
            searchQuery={searchQuery}
            formatFileSize={formatFileSize}
            getFileIcon={getFileIcon}
            copyShareLink={copyShareLink}
            setSearchQuery={setSearchQuery}
            setFileToDelete={setFileToDelete}
            setDeleteModalVisible={setDeleteModalVisible}
            renderMetadata={renderMetadata}
            crateToFileMetadata={crateToFileMetadata}
            loadingMore={loadingMore}
            hasMore={hasMore}
            fetchCrates={fetchCrates}
          />
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isVisible={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setFileToDelete(null);
        }}
        onConfirm={() => fileToDelete && handleDeleteFile(fileToDelete)}
      />
    </div>
  );
}
