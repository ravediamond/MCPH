'use client';

import React, { useEffect, useState } from 'react';
import { FileMetadata } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import {
    FaFileAlt, FaDownload, FaShareAlt, FaTrash, FaSearch,
    FaClock, FaCalendarAlt, FaLock, FaUpload,
    FaCheck, FaTimesCircle, FaEye, FaExclamationCircle,
    FaFileImage, FaFilePdf, FaFileCode, FaProjectDiagram
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

    // Render metadata key-value pairs
    const renderMetadata = (metadata?: Record<string, string>) => {
        if (!metadata || Object.keys(metadata).length === 0) return null;
        return (
            <div className="mt-2 text-xs text-gray-600">
                <div className="font-semibold mb-1">Metadata:</div>
                <ul className="list-disc ml-4">
                    {Object.entries(metadata).map(([key, value]) => (
                        <li key={key}><span className="font-medium">{key}:</span> {value}</li>
                    ))}
                </ul>
            </div>
        );
    };

    // Get file type icon with proper styling
    const getFileIcon = (file: FileMetadataExtended) => {
        const contentType = file.contentType.toLowerCase();
        const fileName = file.fileName.toLowerCase();

        if (contentType.includes('image')) {
            return <FaFileImage size={18} className="text-blue-500" />;
        } else if (contentType.includes('pdf')) {
            return <FaFilePdf size={18} className="text-red-500" />;
        } else if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('typescript')) {
            return <FaFileCode size={18} className="text-yellow-600" />;
        } else if ((contentType.includes('text') && fileName.includes('mermaid')) || fileName.endsWith('.mmd')) {
            return <FaProjectDiagram size={18} className="text-green-500" />;
        } else if (contentType.includes('text') || contentType.includes('markdown')) {
            return <FaFileAlt size={18} className="text-purple-500" />;
        } else {
            return <FaFileAlt size={18} className="text-gray-500" />;
        }
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredFiles.map((file) => (
                                <Card
                                    key={file.id}
                                    hoverable
                                    className="transition-all overflow-hidden"
                                >
                                    <div className="p-3">
                                        <div className="flex items-start space-x-3">
                                            {/* File Type Icon */}
                                            <div className="mt-0.5">
                                                {getFileIcon(file)}
                                            </div>

                                            {/* File Info */}
                                            <div className="flex-grow min-w-0">
                                                <Link
                                                    href={`/artifact/${file.id}`}
                                                    className="block"
                                                >
                                                    <h3
                                                        className="font-medium text-sm text-gray-800 hover:text-primary-600 transition-colors truncate"
                                                        title={file.fileName}
                                                    >
                                                        {file.title || file.fileName}
                                                    </h3>
                                                </Link>

                                                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                                    <div className="truncate mr-2">{formatFileSize(file.size)}</div>
                                                    <div className="flex items-center whitespace-nowrap">
                                                        <FaDownload className="mr-1" size={10} /> {file.downloadCount || 0}
                                                    </div>
                                                </div>
                                                {/* Metadata display */}
                                                {renderMetadata(file.metadata)}
                                            </div>

                                            {/* Expiry Indicator - Small Circle */}
                                            {file.isExpiringSoon && (
                                                <div
                                                    className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 mt-1"
                                                    title={`Expires in ${file.daysTillExpiry} day${file.daysTillExpiry !== 1 ? 's' : ''}`}
                                                ></div>
                                            )}
                                        </div>

                                        {/* Action Buttons - Smaller and more compact */}
                                        <div className="flex justify-end mt-2 space-x-1">
                                            <button
                                                onClick={() => copyShareLink(file.id)}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                title="Copy link"
                                            >
                                                <FaShareAlt size={12} />
                                            </button>

                                            <Link
                                                href={`/artifact/${file.id}`}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                title="View details"
                                            >
                                                <FaEye size={12} />
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setFileToDelete(file.id);
                                                    setDeleteModalVisible(true);
                                                }}
                                                className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-500"
                                                title="Delete"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
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
                        <div className="text-center mb-4">
                            <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" />
                            <h3 className="font-medium text-lg">Delete File?</h3>
                            <p className="text-gray-500 mt-2">This action cannot be undone.</p>
                        </div>
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
