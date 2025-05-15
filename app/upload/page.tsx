'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function UploadPage() {
    const router = useRouter();

    return (
        <div className="bg-beige-200 min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header section */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-gray-600 hover:text-primary-500 mb-4"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Home
                    </Link>

                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload a File</h1>
                    <p className="text-gray-600">
                        Share files securely with automatic expiration. Maximum file size is 500MB.
                    </p>
                </div>

                {/* Upload container with subtle design */}
                <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <FileUpload
                                onUploadSuccess={(data) => {
                                    console.log('File uploaded successfully:', data.id);
                                }}
                                onUploadError={(error) => {
                                    console.error('Upload error:', error);
                                }}
                            />
                        </div>

                        <div className="bg-beige-100 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-800 mb-3">Tips</h3>
                            <ul className="space-y-3 text-gray-600 text-sm">
                                <li className="flex items-start">
                                    <span className="text-primary-500 font-bold mr-2">•</span>
                                    <span>Set your preferred expiration time with the TTL options</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-primary-500 font-bold mr-2">•</span>
                                    <span>Add a clear title to help identify your file later</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-primary-500 font-bold mr-2">•</span>
                                    <span>The description field can be used to add details about the file contents</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-primary-500 font-bold mr-2">•</span>
                                    <span>Text files are stored in Firestore for optimal performance</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-primary-500 font-bold mr-2">•</span>
                                    <span>Binary files (images, PDFs, etc.) are stored in secure Cloud Storage</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Extra information */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Need to upload multiple files? <Link href="/home" className="text-primary-500 hover:text-primary-600">Sign in</Link> for batch uploads and file management.
                    </p>
                </div>
            </div>
        </div>
    );
}