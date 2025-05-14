"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    FaFileDownload, FaFile, FaClock, FaCalendarAlt, FaExclamationTriangle,
    FaCheck, FaShareAlt, FaUpload, FaShieldAlt, FaTimes
} from 'react-icons/fa';

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

    // Determine time remaining before expiration
    const [timeRemaining, setTimeRemaining] = useState<string>('');

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

                // Calculate time remaining for expiration
                if (data.expiresAt) {
                    updateTimeRemaining(data.expiresAt);
                    // Update time remaining every minute
                    const timer = setInterval(() => {
                        updateTimeRemaining(data.expiresAt);
                    }, 60000);
                    return () => clearInterval(timer);
                }
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

    // Calculate and update time remaining
    const updateTimeRemaining = (expiresAt: string | number) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry.getTime() - now.getTime();

        if (diffMs <= 0) {
            setTimeRemaining('Expired');
            setError('This file has expired and is no longer available');
            return;
        }

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffDays > 0) {
            setTimeRemaining(`${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`);
        } else if (diffHours > 0) {
            setTimeRemaining(`${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`);
        } else {
            setTimeRemaining(`${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`);
        }
    };

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

    // Get file type icon based on content type
    const getFileIcon = () => {
        if (!fileInfo) return <FaFile className="text-primary-500 text-3xl" />;

        const contentType = fileInfo.contentType.toLowerCase();
        if (contentType.includes('image')) {
            return <img
                src={`/api/uploads/${fileId}?thumbnail=true`}
                alt={fileInfo.fileName}
                className="h-16 w-16 object-cover rounded"
                onError={(e) => {
                    e.currentTarget.src = '/icon.png';
                    e.currentTarget.className = 'h-16 w-16 p-3 object-contain';
                }}
            />;
        } else if (contentType.includes('pdf')) {
            return <FaFile className="text-red-500 text-3xl" />;
        } else if (contentType.includes('word') || contentType.includes('document')) {
            return <FaFile className="text-blue-500 text-3xl" />;
        } else if (contentType.includes('excel') || contentType.includes('spreadsheet')) {
            return <FaFile className="text-green-500 text-3xl" />;
        } else if (contentType.includes('video')) {
            return <FaFile className="text-purple-500 text-3xl" />;
        } else if (contentType.includes('audio')) {
            return <FaFile className="text-yellow-500 text-3xl" />;
        } else {
            return <FaFile className="text-primary-500 text-3xl" />;
        }
    };

    // Handle file download
    const handleDownload = () => {
        if (!fileInfo) return;
        setDownloadStarted(true);

        // Increment download count visually for immediate feedback
        setFileInfo(prev => {
            if (prev) {
                return { ...prev, downloadCount: prev.downloadCount + 1 };
            }
            return prev;
        });

        // Redirect to the actual file endpoint
        window.location.href = `/api/uploads/${fileId}`;
    };

    // Handle direct download link copy
    const handleCopyDirectLink = () => {
        const downloadUrl = `${window.location.origin}/api/uploads/${fileId}`;
        navigator.clipboard.writeText(downloadUrl)
            .then(() => {
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
            });
    };

    // Handle share
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/download/${fileId}`;
        const shareTitle = fileInfo ? `Download: ${fileInfo.fileName}` : 'Download file from MCPH';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    url: shareUrl
                });
            } catch (err) {
                console.error('Error sharing:', err);
                // Fallback to copy link if sharing fails
                handleCopyDirectLink();
            }
        } else {
            // Fallback to copy link if Web Share API is not available
            handleCopyDirectLink();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-beige-100 to-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-16 w-16 bg-primary-100 rounded-full mb-4 flex items-center justify-center">
                            <FaFileDownload className="text-primary-200 text-2xl" />
                        </div>
                        <div className="h-7 w-64 bg-gray-200 rounded-md mb-4"></div>
                        <div className="h-4 w-48 bg-gray-100 rounded-md mb-8"></div>
                        <div className="h-12 w-48 bg-primary-100 rounded-md mb-2"></div>
                    </div>
                    <p className="text-gray-500 mt-4 animate-pulse">Preparing your download...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-beige-100 to-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="bg-red-100 p-5 rounded-full mb-6">
                            <FaExclamationTriangle className="text-red-500 text-4xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">File Unavailable</h1>
                        <p className="text-gray-700 mb-6 max-w-md mx-auto">{error}</p>
                        <p className="text-gray-500 mb-8">The file may have expired or been removed.</p>

                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                            <Link
                                href="/"
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                            >
                                Return to Home
                            </Link>
                            <Link
                                href="/upload"
                                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
                            >
                                <FaUpload className="mr-2" /> Upload a New File
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!fileInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-beige-100 to-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="bg-yellow-100 p-5 rounded-full mb-6">
                            <FaExclamationTriangle className="text-yellow-500 text-4xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">File Information Not Available</h1>
                        <p className="text-gray-600 mb-8">Unable to retrieve file information. Please check the link and try again.</p>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-beige-100 to-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Ready to Download</h1>
                        {timeRemaining && (
                            <div className="flex items-center text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                <FaClock className="mr-2" />
                                <span>Expires in {timeRemaining}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {/* File information card */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-4 border border-gray-100">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            {getFileIcon()}
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">{fileInfo.fileName}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                    <span className="font-medium">Type:</span>
                                    <span className="ml-1 text-gray-500">{fileInfo.contentType.split('/').pop()}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-medium">Size:</span>
                                    <span className="ml-1 text-gray-500">{formatBytes(fileInfo.size)}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-medium">Downloads:</span>
                                    <span className="ml-1 text-gray-500">{fileInfo.downloadCount}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <FaCalendarAlt className="mr-1" />
                                    <span>Uploaded: {formatDate(fileInfo.uploadedAt)}</span>
                                </div>
                                {fileInfo.expiresAt && (
                                    <div className="flex items-center">
                                        <FaClock className="mr-1" />
                                        <span>Expires: {formatDate(fileInfo.expiresAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors col-span-1 sm:col-span-2"
                        >
                            {downloadStarted ? (
                                <>
                                    <FaCheck className="mr-2" />
                                    Download Started
                                </>
                            ) : (
                                <>
                                    <FaFileDownload className="mr-2" />
                                    Download File
                                </>
                            )}
                        </button>

                        <div className="grid grid-cols-2 gap-3 col-span-1">
                            <button
                                onClick={handleCopyDirectLink}
                                className="flex items-center justify-center p-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                title="Copy direct download link"
                            >
                                {linkCopied ? <FaCheck className="text-green-500" /> : <FaFileDownload />}
                            </button>

                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center p-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                title="Share this file"
                            >
                                <FaShareAlt />
                            </button>
                        </div>
                    </div>

                    {/* Upload your own file CTA */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="mb-4 text-gray-600">Need to share your own files?</p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center justify-center px-6 py-2 bg-primary-500 bg-opacity-10 text-primary-600 rounded-lg hover:bg-opacity-20 transition-colors"
                        >
                            <FaUpload className="mr-2" /> Upload a File
                        </Link>
                    </div>
                </div>

                {/* Footer security message */}
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                        <FaShieldAlt className="inline-block mr-1" />
                        This file is securely stored and will automatically expire on {formatDate(fileInfo.expiresAt || '')}
                    </p>
                </div>
            </div>
        </div>
    );
}