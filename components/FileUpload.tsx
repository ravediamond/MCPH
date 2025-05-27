"use client";

import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaFile,
  FaSpinner,
  FaCheckCircle,
  FaTimes,
  FaCopy,
  FaExternalLinkAlt,
  FaTags,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { DATA_TTL } from "../app/config/constants";
import { CrateCategory, CrateSharing } from "../app/types/crate";

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// API base URL is now relative since we're using Next.js API routes on Vercel
const API_BASE_URL = "";

// Content types to store in Firestore
const TEXT_CONTENT_TYPES = [
  "text/plain",
  "text/markdown",
  "application/json",
  "text/x-markdown",
  "text/x-json",
  "application/x-json",
];

// File extensions to store in Firestore
const TEXT_FILE_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".text",
  ".todolist",
];

// Available crate categories that users can select
const CRATE_CATEGORIES = [
  { value: CrateCategory.BINARY, label: "Generic File" },
  { value: CrateCategory.DATA, label: "Data" },
  { value: CrateCategory.IMAGE, label: "Image" },
  { value: CrateCategory.MARKDOWN, label: "Markdown" },
  { value: CrateCategory.TODOLIST, label: "To-Do List" },
  { value: CrateCategory.DIAGRAM, label: "Diagram" },
  { value: CrateCategory.CODE, label: "Code" },
  { value: CrateCategory.JSON, label: "JSON" },
];

// Mapping of MIME types to crate categories
const MIME_TYPE_TO_CATEGORY: Record<string, CrateCategory> = {
  "image/png": CrateCategory.IMAGE,
  "image/jpeg": CrateCategory.IMAGE,
  "image/gif": CrateCategory.IMAGE,
  "image/webp": CrateCategory.IMAGE,
  "image/svg+xml": CrateCategory.IMAGE,
  "text/markdown": CrateCategory.MARKDOWN,
  "text/x-markdown": CrateCategory.MARKDOWN,
  "application/json": CrateCategory.JSON, // Changed from CrateCategory.DATA
  "text/csv": CrateCategory.DATA,
  "text/plain": CrateCategory.CODE,
  "application/javascript": CrateCategory.CODE,
  "text/javascript": CrateCategory.CODE,
  "text/html": CrateCategory.CODE,
  "text/css": CrateCategory.CODE,
};

// Mapping of file extensions to crate categories
const EXTENSION_TO_CATEGORY: Record<string, CrateCategory> = {
  ".png": CrateCategory.IMAGE,
  ".jpg": CrateCategory.IMAGE,
  ".jpeg": CrateCategory.IMAGE,
  ".gif": CrateCategory.IMAGE,
  ".webp": CrateCategory.IMAGE,
  ".svg": CrateCategory.IMAGE,
  ".md": CrateCategory.MARKDOWN,
  ".markdown": CrateCategory.MARKDOWN,
  ".json": CrateCategory.JSON, // Changed from CrateCategory.DATA
  ".csv": CrateCategory.DATA,
  ".js": CrateCategory.CODE,
  ".ts": CrateCategory.CODE,
  ".html": CrateCategory.CODE,
  ".css": CrateCategory.CODE,
  ".todolist": CrateCategory.TODOLIST,
  ".mmd": CrateCategory.DIAGRAM,
  ".diagram": CrateCategory.DIAGRAM,
};

// Type definition update to include new Crate fields
type UploadedCrate = {
  id: string;
  fileName: string;
  title: string;
  description?: string;
  contentType: string;
  category: CrateCategory;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
  tags?: string[];
};

interface FileUploadProps {
  onUploadSuccess?: (data: UploadedCrate) => void;
  onUploadError?: (error: Error | string) => void;
}

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
}: FileUploadProps) {
  // Get current user from auth context
  const { user } = useAuth();

  // Refs
  const formRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [selectedTtlDays, setSelectedTtlDays] = useState<number>(
    DATA_TTL.DEFAULT_DAYS,
  ); // Added state for TTL
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadedCrate | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [fileType, setFileType] = useState<CrateCategory>(CrateCategory.BINARY); // Default crate type
  // Metadata state
  const [metadataList, setMetadataList] = useState<
    { key: string; value: string }[]
  >([]);
  // Sharing state
  const [isShared, setIsShared] = useState<boolean>(false); // New: sharing toggle
  const [password, setPassword] = useState<string>(""); // New: optional password

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date to human-readable
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if a file should be stored in Firestore
  const shouldUseFirestore = (file: File): boolean => {
    // Check content type
    if (TEXT_CONTENT_TYPES.includes(file.type)) {
      return true;
    }

    // Check file extension if content type is not specified or ambiguous
    const fileName = file.name.toLowerCase();
    return TEXT_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  };

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(
        `Crate is too large (${formatBytes(selectedFile.size)}). Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`,
      );
      return;
    }

    setFile(selectedFile);
    setUploadedFile(null); // Reset previous upload state

    // Automatically use the filename as the title (without extension)
    const fileNameWithoutExtension = selectedFile.name.replace(
      /\\.[^/.]+$/,
      "",
    );
    setTitle(fileNameWithoutExtension);

    // Automatically detect crate type based on content type or extension
    let detectedCategory: CrateCategory = CrateCategory.BINARY; // Default type

    // First check MIME type
    if (MIME_TYPE_TO_CATEGORY[selectedFile.type]) {
      detectedCategory = MIME_TYPE_TO_CATEGORY[selectedFile.type];
    } else {
      // Then check file extension
      const fileExtension = selectedFile.name
        .match(/\\.[^/.]+$/)?.[0]
        .toLowerCase();
      if (fileExtension && EXTENSION_TO_CATEGORY[fileExtension]) {
        detectedCategory = EXTENSION_TO_CATEGORY[fileExtension];
      }
    }

    // Set the detected file type
    setFileType(detectedCategory);
  }, []); // Keep dependencies minimal, assuming MIME_TYPE_TO_CATEGORY and EXTENSION_TO_CATEGORY are stable

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  // Handle metadata changes
  const handleMetadataChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setMetadataList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };
  const handleAddMetadata = () => {
    setMetadataList((prev) => [...prev, { key: "", value: "" }]);
  };
  const handleRemoveMetadata = (index: number) => {
    setMetadataList((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle crate upload using the appropriate endpoint based on crate type
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select an crate to upload.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your crate.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Set up progress reporting
    const updateProgressInterval = setInterval(() => {
      // Simulate progress
      const simulatedProgress = Math.min(
        95,
        uploadProgress + Math.random() * 5,
      );
      setUploadProgress(simulatedProgress);
    }, 300);

    try {
      let uploadResponse;
      let uploadedFileData;

      // Get auth token if user is logged in
      let authToken = null;
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
      }

      // Always use direct-upload endpoint for all file types
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ttlDays", selectedTtlDays.toString());
      formData.append("title", title);
      formData.append("description", description);
      formData.append("fileType", fileType);
      formData.append("isShared", isShared ? "true" : "false");
      if (password && isShared) {
        formData.append("password", password);
      }
      if (user) {
        formData.append("userId", user.uid);
      }
      if (metadataList.length > 0) {
        formData.append(
          "metadata",
          JSON.stringify(metadataList.filter((m) => m.key)),
        );
      }
      uploadResponse = await fetch("/api/uploads/direct-upload", {
        method: "POST",
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorDetail = `Upload failed with status: ${uploadResponse.status}`;
        try {
          const errorData = await uploadResponse.json();
          errorDetail = errorData.error || errorData.details || errorDetail;
        } catch (e) {
          console.error("Error reading error response body:", e);
        }
        throw new Error(errorDetail);
      }

      clearInterval(updateProgressInterval);
      setUploadProgress(100);

      uploadedFileData = await uploadResponse.json();

      // Use the full URL for the download link
      const crateUrl = `${window.location.origin}/crate/${uploadedFileData.fileId}`;

      setUploadedFile({
        id: uploadedFileData.fileId,
        fileName: file.name,
        title: title,
        description: description,
        contentType: file.type || "application/octet-stream",
        category: fileType, // No longer need 'as CrateCategory'
        size: file.size,
        downloadUrl: crateUrl,
        uploadedAt: new Date().toISOString(),
      });

      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }

      // Reset state
      setTitle("");
      setDescription("");

      toast.success("Crate uploaded successfully!");

      // Call the onUploadSuccess callback if provided
      if (onUploadSuccess) {
        onUploadSuccess({
          id: uploadedFileData.fileId,
          fileName: file.name,
          title: title,
          description: description,
          contentType: file.type || "application/octet-stream",
          category: fileType, // No longer need 'as CrateCategory'
          size: file.size,
          downloadUrl: crateUrl,
          uploadedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      clearInterval(updateProgressInterval);
      setIsUploading(false);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown upload error";
      console.error("Upload error:", errorMessage);
      toast.error(`Upload failed: ${errorMessage}`);

      // Call onUploadError callback if provided
      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  };

  // Handle copy URL to clipboard
  const handleCopyUrl = () => {
    if (!uploadedFile) return;

    // Ensure the full URL is copied
    navigator.clipboard
      .writeText(uploadedFile.downloadUrl)
      .then(() => {
        setUrlCopied(true);
        toast.success("URL copied to clipboard!");

        // Reset copy status after 2 seconds
        setTimeout(() => setUrlCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy URL to clipboard");
      });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {uploadedFile ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-green-600 flex items-center">
              <FaCheckCircle className="mr-2" /> Upload Successful
            </h3>
            <button
              onClick={() => setUploadedFile(null)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <FaFile className="text-gray-500 mr-3" />
              <div>
                <p className="font-medium">{uploadedFile.fileName}</p>
                <p className="text-sm text-gray-500">
                  {formatBytes(uploadedFile.size)} • {uploadedFile.contentType}
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Type: {uploadedFile.category}
                  </span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Stored in GCS Bucket
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-beige-100 p-4 rounded-md">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  <span className="block md:inline">
                    Uploaded: {formatDate(uploadedFile.uploadedAt)}
                  </span>
                </p>
              </div>

              <div className="relative">
                <input
                  ref={urlRef}
                  type="text"
                  readOnly
                  value={uploadedFile.downloadUrl}
                  className="w-full bg-white py-2 px-3 pr-20 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <div className="absolute right-1 top-1 flex">
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 text-gray-500 hover:text-primary-500 bg-gray-100 rounded mr-1"
                    title="Copy to clipboard"
                  >
                    {urlCopied ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaCopy />
                    )}
                  </button>
                  <a
                    href={uploadedFile.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-500 hover:text-primary-500 bg-gray-100 rounded"
                    title="Open in new tab"
                  >
                    <FaExternalLinkAlt />
                  </a>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <a
                  href={uploadedFile.downloadUrl}
                  className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-center text-white rounded-md shadow transition-colors" // Changed to blue
                >
                  Download Crate
                </a>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-center text-white rounded-md shadow transition-colors" // Changed to blue
                >
                  Upload Another Crate
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Share this link to allow others to download the crate.
            </p>
          </div>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleUpload}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Upload an Crate
          </h2>

          <div
            {...getRootProps({
              className: `border-2 border-dashed ${isDragActive ? "border-primary-400 bg-beige-100" : "border-gray-300"} rounded-lg p-8 text-center cursor-pointer hover:bg-beige-50 transition-colors mb-4`,
            })}
          >
            <input {...getInputProps()} />

            <div className="space-y-3">
              <FaUpload className="mx-auto text-gray-400 text-3xl" />

              {isDragActive ? (
                <p className="text-primary-500">Drop the crate here...</p>
              ) : (
                <>
                  <p className="text-gray-600">
                    Drag & drop an crate here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum crate size: 50MB
                  </p>
                </>
              )}
            </div>
          </div>

          {file && (
            <div className="bg-beige-100 p-3 rounded-md mb-4 flex items-center">
              <FaFile className="text-primary-400 mr-3" />
              <div className="overflow-hidden">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {formatBytes(file.size)} •{" "}
                  {file.type || "application/octet-stream"}
                  {shouldUseFirestore(file) && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Text crate
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="ml-auto text-gray-400 hover:text-red-500"
                onClick={() => setFile(null)}
                aria-label="Remove crate"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {file && (
            <>
              {/* Crate Type Selector - Added Here */}
              <div className="mb-4">
                <label
                  htmlFor="fileTypeSelect"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Crate Type:
                </label>
                <select
                  id="fileTypeSelect"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as CrateCategory)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  disabled={isUploading}
                >
                  {CRATE_CATEGORIES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the type of content you're uploading.
                </p>
              </div>

              {/* TTL Selector */}
              <div className="mb-4">
                <label
                  htmlFor="ttlSelect"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Set Time-To-Live (TTL):
                </label>
                <select
                  id="ttlSelect"
                  value={selectedTtlDays}
                  onChange={(e) => setSelectedTtlDays(Number(e.target.value))}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  disabled={isUploading}
                >
                  {DATA_TTL.OPTIONS.map((days) => (
                    <option key={days} value={days}>
                      {days} day{days > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The crate will be automatically deleted after this period.
                </p>
              </div>

              {/* Title and Description Fields */}
              <div className="mb-4">
                <label
                  htmlFor="fileTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="fileTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your crate"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                  disabled={isUploading}
                  autoComplete="off"
                  name="crate-title"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="fileDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="fileDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description for your crate"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  rows={3}
                  disabled={isUploading}
                />
              </div>

              {/* Metadata Key-Value Pairs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata (optional)
                </label>
                {metadataList.map((item, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={item.key}
                      onChange={(e) =>
                        handleMetadataChange(idx, "key", e.target.value)
                      }
                      className="mr-2 flex-1 py-1 px-2 border border-gray-300 rounded"
                      disabled={isUploading}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) =>
                        handleMetadataChange(idx, "value", e.target.value)
                      }
                      className="mr-2 flex-1 py-1 px-2 border border-gray-300 rounded"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveMetadata(idx)}
                      disabled={isUploading}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs"
                  onClick={handleAddMetadata}
                  disabled={isUploading}
                >
                  + Add Metadata
                </button>
              </div>

              {/* Sharing Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sharing Options:
                </label>
                <div className="flex items-center mb-2">
                  <input
                    id="isShared"
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    disabled={isUploading}
                    className="mr-2"
                  />
                  <label htmlFor="isShared" className="text-sm text-gray-700">
                    Make this crate shared (anyone with the link can download)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    type="password"
                    placeholder="Optional password (leave blank for none)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!isShared || isUploading}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If set, users must enter this password to download the
                    crate.
                  </p>
                </div>
              </div>
            </>
          )}

          {isUploading && (
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full mb-1 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isUploading || !title.trim()}
            className={`w-full py-2 px-4 rounded-md shadow-sm flex items-center justify-center border font-medium transition-colors ${
              !file || isUploading || !title.trim()
                ? "bg-gray-300 cursor-not-allowed text-gray-500 border-gray-300"
                : "bg-blue-500 hover:bg-blue-600 text-white border-blue-600" // Changed to blue-500 and blue-600
            }
                        `}
          >
            {isUploading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              "Upload Crate"
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By uploading an crate, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </form>
      )}
    </div>
  );
}
