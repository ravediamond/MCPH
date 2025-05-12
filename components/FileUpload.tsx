"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaFile, FaSpinner, FaCheckCircle, FaTimes, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Maximum file size in bytes (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Use Next.js API routes for local development, will switch to Firebase Functions later
const API_BASE_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
    (typeof window !== 'undefined' ? '' : ''); // Empty string will use relative URLs

type UploadedFile = {
    id: string;
    fileName: string;
    contentType: string;
    size: number;
    downloadUrl: string;
    uploadedAt: string;
};

interface FileUploadProps {
    onUploadSuccess?: (data: UploadedFile) => void;
    onUploadError?: (error: Error | string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
    // Refs
    const formRef = useRef<HTMLFormElement>(null);
    const urlRef = useRef<HTMLInputElement>(null);

    // State
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [urlCopied, setUrlCopied] = useState(false);

    // Format bytes to human-readable size
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format date to human-readable
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Dropzone setup
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];

        if (selectedFile.size > MAX_FILE_SIZE) {
            toast.error(`File is too large (${formatBytes(selectedFile.size)}). Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`);
            return;
        }

        setFile(selectedFile);
        setUploadedFile(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

    // Handle file upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Simulate progress (actual progress not available with fetch)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    const newProgress = prev + Math.random() * 15;
                    return newProgress >= 95 ? 95 : newProgress;
                });
            }, 300);

            // Use the API_BASE_URL for Firebase Functions
            const uploadUrl = `${API_BASE_URL}/api/uploads`;

            // Send the upload request
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            // Get the uploaded file data
            const data = await response.json();

            // Update download URL to use absolute URL if needed
            if (data.url && !data.url.startsWith('http') && API_BASE_URL) {
                data.downloadUrl = `${API_BASE_URL}${data.url}`;
            } else if (data.url) {
                data.downloadUrl = data.url;
            }

            setUploadedFile({
                id: data.fileId,
                fileName: file.name,
                contentType: file.type,
                size: file.size,
                downloadUrl: data.downloadUrl || data.url,
                uploadedAt: new Date().toISOString()
            });
            setUploadProgress(100);

            // Reset form
            if (formRef.current) {
                formRef.current.reset();
            }

            toast.success('File uploaded successfully!');

            // Call the onUploadSuccess callback if provided
            if (onUploadSuccess) {
                onUploadSuccess({
                    id: data.fileId,
                    fileName: file.name,
                    contentType: file.type,
                    size: file.size,
                    downloadUrl: data.downloadUrl || data.url,
                    uploadedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            toast.error(errorMessage);

            // Call the onUploadError callback if provided
            if (onUploadError) {
                onUploadError(error instanceof Error ? error : errorMessage);
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Handle copy URL to clipboard
    const handleCopyUrl = () => {
        if (!uploadedFile) return;

        navigator.clipboard.writeText(uploadedFile.downloadUrl)
            .then(() => {
                setUrlCopied(true);
                toast.success('URL copied to clipboard!');

                // Reset copy status after 2 seconds
                setTimeout(() => setUrlCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                toast.error('Failed to copy URL to clipboard');
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
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center">
                            <FaFile className="text-gray-500 mr-3" />
                            <div>
                                <p className="font-medium">{uploadedFile.fileName}</p>
                                <p className="text-sm text-gray-600">
                                    {formatBytes(uploadedFile.size)} • {uploadedFile.contentType}
                                </p>
                            </div>
                        </div>

                        <div className="bg-beige-100 p-4 rounded-md">
                            <div className="flex flex-wrap items-center justify-between mb-4">
                                <p className="text-sm text-gray-600">
                                    <span className="block md:inline">Uploaded: {formatDate(uploadedFile.uploadedAt)}</span>
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    ref={urlRef}
                                    type="text"
                                    readOnly
                                    value={uploadedFile.downloadUrl}
                                    className="w-full bg-white py-2 px-3 pr-20 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    onClick={e => (e.target as HTMLInputElement).select()}
                                />
                                <div className="absolute right-1 top-1 flex">
                                    <button
                                        onClick={handleCopyUrl}
                                        className="p-1 text-gray-500 hover:text-primary-500 bg-gray-100 rounded mr-1"
                                        title="Copy to clipboard"
                                    >
                                        {urlCopied ? <FaCheckCircle className="text-green-500" /> : <FaCopy />}
                                    </button>
                                    <a
                                        href={uploadedFile.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-gray-500 hover:text-primary-500 bg-gray-100 rounded"
                                        title="Open in new tab"
                                    >
                                        <FaExternalLinkAlt />
                                    </a>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <a
                                    href={uploadedFile.downloadUrl}
                                    className="inline-block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-center text-white rounded-md shadow transition-colors"
                                >
                                    Download File
                                </a>
                                <button
                                    onClick={() => setUploadedFile(null)}
                                    className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 text-center text-gray-800 rounded-md shadow transition-colors"
                                >
                                    Upload Another File
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 text-center mt-4">
                            Share this link to allow others to download the file.
                        </p>
                    </div>
                </div>
            ) : (
                <form ref={formRef} onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload a File</h2>

                    <div {...getRootProps({
                        className: `border-2 border-dashed ${isDragActive ? 'border-primary-400 bg-beige-100' : 'border-gray-300'} rounded-lg p-8 text-center cursor-pointer hover:bg-beige-50 transition-colors mb-4`
                    })}>
                        <input {...getInputProps()} />

                        <div className="space-y-3">
                            <FaUpload className="mx-auto text-gray-400 text-3xl" />

                            {isDragActive ? (
                                <p className="text-primary-500">Drop the file here...</p>
                            ) : (
                                <>
                                    <p className="text-gray-600">Drag & drop a file here, or click to select</p>
                                    <p className="text-xs text-gray-500">Maximum file size: 500MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    {file && (
                        <div className="bg-beige-100 p-3 rounded-md mb-4 flex items-center">
                            <FaFile className="text-primary-400 mr-3" />
                            <div className="overflow-hidden">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {formatBytes(file.size)} • {file.type || 'Unknown type'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="ml-auto text-gray-400 hover:text-red-500"
                                onClick={() => setFile(null)}
                                aria-label="Remove file"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}

                    {isUploading && (
                        <div className="mb-4">
                            <div className="h-2 bg-gray-200 rounded-full mb-1 overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-right text-gray-500">{Math.round(uploadProgress)}%</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className={`w-full py-2 px-4 rounded-md shadow-sm flex items-center justify-center ${!file || isUploading
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-primary-500 hover:bg-primary-600 text-white'
                            } transition-colors`}
                    >
                        {isUploading ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                Uploading...
                            </>
                        ) : (
                            'Upload File'
                        )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        By uploading a file, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </form>
            )}
        </div>
    );
}