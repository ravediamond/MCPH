'use client';

import React, { useEffect, useState } from 'react';
import { FileMetadata } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import {
    FaFileAlt, FaDownload, FaShareAlt, FaTrash, FaSearch,
    FaClock, FaCalendarAlt, FaLock, FaUpload, FaImage,
    FaCheck, FaTimesCircle, FaEye
} from 'react-icons/fa';
import Card from '../../components/ui/Card';

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
        const link = `${window.location.origin}/artifact/${fileId}`;
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
                className="h-full w-full object-cover rounded"
                onError={(e) => {
                    e.currentTarget.src = '/icon.png';
                }}
            />;
        }
        return <FaFileAlt className="text-gray-500 text-4xl" />;
    };

    const getFilePreviewBackground = (contentType: string) => {
        if (contentType.includes('image')) {
            return 'bg-gradient-to-r from-blue-50 to-indigo-50';
        } else if (contentType.includes('pdf')) {
            return 'bg-gradient-to-r from-red-50 to-pink-50';
        } else if (contentType.includes('text') || contentType.includes('markdown') || contentType.includes('json')) {
            return 'bg-gradient-to-r from-gray-50 to-slate-50';
        } else {
            return 'bg-gradient-to-r from-gray-50 to-gray-100';
        }
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
                <Card className="max-w-md w-full p-8 text-center">
                    <FaLock className="text-primary-500 text-3xl mx-auto mb-4" />
                    <h1 className="text-2xl font-medium mb-2">My Files</h1>
                    <p className="text-gray-600 mb-6">Sign in to access your files</p>
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Sign in with Google
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
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

                {/* File Grid */}
                <div>
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <Card className="p-8 text-center">
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
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredFiles.map((file) => (
                                <Card 
                                    key={file.id} 
                                    hoverable
                                    className={`${file.isExpiringSoon ? 'ring-2 ring-amber-300' : ''}`}
                                >
                                    <div className="relative">
                                        <Link href={`/artifact/${file.id}`} className="block absolute inset-0 z-10">
                                            <span className="sr-only">View {file.title || file.fileName}</span>
                                        </Link>

                                        <div className={`h-40 flex items-center justify-center ${getFilePreviewBackground(file.contentType)}`}>
                                            <div className="w-24 h-24 flex items-center justify-center">
                                                {getFileIcon(file)}
                                            </div>
                                        </div>
                                        
                                        <Card.Body className="p-4">
                                            <h3 className="font-medium text-gray-800 truncate" title={file.fileName}>
                                                {file.title || file.fileName}
                                            </h3>

                                            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                                <div className="flex items-center">
                                                    <FaCalendarAlt className="mr-1" />
                                                    <span>{formatDate(file.uploadedAt)}</span>
                                                </div>
                                                <span>{formatFileSize(file.size)}</span>
                                            </div>

                                            {file.isExpiringSoon && (
                                                <div className="mt-2 text-xs text-amber-600 flex items-center">
                                                    <FaClock className="mr-1" />
                                                    Expires in {file.daysTillExpiry} day{file.daysTillExpiry !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </div>

                                    <Card.Footer className="px-4 pb-3 flex justify-between relative z-20">
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <FaDownload className="mr-1" /> {file.downloadCount || 0}
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyShareLink(file.id);
                                                }}
                                                className="p-1 text-gray-500 hover:text-primary-500 relative z-20"
                                                title="Copy link"
                                            >
                                                <FaShareAlt />
                                            </button>
                                            <Link
                                                href={`/artifact/${file.id}`}
                                                className="p-1 text-gray-500 hover:text-primary-500 relative z-20"
                                                title="View details"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FaEye />
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFileToDelete(file.id);
                                                    setDeleteModalVisible(true);
                                                }}
                                                className="p-1 text-gray-500 hover:text-red-500 relative z-20"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </Card.Footer>
                                </Card>
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
                    <Card className="max-w-sm w-full p-6">
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
                    </Card>
                </div>
            )}
        </div>
    );
}
