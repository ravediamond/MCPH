import React from "react";
import Link from "next/link";
import {
  FaShareAlt,
  FaEye,
  FaDownload,
  FaTrash,
  FaEdit,
  FaChartBar,
} from "react-icons/fa";
import Card from "../ui/Card";
import CrateTag from "./CrateTag";
import { Crate } from "@/app/types/crate";

interface CrateCardProps {
  file: Crate;
  getFileIcon: (file: Crate) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  copyShareLink: (fileId: string) => void;
  setSearchQuery: (query: string) => void;
  setFileToDelete: (fileId: string) => void;
  setDeleteModalVisible: (isVisible: boolean) => void;
  renderMetadata: (metadata?: Record<string, string>) => React.ReactNode;
  isSearchResult?: boolean;
  crateToFileMetadata: (crate: Crate) => Crate;
}

const CrateCard: React.FC<CrateCardProps> = ({
  file,
  getFileIcon,
  formatFileSize,
  copyShareLink,
  setSearchQuery,
  setFileToDelete,
  setDeleteModalVisible,
  renderMetadata,
  isSearchResult = false,
  crateToFileMetadata,
}) => {
  // For search results, we use a more compact layout
  if (isSearchResult) {
    return (
      <Card key={file.id} hoverable className="transition-all overflow-hidden">
        <div className="p-3">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5">
              {getFileIcon(crateToFileMetadata(file))}
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

              {/* File Description - improved with styling */}
              {file.description && (
                <p
                  className="text-xs text-gray-600 mt-1 line-clamp-2 bg-gray-50 p-1 rounded"
                  title={file.description}
                >
                  {file.description}
                </p>
              )}

              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <div className="truncate mr-2">
                  {file.category === "feedback"
                    ? "Feedback Template"
                    : formatFileSize(file.size)}
                </div>
                <div className="flex items-center whitespace-nowrap">
                  {file.category === "feedback" ? (
                    <>
                      <FaChartBar className="mr-1" size={10} />
                      {file.metadata?.submissionCount || 0} responses
                    </>
                  ) : (
                    <>
                      <FaDownload className="mr-1" size={10} />
                      {file.downloadCount || 0}
                    </>
                  )}
                </div>
              </div>

              {/* Tags - if available - enhanced styling */}
              {file.tags && file.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-1">
                  {file.tags.map((tag: string, index: number) => (
                    <CrateTag key={index} tag={tag} onClick={setSearchQuery} />
                  ))}
                </div>
              )}

              {/* Shared status indicator */}
              <div className="mt-1 text-xs">
                {file.shared?.public ? (
                  <span className="text-green-600 font-medium">Shared</span>
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
    );
  }

  // For regular display, we use a more detailed layout
  return (
    <Card key={file.id} hoverable className="transition-all overflow-hidden">
      <div className="p-4">
        {/* File Header with Icon and Title */}
        <div className="flex items-start mb-3">
          <div className="mt-0.5 mr-3">
            {getFileIcon(crateToFileMetadata(file))}
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

            {/* File Description - enhanced with better styling */}
            {file.description && (
              <div className="mt-2 mb-1 bg-gray-50 p-2 rounded border border-gray-100">
                <p
                  className="text-xs text-gray-700 line-clamp-3"
                  title={file.description}
                >
                  {file.description}
                </p>
              </div>
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
                ? new Date(file.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Unknown"}
            </span>
          </div>

          {/* Downloads or Responses */}
          <div className="text-xs">
            {file.category === "feedback" ? (
              <>
                <span className="text-gray-500 mr-1">Responses:</span>
                <span className="font-medium text-gray-700">
                  {file.metadata?.submissionCount || 0}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-500 mr-1">Downloads:</span>
                <span className="font-medium text-gray-700">
                  {file.downloadCount || 0}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tags - if available - enhanced styling */}
        {file.tags && file.tags.length > 0 && (
          <div className="mb-3 bg-gray-50 p-2 rounded border border-gray-100">
            <div className="text-xs text-gray-600 mb-1 font-medium">Tags:</div>
            <div className="flex flex-wrap gap-1.5">
              {file.tags.map((tag: string, index: number) => (
                <CrateTag key={index} tag={tag} onClick={setSearchQuery} />
              ))}
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
            <span className="font-medium block mb-1">Metadata:</span>
            <div className="grid grid-cols-1 gap-1 ml-2">
              {Object.entries(file.metadata).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium mr-1">{key}:</span>
                  <span className="truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Quick Actions */}
        <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
          {/* Quick tag buttons */}
          <div className="flex space-x-1"></div>

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

            {file.category === "feedback" ? (
              <>
                <Link
                  href={`/feedback/responses/${file.id}`}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                  title="View responses"
                >
                  <FaChartBar size={14} />
                </Link>
                <Link
                  href={`/feedback/manage?edit=${file.id}`}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit template"
                >
                  <FaEdit size={14} />
                </Link>
              </>
            ) : (
              <Link
                href={`/download/${file.id}`}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                title="Download"
              >
                <FaDownload size={14} />
              </Link>
            )}

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
  );
};

export default CrateCard;
