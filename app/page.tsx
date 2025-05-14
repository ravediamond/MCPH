'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="bg-beige-200 min-h-screen">
            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-gray-200">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-4 text-gray-800">
                        Secure, Simple File Sharing
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg max-w-3xl mx-auto">
                        Upload and share files that automatically expire. No account required.
                    </p>

                    {/* Upload Button */}
                    <Link
                        href="/upload"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-primary-500 rounded-lg shadow-lg hover:bg-primary-600 transition duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Now
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-12 px-4 bg-beige-100">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
                        Why Choose Our File Sharing Service?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium mb-2 text-gray-800">Secure & Private</h3>
                            <p className="text-gray-600">
                                All files are encrypted in transit and at rest. Files are automatically deleted after they expire.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium mb-2 text-gray-800">Lightning Fast</h3>
                            <p className="text-gray-600">
                                Upload files in seconds and share instantly with a generated link. No waiting or complex processes.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium mb-2 text-gray-800">Simple to Use</h3>
                            <p className="text-gray-600">
                                No accounts, no logins, no complexity. Just upload and share - it's that easy.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
                        How It Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="bg-primary-100 text-primary-500 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <span className="font-bold text-lg">1</span>
                            </div>
                            <h3 className="text-lg font-medium mb-2 text-gray-800">Upload Your File</h3>
                            <p className="text-gray-600">
                                Choose any file from your device and set your preferred expiration time.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="bg-primary-100 text-primary-500 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <span className="font-bold text-lg">2</span>
                            </div>
                            <h3 className="text-lg font-medium mb-2 text-gray-800">Get a Secure Link</h3>
                            <p className="text-gray-600">
                                Instantly receive a secure link that you can share with anyone.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="bg-primary-100 text-primary-500 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <span className="font-bold text-lg">3</span>
                            </div>
                            <h3 className="text-lg font-medium mb-2 text-gray-800">Auto-Expiring Files</h3>
                            <p className="text-gray-600">
                                Files are automatically deleted after the expiration time for enhanced privacy.
                            </p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="text-center mt-8">
                        <Link
                            href="/upload"
                            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-500 rounded-lg shadow hover:bg-primary-600 transition duration-300"
                        >
                            Start Uploading Now
                        </Link>
                    </div>

                    {/* Intelligent Storage Feature */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 my-12 shadow-sm">
                        <h3 className="text-lg font-medium mb-3 text-gray-800">Intelligent Storage System</h3>
                        <p className="text-gray-600 mb-4">
                            Our service automatically optimizes where your content is stored based on file type:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-beige-100 p-3 rounded">
                                <h4 className="font-medium text-gray-800 mb-2">Text Files in Firestore</h4>
                                <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                                    <li>Markdown (.md) documents</li>
                                    <li>JSON files</li>
                                    <li>Plain text (.txt)</li>
                                    <li>Optimized for fast retrieval</li>
                                    <li>Support for larger text with automatic chunking</li>
                                </ul>
                            </div>
                            <div className="bg-beige-100 p-3 rounded">
                                <h4 className="font-medium text-gray-800 mb-2">Other Files in Cloud Storage</h4>
                                <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                                    <li>Images, videos, and audio</li>
                                    <li>Documents (PDF, Office files)</li>
                                    <li>Archives and executables</li>
                                    <li>Any other binary formats</li>
                                    <li>Support for files up to 500MB</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
                        <h3 className="text-lg font-medium mb-3 text-gray-800">AI Integration Ready</h3>
                        <p className="text-gray-600 mb-4">
                            Our file sharing service includes Server-Sent Events (SSE) endpoints for AI agent integration. Easily upload and download files from AI systems using our API.
                        </p>
                        <div className="bg-beige-100 p-3 rounded font-mono text-sm text-gray-700 overflow-x-auto">
                            {/* Example: AI agent uploading a file via SSE */}<br />
                            {`const result = await callTool('CreateUploadLink', {`}<br />
                            {`  fileName: 'report.pdf',`}<br />
                            {`  contentType: 'application/pdf',`}<br />
                            {`  ttlHours: 2,`}<br />
                            {`  base64Content: 'base64-encoded-content'`}<br />
                            {`});`}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer & Info */}
            <section className="py-8 px-4 border-t border-gray-200 text-center">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-600 text-sm">
                        Files are stored securely using Google Cloud Storage and Firestore based on content type.
                        <br />All files are automatically purged after expiration. No registration required.
                    </p>
                </div>
            </section>
        </div>
    );
}
