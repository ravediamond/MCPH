'use client';

import React, { useEffect, useState } from 'react';
import { FileMetadata } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

const HomePage = () => {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    setFiles(data);
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

    if (authLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p>Loading authentication...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Welcome to MCPHub</h1>
                <p className="mb-6">Please log in to see your uploaded files.</p>
                <button
                    onClick={signInWithGoogle}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign in with Google
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Your Uploaded Files</h1>
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Upload New File
                </Link>
            </div>

            {loading ? (
                <p>Loading your files...</p>
            ) : error ? (
                <p className="text-red-500">Error: {error}</p>
            ) : files.length === 0 ? (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <p>You haven't uploaded any files yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left">File Name</th>
                                <th className="py-3 px-4 text-left">Uploaded At</th>
                                <th className="py-3 px-4 text-left">Size</th>
                                <th className="py-3 px-4 text-left">Downloads</th>
                                <th className="py-3 px-4 text-left">Content Type</th>
                                <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{file.fileName}</td>
                                    <td className="py-3 px-4">{new Date(file.uploadedAt).toLocaleString()}</td>
                                    <td className="py-3 px-4">{formatFileSize(file.size)}</td>
                                    <td className="py-3 px-4">{file.downloadCount}</td>
                                    <td className="py-3 px-4">{file.contentType}</td>
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/download/${file.id}`}
                                            className="text-blue-600 hover:text-blue-800 mr-4"
                                        >
                                            Download
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default HomePage;
