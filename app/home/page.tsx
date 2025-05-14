'use client';

import React, { useEffect, useState } from 'react';
import { FileMetadata } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import {
    FaFileAlt, FaDownload, FaShareAlt, FaTrash, FaSearch,
    FaClock, FaCalendarAlt, FaLock, FaUpload, FaImage,
    FaCheck, FaTimesCircle
} from 'react-icons/fa';

interface FileMetadataExtended extends FileMetadata {
    isExpiringSoon?: boolean;
    daysTillExpiry?: number;
}

export default function HomePage() {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [files, setFiles] = useState<FileMetadataExtended[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const fetchFiles = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/user/${user.uid}/files`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch files');
                    }
                    const data = await response.json();

                    // Process files to add expiry metadata
                    const processedFiles = data.map((file: FileMetadataExtended) => {
                        const expiryDate = file.expiresAt ? new Date(file.expiresAt) : null;
                        const now = new Date();
                        const daysDiff = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;

                        return {
                            ...file,
                            isExpiringSoon: daysDiff <= 3 && daysDiff > 0,
                            daysTillExpiry: daysDiff
                        };
                    });

                    setFiles(processedFiles);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                } finally {
                    setLoading(false);
                }
            };

            fetchFiles();
        } else {
            setFiles([]);
            setLoading(false);
        }
    }, [user]);

    const handleDeleteFile = async (fileId: string) => {
        try {
            const response = await fetch(`/api/uploads/${fileId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            setFiles(files.filter(file => file.id !== fileId));
            setActionSuccess('File deleted');
            setTimeout(() => setActionSuccess(null), 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
        } finally {
            setDeleteModalVisible(false);
            setFileToDelete(null);
        }
    };

    // Filter files based on search query
    const filteredFiles = React.useMemo(() => {
        if (!searchQuery) return files;

        const query = searchQuery.toLowerCase();
        return files.filter(file =>
            file.fileName.toLowerCase().includes(query) ||
            (file.title && file.title.toLowerCase().includes(query))
        );
    }, [files, searchQuery]);

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Format date
    const formatDate = (date: string | number | Date): string => {
        return new Date(date).toLocaleDateString();
    };

    // Copy sharing link
    const copyShareLink = (fileId: string) => {
        const link = `${window.location.origin}/download/${fileId}`;
        navigator.clipboard.writeText(link)
            .then(() => {
                setActionSuccess('Link copied to clipboard');
                setTimeout(() => setActionSuccess(null), 2000);
            })
            .catch(() => {
                setError('Failed to copy link');
            });
    };

    // Get file icon or thumbnail
    const getFileIcon = (file: FileMetadataExtended) => {
        if (file.contentType.includes('image')) {
            return <img
                src={`/api/uploads/${file.id}?thumbnail=true`}
                alt={file.fileName}
                className="h-10 w-10 object-cover rounded"
                onError={(e) => {
                    e.currentTarget.src = '/icon.png';
                }}
            />;
        }
        return <FaFileAlt className="text-gray-500 text-xl" />;
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
                <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
                    <FaLock className="text-primary-500 text-3xl mx-auto mb-4" />
                    <h1 className="text-2xl font-medium mb-2">My Files</h1>
                    <p className="text-gray-600 mb-6">Sign in to access your files</p>
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-5xl mx-auto">
                {/* Header with search */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h1 className="text-2xl font-medium text-gray-800 mb-2 md:mb-0">My Files</h1>
                    <div className="flex items-center w-full md:w-auto">
                        <div className="relative mr-2 flex-grow">
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="py-2 px-4 pl-9 border border-gray-200 rounded w-full"
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        <Link
                            href="/upload"
                            className="bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 transition-colors flex items-center"
                        >
                            <FaUpload className="mr-1" /> Upload
                        </Link>
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

                {/* File list */}
                <div className="bg-white rounded shadow">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-2" />
                            <p className="text-gray-500">
                                {searchQuery ? 'No matching files found' : 'No files uploaded yet'}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/upload"
                                    className="inline-flex items-center mt-4 text-primary-500"
                                >
                                    <FaUpload className="mr-1" /> Upload your first file
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredFiles.map((file) => (
                                <div key={file.id} className={`p-4 ${file.isExpiringSoon ? 'bg-amber-50' : ''} hover:bg-gray-50`}>
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            {getFileIcon(file)}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between">
                                                <h3 className="font-medium text-gray-800 truncate" title={file.fileName}>
                                                    {file.title || file.fileName}
                                                </h3>
                                                <div className="text-xs text-gray-500 mt-1 sm:mt-0 flex items-center">
                                                    <span className="mr-3">{formatFileSize(file.size)}</span>
                                                    <span><FaDownload className="inline mr-1" /> {file.downloadCount}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between mt-1">
                                                <div className="text-xs text-gray-500">
                                                    <FaCalendarAlt className="inline mr-1" /> {formatDate(file.uploadedAt)}
                                                    {file.isExpiringSoon && (
                                                        <span className="ml-3 text-amber-600">
                                                            <FaClock className="inline mr-1" />
                                                            Expires in {file.daysTillExpiry} day{file.daysTillExpiry !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2 mt-2 sm:mt-0">
                                                    <Link
                                                        href={`/download/${file.id}`}
                                                        className="p-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200"
                                                        title="Download"
                                                    >
                                                        <FaDownload />
                                                    </Link>
                                                    <button
                                                        onClick={() => copyShareLink(file.id)}
                                                        className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                                        title="Copy link"
                                                    >
                                                        <FaShareAlt />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFileToDelete(file.id);
                                                            setDeleteModalVisible(true);
                                                        }}
                                                        className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Simple file stats */}
                {filteredFiles.length > 0 && (
                    <div className="mt-4 text-sm text-gray-500 flex justify-between">
                        <span>Total: {filteredFiles.length} files</span>
                        <span>{formatFileSize(filteredFiles.reduce((sum, file) => sum + file.size, 0))}</span>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded shadow-lg max-w-sm w-full p-6">
                        <h3 className="font-medium mb-4">Delete File?</h3>
                        <p className="text-gray-500 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setDeleteModalVisible(false);
                                    setFileToDelete(null);
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
