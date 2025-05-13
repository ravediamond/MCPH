"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaFileDownload, FaFile, FaClock, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

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

    // Fetch file metadata when component mounts
    useEffect(() => {
        async function fetchFileMetadata() {
            try {
                const response = await fetch(`/api/files/${fileId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('File not found or has expired');
                    } else {
                        throw new Error('Failed to fetch file information');
                    }
                }

                const data = await response.json();
                setFileInfo(data);
            } catch (err: any) {
                console.error('Error fetching file metadata:', err);
                setError(err.message || 'An error occurred while retrieving the file');
            } finally {
                setLoading(false);
            }
        }

        if (fileId) {
            fetchFileMetadata();
        }
    }, [fileId]);

    // Format bytes to human-readable size
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format date to human-readable
    const formatDate = (dateString: string | number): string => {
        const date = typeof dateString === 'string' ? new Date(dateString) : new Date(dateString);
        return date.toLocaleString();
    };

    // Handle file download
    const handleDownload = () => {
        if (!fileInfo) return;

        // Redirect to the actual file endpoint
        window.location.href = `/api/uploads/${fileId}`;
    };

    // Handle direct download link copy
    const handleCopyDirectLink = () => {
        const downloadUrl = `${window.location.origin}/api/uploads/${fileId}`;
        navigator.clipboard.writeText(downloadUrl)
            .then(() => {
                alert('Direct download link copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
            });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-beige-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                        <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <p className="text-gray-500 mt-4">Loading file information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-beige-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="flex flex-col items-center">
                        <FaExclamationTriangle className="text-red-500 text-5xl mb-4" />
                        <h1 className="text-2xl font-bold text-red-500 mb-4">File Unavailable</h1>
                        <p className="text-gray-700 mb-6">{error}</p>
                        <p className="text-gray-500">The file may have expired or been removed.</p>
                        <Link
                            href="/"
                            className="mt-8 px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!fileInfo) {
        return (
            <div className="min-h-screen bg-beige-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="flex flex-col items-center">
                        <FaExclamationTriangle className="text-yellow-500 text-5xl mb-4" />
                        <h1 className="text-2xl font-bold text-gray-700 mb-4">File Information Not Available</h1>
                        <p className="text-gray-500">Unable to retrieve file information.</p>
                        <Link
                            href="/"
                            className="mt-8 px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Download File</h1>
                    <p className="text-gray-500">Secure file sharing with automatic expiration</p>
                </div>

                <div className="bg-beige-50 rounded-lg p-6 mb-8 flex items-start">
                    <div className="flex-shrink-0 mr-5">
                        <div className="p-4 bg-primary-100 rounded-lg">
                            <FaFile className="text-primary-500 text-3xl" />
                        </div>
                    </div>

                    <div className="flex-grow">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">{fileInfo.fileName}</h2>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <span className="font-medium">Type:</span>
                                <span className="ml-1">{fileInfo.contentType}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium">Size:</span>
                                <span className="ml-1">{formatBytes(fileInfo.size)}</span>
                            </div>
                            <div className="flex items-center">
                                <FaCalendarAlt className="mr-1 text-gray-500" />
                                <span className="font-medium">Uploaded:</span>
                                <span className="ml-1">{formatDate(fileInfo.uploadedAt)}</span>
                            </div>
                            {fileInfo.expiresAt && (
                                <div className="flex items-center">
                                    <FaClock className="mr-1 text-gray-500" />
                                    <span className="font-medium">Expires:</span>
                                    <span className="ml-1">{formatDate(fileInfo.expiresAt)}</span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <span className="font-medium">Downloads:</span>
                                <span className="ml-1">{fileInfo.downloadCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                    >
                        <FaFileDownload className="mr-2" />
                        Download File
                    </button>
                    <button
                        onClick={handleCopyDirectLink}
                        className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Copy Direct Link
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                        This file is securely stored and available for a limited time.
                        {fileInfo.expiresAt && (
                            <> It will expire on {formatDate(fileInfo.expiresAt)}.</>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}