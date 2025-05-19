"use client";

import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";

interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string | number;
  expiresAt?: string | number;
  downloadCount: number;
}

export default function DownloadPage() {
  const params = useParams();
  const fileId = params?.id as string;

  const [fileInfo, setFileInfo] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    async function fetchFileMetadata() {
      try {
        const response = await fetch(`/api/files/${fileId}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "File not found or has expired"
              : "Failed to fetch file information",
          );
        }

        const data = await response.json();
        setFileInfo(data);

        if (data.expiresAt) {
          updateTimeRemaining(data.expiresAt);
          const timer = setInterval(
            () => updateTimeRemaining(data.expiresAt),
            60000,
          );
          return () => clearInterval(timer);
        }
      } catch (err: any) {
        console.error("Error fetching file metadata:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (fileId) {
      fetchFileMetadata();
    }
  }, [fileId]);

  // Simplified time remaining calculation
  const updateTimeRemaining = (expiresAt: string | number) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) {
      setTimeRemaining("Expired");
      setError("This file has expired");
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
  const formatDate = (dateString: string | number): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = () => {
    if (!fileInfo) return;
    setDownloadStarted(true);
    setFileInfo((prev) =>
      prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev,
    );
    window.location.href = `/api/uploads/${fileId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/download/${fileId}`)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-primary-100 rounded-full mb-4"></div>
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          </div>
          <p className="text-gray-500">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <FaExclamationTriangle className="text-yellow-500 text-3xl mx-auto mb-4" />
          <h1 className="text-xl font-medium text-gray-800 mb-2">
            File Unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Unable to retrieve file information"}
          </p>

          <div className="flex justify-center space-x-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/upload"
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            >
              <FaUpload className="inline mr-1" /> Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow">
        <div className="bg-primary-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <h1 className="font-medium">Download File</h1>
            {timeRemaining && (
              <div className="flex items-center text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                <FaClock className="mr-1" /> Expires in {timeRemaining}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h2
              className="font-medium text-gray-800 mb-1 truncate"
              title={fileInfo.fileName}
            >
              {fileInfo.fileName}
            </h2>
            <div className="text-xs text-gray-500">
              {formatBytes(fileInfo.size)} • {fileInfo.downloadCount} downloads
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={handleDownload}
              className="col-span-3 flex items-center justify-center px-3 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            >
              {downloadStarted ? (
                <>
                  <FaCheck className="mr-1" /> Downloaded
                </>
              ) : (
                <>
                  <FaFileDownload className="mr-1" /> Download
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              title="Copy link"
            >
              {linkCopied ? <FaCheck /> : <FaShareAlt />}
            </button>
          </div>

          <div className="text-xs text-gray-500 flex items-center justify-between">
            <div>
              <FaCalendarAlt className="inline mr-1" />
              Uploaded: {formatDate(fileInfo.uploadedAt)}
            </div>
            {fileInfo.expiresAt && (
              <div>
                <FaClock className="inline mr-1" />
                Expires: {formatDate(fileInfo.expiresAt)}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-3 border-t border-gray-100 text-center">
          <Link
            href="/upload"
            className="text-sm text-primary-500 hover:text-primary-600"
          >
            <FaUpload className="inline mr-1" /> Upload your own file
          </Link>
        </div>
      </div>
    </div>
  );
}
