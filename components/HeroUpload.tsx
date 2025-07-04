"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaFile,
  FaSpinner,
  FaCheckCircle,
  FaCopy,
  FaExternalLinkAlt,
  FaArrowRight,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useAnonymousUploadTransition } from "../contexts/useAnonymousUploadTransition";
import { useUploadService } from "../hooks/useUploadService";
import { CrateCategory } from "../shared/types/crate";
import Link from "next/link";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for all uploads

export default function HeroUpload() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [crateId, setCrateId] = useState<string>("");

  // Auth context and services
  const { user } = useAuth();
  const { storeTempCrateId } = useAnonymousUploadTransition();
  const { uploadCrate } = useUploadService();

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
    handleUpload(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  // Handle upload using the shared upload service
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Simple upload with minimal options - title defaults to filename
      const result = await uploadCrate(file);

      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);

      if (result.success) {
        setUploadedUrl(result.url);
        setCrateId(result.id);

        // Store the temporary crate ID for potential migration when user logs in
        if (!user) {
          storeTempCrateId(result.id);

          // Anonymous user success message
          toast.success(
            "Link generated! Anonymous uploads auto-delete after 7 days. Sign in to keep your crates permanently and access more features →",
            {
              duration: 5000,
              icon: "🔗",
              style: {
                borderRadius: "10px",
                background: "#fef6ee",
                border: "1px solid #ffedd5",
                color: "#c2410c",
              },
            },
          );
        } else {
          // Authenticated user success message
          toast.success(
            "Link generated! Download link expires in 24 hours. Crate available for 7 days. View all your uploads in your dashboard.",
            {
              duration: 4000,
              icon: "✓",
              style: {
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #dcfce7",
                color: "#166534",
              },
            },
          );
        }

        // Auto-copy the URL to clipboard
        navigator.clipboard
          .writeText(result.url)
          .then(() => {
            setUrlCopied(true);
            toast.success("Link copied to clipboard!");

            // Reset copy status after 3 seconds
            setTimeout(() => setUrlCopied(false), 3000);
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
          });
      } else {
        throw new Error(result.error || "Sorry, we couldn't upload your file");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Sorry, we couldn't upload your file. Please try again.");
      setIsUploading(false);
    }
  };

  // Handle manual text paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text.trim()) {
      // Create a file from the pasted text
      const textFile = new File([text], "pasted-text.md", {
        type: "text/markdown",
      });
      setFile(textFile);
      handleUpload(textFile);
    }
  };

  // Handle copy URL to clipboard
  const handleCopyUrl = () => {
    if (!uploadedUrl) return;

    navigator.clipboard
      .writeText(uploadedUrl)
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

  // Email functionality
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleEmailShare = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // In a real implementation, this would send an email via API
    toast.success(`Link sent to ${emailInput}!`);
    setShowEmailInput(false);
    setEmailInput("");
  };

  return (
    <div className="w-full">
      {!uploadedUrl ? (
        <div className="w-full opacity-100 transition-opacity duration-300">
          <div
            {...getRootProps({
              className: `flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${
                isDragActive
                  ? "border-orange-400 ring-4 ring-orange-300/40 bg-orange-100/60"
                  : "border-orange-300/60 bg-orange-50/40 hover:bg-orange-100/60"
              } transition-colors p-10 sm:p-16 h-[280px] w-full text-center cursor-pointer relative`,
            })}
            onPaste={handlePaste}
            tabIndex={0}
            role="button"
            aria-label="Drop crates here or click to upload"
          >
            <input {...getInputProps()} />

            {isUploading ? (
              <div className="space-y-6">
                <FaSpinner className="mx-auto text-orange-500 text-4xl md:text-5xl animate-spin" />
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 mt-3 font-medium">
                    Uploading: {uploadProgress}%
                  </p>
                  {file && (
                    <p className="text-sm text-gray-600 mt-1 truncate max-w-full">
                      {file.name} (crate)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto text-orange-400 w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                  <path d="M12 12v9"></path>
                  <path d="m16 16-4-4-4 4"></path>
                </svg>

                {isDragActive ? (
                  <p className="text-orange-500 text-lg md:text-xl font-medium">
                    Drop your crate here...
                  </p>
                ) : (
                  <>
                    <div>
                      <p className="text-gray-800 text-xl md:text-2xl font-medium mb-2">
                        DROP CRATE HERE
                      </p>
                      <p className="text-gray-700 text-base md:text-lg">
                        or paste Markdown / JSON
                      </p>

                      {/* Info tooltip in the top-right corner */}
                      <div className="absolute top-3 right-3">
                        <div className="relative group">
                          {" "}
                          <span className="cursor-help text-gray-400 hover:text-gray-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                              />
                            </svg>
                          </span>
                          <div className="absolute z-10 bottom-full right-0 mb-2 w-60 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <p className="mb-1">• 10 MB max file size</p>
                            <p className="mb-1">
                              • Download links expire in 24 hours
                            </p>
                            <p>
                              • Files auto-delete after 7 days (guest uploads)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200 relative overflow-hidden opacity-100 transition-opacity duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-500"></div>

          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h3 className="text-lg md:text-xl font-semibold text-green-600 flex items-center">
              <FaCheckCircle className="mr-2" /> Link Generated!
            </h3>
            <button
              onClick={() => {
                setUploadedUrl("");
                setFile(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-1 transition-colors duration-200"
              aria-label="Start over"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 md:space-y-5">
            {file && (
              <div className="flex items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                <FaFile className="text-orange-500 mr-2 md:mr-3 flex-shrink-0" />
                <p className="font-medium truncate text-sm md:text-base">
                  {file.name}
                </p>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={uploadedUrl}
                readOnly
                className="w-full py-2 md:py-3 px-3 md:px-4 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 pr-20 md:pr-24 font-medium text-gray-700 text-sm md:text-base"
                aria-label="Generated share link"
              />
              <div className="absolute right-1.5 top-1.5 flex">
                <button
                  onClick={handleCopyUrl}
                  className={`${
                    urlCopied
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } p-1.5 md:p-2 rounded-md mr-1 md:mr-1.5 transition-colors duration-200 text-sm`}
                  aria-label="Copy link to clipboard"
                >
                  {urlCopied ? (
                    <span className="text-xs md:text-sm">Copied!</span>
                  ) : (
                    <FaCopy />
                  )}
                </button>
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-100 hover:bg-orange-200 p-1.5 md:p-2 rounded-md text-orange-600 transition-colors duration-200"
                  aria-label="Open link in new tab"
                >
                  <FaExternalLinkAlt />
                </a>
              </div>
            </div>

            {/* Email link option */}
            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center mx-auto mt-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {showEmailInput ? "Cancel" : "Email me this link"}
            </button>

            {showEmailInput && (
              <form onSubmit={handleEmailShare} className="mt-3 flex">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-l-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-lg text-sm"
                >
                  Send
                </button>
              </form>
            )}

            <div className="text-center mt-3 md:mt-4 p-2 md:p-3 bg-blue-50 rounded-lg">
              {!user ? (
                <p className="text-xs md:text-sm text-blue-700">
                  Download link expires in 24 hours.{" "}
                  {user
                    ? "Your crates are stored until you delete them."
                    : "Crate auto-deletes after 7 days."}{" "}
                  <a href="/login" className="font-medium underline">
                    Create an account
                  </a>{" "}
                  to manage your uploads.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-blue-700">
                    Download link expires in 24 hours. Your crates are stored
                    until you delete them. Need more options? Use the advanced
                    uploader.
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center text-xs md:text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Advanced Options <FaArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
