"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { CrateCategory } from "../shared/types/crate";
import TagInput from "./ui/TagInput";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

const API_BASE_URL = "";

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
  ".yaml",
  ".yml",
  ".text",
];

// Available crate categories that users can select (simplified for v1)
const CRATE_CATEGORIES = [
  { value: CrateCategory.BINARY, label: "Generic File" },
  { value: CrateCategory.IMAGE, label: "Image" },
  { value: CrateCategory.MARKDOWN, label: "Markdown" },
  { value: CrateCategory.CODE, label: "Code" },
  { value: CrateCategory.JSON, label: "JSON" },
  { value: CrateCategory.YAML, label: "YAML" },
  { value: CrateCategory.TEXT, label: "Text" },
];

// Mapping of MIME types to crate categories (simplified for v1)
const MIME_TYPE_TO_CATEGORY: Record<string, CrateCategory> = {
  "image/png": CrateCategory.IMAGE,
  "image/jpeg": CrateCategory.IMAGE,
  "image/gif": CrateCategory.IMAGE,
  "image/webp": CrateCategory.IMAGE,
  "image/svg+xml": CrateCategory.IMAGE,
  "text/markdown": CrateCategory.MARKDOWN,
  "text/x-markdown": CrateCategory.MARKDOWN,
  "application/json": CrateCategory.JSON,
  "application/yaml": CrateCategory.YAML,
  "text/yaml": CrateCategory.YAML,
  "text/x-yaml": CrateCategory.YAML,
  "application/x-yaml": CrateCategory.YAML,
  "text/plain": CrateCategory.TEXT,
  "application/javascript": CrateCategory.CODE,
  "text/javascript": CrateCategory.CODE,
  "text/html": CrateCategory.CODE,
  "text/css": CrateCategory.CODE,
};

// Mapping of file extensions to crate categories (simplified for v1)
const EXTENSION_TO_CATEGORY: Record<string, CrateCategory> = {
  ".png": CrateCategory.IMAGE,
  ".jpg": CrateCategory.IMAGE,
  ".jpeg": CrateCategory.IMAGE,
  ".gif": CrateCategory.IMAGE,
  ".webp": CrateCategory.IMAGE,
  ".svg": CrateCategory.IMAGE,
  ".md": CrateCategory.MARKDOWN,
  ".markdown": CrateCategory.MARKDOWN,
  ".json": CrateCategory.JSON,
  ".yaml": CrateCategory.YAML,
  ".yml": CrateCategory.YAML,
  ".js": CrateCategory.CODE,
  ".ts": CrateCategory.CODE,
  ".html": CrateCategory.CODE,
  ".css": CrateCategory.CODE,
  ".txt": CrateCategory.TEXT,
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

  // Redirect to login if user is not authenticated
  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-red-600">
            Authentication Required
          </h3>
          <p className="text-gray-700 mb-4">
            You need to be logged in to upload crates. Please sign in to
            continue.
          </p>
        </div>
      </div>
    );
  }

  // Refs
  const formRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadedCrate | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [fileType, setFileType] = useState<CrateCategory>(CrateCategory.BINARY); // Default crate type
  const [isShared, setIsShared] = useState<boolean>(true); // Default to shared

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
        `That file is too big (limit ${formatBytes(MAX_FILE_SIZE)}). Try compressing it.`,
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

  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    onDrop,
    multiple: false,
    noClick: false,
  });

  // Add an effect to show the full-width highlight when dragging over the form
  useEffect(() => {
    const handleFormDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!formRef.current) return;
      formRef.current.classList.add("ring-4", "ring-[#ff7a32]/30");
    };

    const handleFormDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!formRef.current) return;
      formRef.current.classList.remove("ring-4", "ring-[#ff7a32]/30");
    };

    const handleFormDrop = (e: DragEvent) => {
      if (!formRef.current) return;
      formRef.current.classList.remove("ring-4", "ring-[#ff7a32]/30");
    };

    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener("dragover", handleFormDragOver);
      formElement.addEventListener("dragleave", handleFormDragLeave);
      formElement.addEventListener("drop", handleFormDrop);

      return () => {
        formElement.removeEventListener("dragover", handleFormDragOver);
        formElement.removeEventListener("dragleave", handleFormDragLeave);
        formElement.removeEventListener("drop", handleFormDrop);
      };
    }
  }, []);

  // Handle crate upload using the appropriate endpoint based on crate type
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a crate to upload.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your crate.");
      return;
    }

    setIsUploading(true);

    try {
      let uploadResponse;
      let uploadedFileData;

      // Get auth token if user is logged in
      let authToken = null;
      try {
        authToken = await user.getIdToken();
      } catch (error) {
        console.error("Error getting auth token:", error);
      }

      // Always use direct-upload endpoint for all file types
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("fileType", fileType);
      formData.append("category", fileType); // Explicitly add the selected category
      formData.append("isShared", isShared ? "true" : "false");

      // Add tags if present
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }

      formData.append("userId", user.uid);

      uploadResponse = await fetch("/api/uploads/direct-upload", {
        method: "POST",
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorDetail = `Sorry, we couldn't upload your file. Please try again.`;
        try {
          const errorData = await uploadResponse.json();
          errorDetail = errorData.error || errorData.details || errorDetail;
        } catch (e) {
          console.error("Error reading error response body:", e);
        }
        throw new Error(errorDetail);
      }

      uploadedFileData = await uploadResponse.json();

      // Use the full URL for the download link
      const crateUrl = `${window.location.origin}/crate/${uploadedFileData.fileId}`;

      setUploadedFile({
        id: uploadedFileData.fileId,
        fileName: file.name,
        title: title,
        description: description,
        contentType: file.type || "application/octet-stream",
        category: fileType, // Use the selected category
        size: file.size,
        downloadUrl: crateUrl,
        uploadedAt: new Date().toISOString(),
        tags: uploadedFileData.tags || tags, // Use tags from response or local state
      });

      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }

      // Reset state
      setTitle("");
      setDescription("");
      setTags([]);

      toast.success("Your file has been uploaded successfully!");

      // Call the onUploadSuccess callback if provided
      if (onUploadSuccess) {
        onUploadSuccess({
          id: uploadedFileData.fileId,
          fileName: file.name,
          title: title,
          description: description,
          contentType: file.type || "application/octet-stream",
          category: fileType,
          size: file.size,
          downloadUrl: crateUrl,
          uploadedAt: new Date().toISOString(),
          tags: uploadedFileData.tags || tags, // Use tags from response or local state
        });
      }
    } catch (error) {
      setIsUploading(false);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown upload error";
      console.error("Upload error:", errorMessage);
      toast.error(`Sorry, we couldn't upload your file. Please try again.`);

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
          </div>{" "}
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
                </p>
              </div>
            </div>

            {/* Display tags if present */}
            {uploadedFile.tags && uploadedFile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="text-sm text-gray-600 flex items-center">
                  <FaTags className="mr-1" /> Tags:
                </div>
                {uploadedFile.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

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
                  className="w-full bg-white py-2 px-3 pr-24 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff7a32]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  aria-label="Generated crate link"
                />
                <div className="absolute right-1 top-1 flex">
                  <button
                    onClick={handleCopyUrl}
                    className={`p-1.5 rounded mr-1 flex items-center justify-center ${
                      urlCopied
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-[#ff7a32]"
                    }`}
                    title="Copy to clipboard"
                    aria-label="Copy link to clipboard"
                  >
                    {urlCopied ? (
                      <>
                        <FaCheckCircle className="text-green-500 mr-1" />{" "}
                        <span className="text-xs">Copied!</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="mr-1" />{" "}
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <a
                  href={uploadedFile.downloadUrl}
                  className="inline-block px-4 py-2 border border-[#ff7a32] text-[#ff7a32] hover:bg-[#fff8f3] text-center rounded-md transition-colors"
                >
                  Download Crate
                </a>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Give this link to an agent or teammate.
              <br />
              <span className="text-xs text-amber-600">
                Download link expires in 24 hours.
              </span>
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
            Upload a Crate
          </h2>

          <div className="mb-4 bg-blue-50 p-4 rounded-md text-blue-700 text-sm">
            <p>
              <strong>Simple Crate Sharing</strong>
            </p>
            <p className="mt-2">
              Upload a single crate (up to 10MB) to quickly share with others.
              Your crate will be automatically categorized based on its type,
              but you can also manually select a different category if needed.
              Your crate will be accessible via a simple link.
            </p>
          </div>

          <div
            {...getRootProps({
              className: `border-2 border-dashed ${isDragActive ? "border-primary-400 bg-beige-100" : "border-gray-300"} rounded-lg p-8 text-center cursor-pointer hover:bg-beige-50 transition-colors mb-4`,
              role: "button",
              "aria-label":
                "Upload area. Drag and drop crates here or click to browse",
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
                    Drag & drop a crate here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum crate size: 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {file && (
            <div className="bg-white p-3 rounded-md mb-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <FaFile className="text-primary-400 mr-3" />
                <div className="overflow-hidden flex-1">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatBytes(file.size)} •{" "}
                    {file.type || "application/octet-stream"}
                    {shouldUseFirestore(file) && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Text file
                      </span>
                    )}
                  </p>
                </div>
                <div className="ml-4 mr-2">
                  <label
                    htmlFor="category"
                    className="text-xs text-gray-500 mb-1 block"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    className="text-sm border border-gray-300 rounded-md py-1 px-2 bg-white focus:ring-2 focus:ring-[#ff7a32] focus:border-[#ff7a32] min-w-[120px]"
                    value={fileType}
                    onChange={(e) =>
                      setFileType(e.target.value as CrateCategory)
                    }
                    disabled={isUploading}
                    aria-label="Select crate category"
                  >
                    {CRATE_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => setFile(null)}
                  aria-label="Remove crate"
                  disabled={isUploading}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          )}

          {file && (
            <>
              {/* Title Field */}
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
                  placeholder="Enter a title for your file"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a32] sm:text-sm"
                  required
                  disabled={isUploading}
                  autoComplete="off"
                  name="crate-title"
                />
              </div>

              {/* Description Field */}
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
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a32] sm:text-sm"
                  rows={3}
                  disabled={isUploading}
                />
              </div>

              {/* Tags Field */}
              <div className="mb-4">
                <label
                  htmlFor="fileTags"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tags (optional)
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow">
                    <TagInput
                      tags={tags}
                      onChange={setTags}
                      disabled={isUploading}
                      placeholder="Add tags (e.g., project:work, status:active)"
                      suggestions={[
                        "project:work",
                        "project:personal",
                        "status:active",
                        "status:review",
                        "status:archived",
                        "priority:high",
                        "priority:medium",
                        "priority:low",
                      ]}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={!file || isUploading || !title.trim()}
            className={`w-full py-2 px-4 rounded-md shadow-sm flex items-center justify-center border font-medium transition-colors ${
              !file || isUploading || !title.trim()
                ? "bg-gray-300 cursor-not-allowed text-gray-500 border-gray-300"
                : "bg-[#ff7a32] hover:bg-[#e96d2d] text-white border-[#ff7a32]" // Changed to brand orange
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
            Your crates are stored until you delete them. Download links expire
            after 24 hours.
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            By uploading a crate, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </form>
      )}
    </div>
  );
}
