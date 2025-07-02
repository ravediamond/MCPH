import React from "react";
import { FaFileAlt, FaUpload } from "react-icons/fa";
import Link from "next/link";
import Card from "../ui/Card";
import CrateCard from "./CrateCard";
import { Crate } from "@/app/types/crate";

interface CratesListProps {
  loading: boolean;
  searchLoading: boolean;
  searchResults: Crate[] | null;
  filteredFiles: Crate[];
  searchQuery: string;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (file: Crate) => React.ReactNode;
  copyShareLink: (fileId: string) => void;
  setSearchQuery: (query: string) => void;
  setFileToDelete: (fileId: string) => void;
  setDeleteModalVisible: (isVisible: boolean) => void;
  renderMetadata: (metadata?: Record<string, string>) => React.ReactNode;
  crateToFileMetadata: (crate: Crate) => Crate;
  loadingMore: boolean;
  hasMore: boolean;
  fetchCrates: (loadMore: boolean) => void;
}

const CratesList: React.FC<CratesListProps> = ({
  loading,
  searchLoading,
  searchResults,
  filteredFiles,
  searchQuery,
  formatFileSize,
  getFileIcon,
  copyShareLink,
  setSearchQuery,
  setFileToDelete,
  setDeleteModalVisible,
  renderMetadata,
  crateToFileMetadata,
  loadingMore,
  hasMore,
  fetchCrates,
}) => {
  // Loading state for search
  if (searchLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="mt-2 text-gray-500">Searching...</div>
        </div>
      </div>
    );
  }

  // Search results
  if (searchResults !== null) {
    if (searchResults.length === 0) {
      return (
        <Card className="p-8 text-center">
          <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-2" />
          <p className="text-gray-500">No matching crates found</p>
        </Card>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {searchResults.map((file) => (
            <CrateCard
              key={file.id}
              file={file as Crate}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
              copyShareLink={copyShareLink}
              setSearchQuery={setSearchQuery}
              setFileToDelete={setFileToDelete}
              setDeleteModalVisible={setDeleteModalVisible}
              renderMetadata={renderMetadata}
              isSearchResult={true}
              crateToFileMetadata={crateToFileMetadata}
            />
          ))}
        </div>

        {/* Stats for search results */}
        <div className="mt-4 text-sm text-gray-500 flex justify-between">
          <span>Total: {searchResults.length} crates</span>
          <span>
            {formatFileSize(
              searchResults.reduce((sum, file) => sum + file.size, 0),
            )}
          </span>
        </div>
      </>
    );
  }

  // Loading state for initial load
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // No files
  if (filteredFiles.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-2" />
        <p className="text-gray-500">
          {searchQuery ? "No matching crates found" : "No crates uploaded yet"}
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
    );
  }

  // Files grid
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <CrateCard
            key={file.id}
            file={file}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            copyShareLink={copyShareLink}
            setSearchQuery={setSearchQuery}
            setFileToDelete={setFileToDelete}
            setDeleteModalVisible={setDeleteModalVisible}
            renderMetadata={renderMetadata}
            crateToFileMetadata={crateToFileMetadata}
          />
        ))}
      </div>

      {/* File stats */}
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
    </>
  );
};

export default CratesList;
