"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaFile, FaSpinner, FaCheckCircle, FaTimes, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Maximum file size in bytes (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// API base URL is now relative since we're using Next.js API routes on Vercel
const API_BASE_URL = '';

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

    // Handle file upload using pre-signed URLs
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const contentType = file.type || 'application/octet-stream'; // Default content type

        try {
            // First, get a pre-signed URL for the upload
            const signedUrlResponse = await fetch('/api/uploads/signed-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: contentType, // Use defaulted content type
                    // Optional TTL in hours
                    ttlHours: 24 * 7, // 7 days default
                }),
            });

            if (!signedUrlResponse.ok) {
                let errorResponseMessage = 'Failed to get upload URL';
                try {
                    const contentType = signedUrlResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await signedUrlResponse.json();
                        errorResponseMessage = errorData.error || errorResponseMessage;
                    } else {
                        const errorText = await signedUrlResponse.text();
                        console.error("Non-JSON error response from /api/uploads/signed-url:", errorText);
                        errorResponseMessage = `Server error (status ${signedUrlResponse.status}). Check console for details.`;
                    }
                } catch (e) {
                    console.error("Error parsing error response from /api/uploads/signed-url:", e);
                }
                throw new Error(errorResponseMessage);
            }

            const { uploadUrl, fileId } = await signedUrlResponse.json();

            // Progress tracking setup
            let uploadedBytes = 0;
            const totalBytes = file.size;

            // Set up progress reporting
            const updateProgressInterval = setInterval(() => {
                if (uploadedBytes < totalBytes) {
                    // Simulate progress until we get real progress (WebKit browsers don't support upload progress reliably)
                    const simulatedProgress = Math.min(95, (uploadProgress + Math.random() * 5));
                    setUploadProgress(simulatedProgress);
                }
            }, 300);

            // Upload the file directly to GCS using the pre-signed URL
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': contentType, // Use defaulted content type
                },
                body: file,
            });

            clearInterval(updateProgressInterval);

            if (!uploadResponse.ok) {
                let errorDetail = `Upload failed with status: ${uploadResponse.status}`;
                try {
                    const errorText = await uploadResponse.text(); // GCS errors are often XML or plain text
                    console.error("GCS Upload Error Response:", errorText);
                    // Provide a more specific message if possible, or a snippet
                    errorDetail = `Upload to GCS failed (status ${uploadResponse.status}): ${errorText.substring(0, 200)}`;
                } catch (e) {
                    console.error("Error reading GCS error response body:", e);
                }
                throw new Error(errorDetail);
            }

            // Set progress to 100% when upload is complete
            setUploadProgress(100);

            // Get a signed download URL
            const signedDownloadResponse = await fetch(`/api/uploads/${fileId}/signed-url?expires=1440`, {
                method: 'GET',
            });

            let signedData = null;
            if (signedDownloadResponse.ok) {
                try {
                    const contentType = signedDownloadResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        signedData = await signedDownloadResponse.json();
                    } else {
                        const responseText = await signedDownloadResponse.text();
                        console.error("Non-JSON response from /api/uploads/[id]/signed-url (status OK):", responseText);
                        throw new Error("Received non-JSON response for signed download URL when JSON was expected.");
                    }
                } catch (e) {
                    console.error("Error parsing signed download URL response:", e);
                    toast.error("Failed to process download URL information.");
                    // Re-throw to be caught by the main catch block, or handle more gracefully
                    throw e;
                }
            } else {
                console.warn('Could not generate signed download URL, falling back to direct URL. Status:', signedDownloadResponse.status);
                // Optionally, try to read error text if not OK
                try {
                    const errorText = await signedDownloadResponse.text();
                    console.warn('Error body from signed download URL endpoint:', errorText);
                } catch (e) {
                    // Ignore if reading body fails
                }
            }

            const downloadUrl = signedData?.url || `/api/uploads/${fileId}`;

            setUploadedFile({
                id: fileId,
                fileName: file.name,
                contentType: contentType, // Store defaulted content type
                size: file.size,
                downloadUrl: downloadUrl,
                uploadedAt: new Date().toISOString()
            });

            // Reset form
            if (formRef.current) {
                formRef.current.reset();
            }

            toast.success('File uploaded successfully!');

            // Call the onUploadSuccess callback if provided
            if (onUploadSuccess) {
                onUploadSuccess({
                    id: fileId,
                    fileName: file.name,
                    contentType: contentType, // Pass defaulted content type
                    size: file.size,
                    downloadUrl: downloadUrl,
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
                                <p className="text-sm text-gray-500">
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
                                    {formatBytes(file.size)} • {file.type || 'application/octet-stream'}
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