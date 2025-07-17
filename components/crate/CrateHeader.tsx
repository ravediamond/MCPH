"use client";

import React from "react";
import Link from "next/link";
import {
  FaFileDownload,
  FaFile,
  FaClock,
  FaShareAlt,
  FaUpload,
  FaFileAlt,
  FaFileImage,
  FaFileCode,
  FaChartBar,
  FaDownload,
  FaEye,
  FaLock,
  FaComments,
  FaEdit,
  FaSave,
  FaTimes,
  FaCopy,
  FaLink,
} from "react-icons/fa";
import Card from "../ui/Card";
import { CrateCategory } from "../../shared/types/crate";

interface CrateHeaderProps {
  crateInfo: any;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  editLoading: boolean;
  timeRemaining: string | null;
  copySuccess: string | null;
  copyError: string | null;
  editSuccess: string | null;
  editError: string | null;
  deleteError: string | null;
  deleteLoading: boolean;
  copyLoading: boolean;
  showPreview: boolean;
  user: any;
  handleSaveEdit: () => void;
  handleEditCancel: () => void;
  handleEditStart: () => void;
  handleDownload: () => void;
  handleCopyCrate: () => void;
  handleViewContent: () => void;
  handleOpenSharingModal: () => void;
  handleDelete: () => void;
  signInWithGoogle: () => void;
  handleCopyLink: () => void;
  linkCopied: boolean;
  getCrateIcon: () => React.ReactNode;
  formatBytes: (bytes: number) => string;
  formatCategoryForDisplay: (category: CrateCategory) => string;
  formatDate: (date: string) => string;
  renderTags: (tags: string[]) => React.ReactNode;
  renderMetadata: (metadata: any) => React.ReactNode;
  crateId: string;
  crateContent?: string | null;
  contentLoading?: boolean;
}

export default function CrateHeader({
  crateInfo,
  isEditing,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editLoading,
  timeRemaining,
  copySuccess,
  copyError,
  editSuccess,
  editError,
  deleteError,
  deleteLoading,
  copyLoading,
  showPreview,
  user,
  handleSaveEdit,
  handleEditCancel,
  handleEditStart,
  handleDownload,
  handleCopyCrate,
  handleViewContent,
  handleOpenSharingModal,
  handleDelete,
  signInWithGoogle,
  handleCopyLink,
  linkCopied,
  getCrateIcon,
  formatBytes,
  formatCategoryForDisplay,
  formatDate,
  renderTags,
  renderMetadata,
  crateId,
  crateContent,
  contentLoading,
}: CrateHeaderProps) {
  // Generate preview snippet (first ~100 lines or 2KB)
  const generatePreviewSnippet = () => {
    if (!crateContent) return null;

    const maxLines = 100;
    const maxBytes = 2048; // 2KB

    // Limit by bytes first
    let preview =
      crateContent.length > maxBytes
        ? crateContent.substring(0, maxBytes) + "..."
        : crateContent;

    // Then limit by lines
    const lines = preview.split("\n");
    if (lines.length > maxLines) {
      preview = lines.slice(0, maxLines).join("\n") + "\n...";
    }

    return preview;
  };

  const getFileTypeIcon = () => {
    if (crateInfo.category === CrateCategory.IMAGE) {
      return <FaFileImage className="text-blue-500" size={48} />;
    } else if (crateInfo.category === CrateCategory.CODE) {
      return <FaFileCode className="text-yellow-500" size={48} />;
    } else if (crateInfo.category === CrateCategory.DATA) {
      return <FaFile className="text-orange-500" size={48} />;
    } else {
      return <FaFileAlt className="text-purple-500" size={48} />;
    }
  };

  const shouldShowPreview = () => {
    return (
      crateInfo.category === CrateCategory.TEXT ||
      crateInfo.category === CrateCategory.CODE ||
      crateInfo.category === CrateCategory.DATA
    );
  };

  return (
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
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className="text-2xl font-semibold text-gray-900"
                  title={crateInfo.title}
                >
                  {crateInfo.title}
                </h1>
                <button
                  onClick={handleCopyLink}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    linkCopied
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                  }`}
                  title={
                    linkCopied ? "Link copied!" : "Copy link to this crate"
                  }
                >
                  <FaLink size={16} />
                </button>
              </div>
            )}
            {/* Trust metadata line */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                Uploaded by{" "}
                <span className="font-medium text-gray-800 ml-1">
                  @{crateInfo.owner || "anonymous"}
                </span>
              </span>
              <span className="text-gray-400">·</span>
              <span className="flex items-center text-green-600">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Scanned clean
              </span>
              <span className="text-gray-400">·</span>
              <span>Created {formatDate(crateInfo.createdAt)}</span>
              <span className="text-gray-400">·</span>
              <span>Size {formatBytes(crateInfo.size || 0)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
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
                    case CrateCategory.IMAGE:
                      return (
                        <>
                          <FaFileImage className="mr-1" size={12} /> Image
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

        {/* Inline Preview Snippet */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Content Preview
            </h3>
            {shouldShowPreview() && crateContent && (
              <span className="text-xs text-gray-500">
                {crateContent.length > 2048 ||
                crateContent.split("\n").length > 100
                  ? "First 2KB / 100 lines shown"
                  : "Full content"}
              </span>
            )}
          </div>

          <div className="p-4">
            {contentLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-gray-500">
                  Loading preview...
                </div>
              </div>
            ) : shouldShowPreview() && crateContent ? (
              <div className="space-y-3">
                <pre className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                  {generatePreviewSnippet()}
                </pre>
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleViewContent}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {showPreview ? "Hide full content" : "View full content →"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Download
                    </button>
                    {!crateInfo.isOwner && (
                      <button
                        onClick={user ? handleCopyCrate : signInWithGoogle}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {user ? "Copy to My MCPH" : "Sign in to copy"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : crateInfo.category === CrateCategory.IMAGE ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                {getFileTypeIcon()}
                <p className="mt-3 text-sm font-medium">Image Preview</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(crateInfo.size || 0)}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleViewContent}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View image →
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                {getFileTypeIcon()}
                <p className="mt-3 text-sm font-medium">
                  Preview not available
                </p>
                <p className="text-xs text-gray-400">
                  Download or copy to view content
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Download
                  </button>
                  {!crateInfo.isOwner && (
                    <button
                      onClick={user ? handleCopyCrate : signInWithGoogle}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {user ? "Copy to My MCPH" : "Sign in to copy"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
            // Regular content - Copy to My MCPH is now PRIMARY
            <>
              {/* Copy to My MCPH - PRIMARY ACTION for non-owners */}
              {!crateInfo.isOwner && user && (
                <button
                  onClick={handleCopyCrate}
                  disabled={copyLoading}
                  className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white text-base font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 border border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                >
                  <FaCopy className="mr-2 text-lg" />
                  <span>{copyLoading ? "Copying..." : "Copy to My MCPH"}</span>
                </button>
              )}

              {/* Sign in to Copy - PRIMARY ACTION for non-signed-in users */}
              {!crateInfo.isOwner && !user && (
                <button
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                      // After successful login, automatically copy
                      setTimeout(() => handleCopyCrate(), 1000);
                    } catch (error) {
                      console.error("Error signing in:", error);
                    }
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white text-base font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 border border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaCopy className="mr-2 text-lg" />
                  <span>Copy to My MCPH</span>
                </button>
              )}

              {/* Download - now SECONDARY action */}
              <button
                onClick={handleDownload}
                className="flex items-center justify-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 border border-gray-300 shadow-sm"
              >
                <FaDownload className="mr-2" />
                <span>Download</span>
              </button>
            </>
          )}

          {/* Secondary Actions */}

          {/* Show preview button for supported categories (excluding feedback) */}
          {(crateInfo.category === CrateCategory.TEXT ||
            crateInfo.category === CrateCategory.CODE ||
            crateInfo.category === CrateCategory.DATA ||
            crateInfo.category === CrateCategory.IMAGE) && (
            <button
              onClick={handleViewContent}
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
  );
}
