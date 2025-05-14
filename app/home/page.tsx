'use client';

import React, { useEffect, useState } from 'react';
import { FileMetadata } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import {
    FaFileAlt, FaDownload, FaShareAlt, FaTrash, FaFilter, FaSearch,
    FaThList, FaThLarge, FaClock, FaCalendarAlt, FaLock, FaUpload,
    FaExclamationTriangle, FaImage, FaFileVideo, FaFileAudio, FaFilePdf,
    FaCheck, FaTimes
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

    // UI state
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
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

                    // Process files to add extra metadata
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
                    console.error('Error fetching files:', err);
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

    // Create function to handle file deletion
    const handleDeleteFile = async (fileId: string) => {
        try {
            const response = await fetch(`/api/uploads/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            // Update files list after successful deletion
            setFiles(files.filter(file => file.id !== fileId));
            setActionSuccess('File successfully deleted');

            // Clear success message after 3 seconds
            setTimeout(() => setActionSuccess(null), 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
            console.error('Error deleting file:', err);
        } finally {
            setDeleteModalVisible(false);
            setFileToDelete(null);
        }
    };

    // Filter and sort files
    const filteredAndSortedFiles = React.useMemo(() => {
        // First filter by type if needed
        let result = [...files];

        if (filterType !== 'all') {
            result = result.filter(file => {
                const contentType = file.contentType.toLowerCase();
                switch (filterType) {
                    case 'images':
                        return contentType.includes('image');
                    case 'documents':
                        return contentType.includes('pdf') ||
                            contentType.includes('doc') ||
                            contentType.includes('text') ||
                            contentType.includes('sheet');
                    case 'videos':
                        return contentType.includes('video');
                    case 'audio':
                        return contentType.includes('audio');
                    case 'expiring-soon':
                        return file.isExpiringSoon;
                    default:
                        return true;
                }
            });
        }

        // Then filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(file =>
                file.fileName.toLowerCase().includes(query) ||
                (file.title && file.title.toLowerCase().includes(query)) ||
                (file.description && file.description.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
                case 'oldest':
                    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
                case 'name':
                    return a.fileName.localeCompare(b.fileName);
                case 'size':
                    return b.size - a.size;
                case 'downloads':
                    return b.downloadCount - a.downloadCount;
                default:
                    return 0;
            }
        });
    }, [files, filterType, searchQuery, sortBy]);

    // Get file icon based on content type
    const getFileIcon = (contentType: string) => {
        const type = contentType.toLowerCase();
        if (type.includes('image')) {
            return <FaImage className="text-blue-500" />;
        } else if (type.includes('video')) {
            return <FaFileVideo className="text-purple-500" />;
        } else if (type.includes('audio')) {
            return <FaFileAudio className="text-yellow-500" />;
        } else if (type.includes('pdf')) {
            return <FaFilePdf className="text-red-500" />;
        } else {
            return <FaFileAlt className="text-gray-500" />;
        }
    };

    // Format bytes to human-readable size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format date in a human-readable way
    const formatDate = (date: string | number | Date): string => {
        if (date instanceof Date) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Copy sharing link to clipboard
    const copyShareLink = (fileId: string, fileName: string) => {
        const link = `${window.location.origin}/download/${fileId}`;
        navigator.clipboard.writeText(link)
            .then(() => {
                setActionSuccess(`Link for "${fileName}" copied to clipboard`);
                setTimeout(() => setActionSuccess(null), 3000);
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
                setError('Failed to copy link to clipboard');
            });
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-beige-100 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse flex flex-col items-center justify-center p-12">
                        <div className="h-12 w-12 bg-primary-100 rounded-full mb-4"></div>
                        <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 w-40 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Not logged in state
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-beige-100 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-lg mx-auto text-center">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex justify-center mb-8">
                            <div className="bg-primary-100 p-5 rounded-full">
                                <FaLock className="text-primary-600 text-4xl" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold mb-4">My Files</h1>
                        <p className="text-gray-600 mb-8">
                            Sign in to access your uploaded files, track downloads, and manage your shared content.
                        </p>
                        <button
                            onClick={signInWithGoogle}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                            Sign in with Google
                        </button>
                    </div>

                    <div className="mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4">Why Create an Account?</h2>
                        <ul className="space-y-3 text-left">
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span>Track all your uploaded files in one place</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span>See download statistics for your shared files</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span>Delete files before their expiration period</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span>Extended file retention options</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Files</h1>
                        <p className="text-gray-600">Manage your uploaded files and track downloads</p>
                    </div>
                    <Link
                        href="/upload"
                        className="flex items-center justify-center px-5 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition duration-300 shadow-sm"
                    >
                        <FaUpload className="mr-2" /> Upload New File
                    </Link>
                </div>

                {/* Success message */}
                {actionSuccess && (
                    <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <div className="flex items-center">
                            <FaCheck className="mr-2" />
                            <span>{actionSuccess}</span>
                        </div>
                        <button onClick={() => setActionSuccess(null)} className="text-green-700">
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
                        <div className="flex items-center">
                            <FaExclamationTriangle className="mr-2" />
                            <span>Error: {error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-700">
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Search, filter and view controls */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center">
                            <FaFilter className="text-gray-500 mr-2" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                            >
                                <option value="all">All Files</option>
                                <option value="images">Images</option>
                                <option value="documents">Documents</option>
                                <option value="videos">Videos</option>
                                <option value="audio">Audio</option>
                                <option value="expiring-soon">Expiring Soon</option>
                            </select>
                        </div>

                        {/* Sort & View Options */}
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex-grow"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name</option>
                                <option value="size">Size</option>
                                <option value="downloads">Most Downloads</option>
                            </select>

                            <div className="flex border border-gray-200 rounded-md overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-white text-gray-500'}`}
                                    title="Grid view"
                                >
                                    <FaThLarge />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-white text-gray-500'}`}
                                    title="List view"
                                >
                                    <FaThList />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File display area */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-10 w-10 bg-primary-100 rounded-full mb-4"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                            <div className="h-3 w-24 bg-gray-100 rounded"></div>
                        </div>
                        <p className="text-gray-500 mt-4">Loading your files...</p>
                    </div>
                ) : filteredAndSortedFiles.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
                        {searchQuery || filterType !== 'all' ? (
                            <>
                                <div className="flex justify-center mb-4">
                                    <FaSearch className="text-gray-400 text-4xl" />
                                </div>
                                <h2 className="text-xl font-medium text-gray-700 mb-2">No matching files found</h2>
                                <p className="text-gray-500">Try adjusting your search or filters</p>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 bg-gray-100 rounded-full">
                                        <FaFileAlt className="text-gray-400 text-4xl" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-medium text-gray-700 mb-2">No files uploaded yet</h2>
                                <p className="text-gray-500 mb-6">Start uploading to see your files here</p>
                                <Link
                                    href="/upload"
                                    className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    <FaUpload className="mr-2" /> Upload Your First File
                                </Link>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAndSortedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`bg-white rounded-lg shadow-sm overflow-hidden border ${file.isExpiringSoon ? 'border-amber-300' : 'border-gray-200'}`}
                                    >
                                        {/* File preview/icon area */}
                                        <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100 p-4">
                                            {file.contentType.includes('image') ? (
                                                <img
                                                    src={`/api/uploads/${file.id}?thumbnail=true`}
                                                    alt={file.fileName}
                                                    className="max-h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.classList.add('hidden');
                                                        e.currentTarget.parentElement?.classList.add('flex');
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-4xl">
                                                    {getFileIcon(file.contentType)}
                                                </div>
                                            )}
                                        </div>

                                        {/* File info */}
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-800 mb-1 truncate" title={file.fileName}>
                                                {file.title || file.fileName}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate mb-3" title={file.fileName}>
                                                {file.fileName}
                                            </p>

                                            <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-500 mb-4">
                                                <div className="flex items-center">
                                                    <FaCalendarAlt className="mr-1" />
                                                    {formatDate(file.uploadedAt)}
                                                </div>
                                                <div className="flex items-center">
                                                    <FaDownload className="mr-1" />
                                                    {file.downloadCount} downloads
                                                </div>
                                            </div>

                                            {file.isExpiringSoon && (
                                                <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-md text-xs mb-4 flex items-center">
                                                    <FaClock className="mr-1" />
                                                    Expires in {file.daysTillExpiry} day{file.daysTillExpiry !== 1 ? 's' : ''}
                                                </div>
                                            )}

                                            {/* Action buttons */}
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/download/${file.id}`}
                                                    className="flex-1 px-3 py-1.5 bg-primary-100 text-primary-600 rounded text-sm font-medium hover:bg-primary-200 transition-colors text-center flex items-center justify-center"
                                                >
                                                    <FaDownload className="mr-1" /> Download
                                                </Link>
                                                <button
                                                    onClick={() => copyShareLink(file.id, file.fileName)}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-colors"
                                                    title="Copy share link"
                                                >
                                                    <FaShareAlt />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setFileToDelete(file.id);
                                                        setDeleteModalVisible(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-red-50 text-red-500 rounded text-sm hover:bg-red-100 transition-colors"
                                                    title="Delete file"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 text-gray-500 text-sm">
                                        <tr>
                                            <th className="py-3 px-4 text-left">File</th>
                                            <th className="py-3 px-4 text-left">Uploaded</th>
                                            <th className="py-3 px-4 text-left">Size</th>
                                            <th className="py-3 px-4 text-left">Downloads</th>
                                            <th className="py-3 px-4 text-left">Expires</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedFiles.map((file) => (
                                            <tr
                                                key={file.id}
                                                className={`border-b hover:bg-gray-50 ${file.isExpiringSoon ? 'bg-amber-50' : ''}`}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <div className="mr-3 text-lg">
                                                            {getFileIcon(file.contentType)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-800 truncate max-w-xs" title={file.fileName}>
                                                                {file.title || file.fileName}
                                                            </div>
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                {file.fileName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    {formatDate(file.uploadedAt)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    {file.downloadCount}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {file.expiresAt ? (
                                                        <div className={`text-sm flex items-center ${file.isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                                                            {file.isExpiringSoon && <FaClock className="mr-1" />}
                                                            {formatDate(file.expiresAt)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link
                                                            href={`/download/${file.id}`}
                                                            className="p-1.5 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition-colors"
                                                            title="Download"
                                                        >
                                                            <FaDownload />
                                                        </Link>
                                                        <button
                                                            onClick={() => copyShareLink(file.id, file.fileName)}
                                                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                                            title="Copy share link"
                                                        >
                                                            <FaShareAlt />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setFileToDelete(file.id);
                                                                setDeleteModalVisible(true);
                                                            }}
                                                            className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"
                                                            title="Delete file"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Stats summary */}
                {filteredAndSortedFiles.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-gray-500 text-sm mb-1">Total Files</div>
                            <div className="text-2xl font-bold">{filteredAndSortedFiles.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-gray-500 text-sm mb-1">Total Downloads</div>
                            <div className="text-2xl font-bold">
                                {filteredAndSortedFiles.reduce((sum, file) => sum + (file.downloadCount || 0), 0)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-gray-500 text-sm mb-1">Storage Used</div>
                            <div className="text-2xl font-bold">
                                {formatFileSize(filteredAndSortedFiles.reduce((sum, file) => sum + file.size, 0))}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="text-gray-500 text-sm mb-1">Expiring Soon</div>
                            <div className="text-2xl font-bold">
                                {filteredAndSortedFiles.filter(file => file.isExpiringSoon).length}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete this file? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setDeleteModalVisible(false);
                                    setFileToDelete(null);
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
