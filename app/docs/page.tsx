'use client';

import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">API Documentation</h1>
                    <p className="text-gray-600">Easy integration for your applications</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-medium text-gray-800 mb-4">Overview</h2>
                    <p className="text-gray-600 mb-3">
                        Our API lets you upload and download files with simple endpoints. Files automatically expire
                        after a set time (default: 1 hour, max: 24 hours).
                    </p>
                    <p className="text-gray-600">
                        All endpoints are public with rate limits to prevent abuse.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Navigation sidebar */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
                            <h3 className="font-medium text-gray-800 mb-3">Contents</h3>
                            <nav className="space-y-1 text-sm">
                                <a href="#rest-api" className="block text-primary-500 hover:text-primary-600 py-1">REST API</a>
                                <a href="#sse-api" className="block text-primary-500 hover:text-primary-600 py-1">SSE API for AI</a>
                                <a href="#limits" className="block text-primary-500 hover:text-primary-600 py-1">Limits & Errors</a>
                            </nav>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="md:col-span-3">
                        {/* REST API */}
                        <section id="rest-api" className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-medium text-gray-800 mb-4">REST API</h2>

                            {/* Upload */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-800">Upload Artifact</h3>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-primary-600">POST /api/uploads</code>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                    Upload an artifact and receive an artifact ID and download URL.
                                </p>
                                <div className="bg-gray-50 p-3 rounded text-sm mb-3">
                                    <p className="font-medium mb-1">Request:</p>
                                    <p className="text-gray-600 mb-1">Content-Type: <code>multipart/form-data</code></p>
                                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                                        <li><code>artifact</code> - The artifact to upload (required)</li>
                                        <li><code>ttl</code> - Time-to-live in hours (optional)</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 p-3 rounded text-sm">
                                    <p className="font-medium mb-1">Response:</p>
                                    <pre className="text-xs text-gray-600 overflow-x-auto">{`{
  "id": "string",         // Unique artifact ID
  "fileName": "string",   // Original artifact filename
  "downloadUrl": "string" // URL to download the artifact
}`}</pre>
                                </div>
                            </div>

                            {/* Download */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-800">Download Artifact</h3>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-primary-600">GET /api/uploads/{'{id}'}</code>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                    Download an artifact by its ID or get artifact metadata.
                                </p>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                    <p className="font-medium mb-1">Parameters:</p>
                                    <ul className="list-disc pl-5 text-gray-600">
                                        <li><code>id</code> - Artifact ID in URL path (required)</li>
                                        <li><code>info=true</code> - Get metadata instead of artifact (optional)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* SSE API */}
                        <section id="sse-api" className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-medium text-gray-800 mb-4">SSE API for AI Integration</h2>
                            <p className="text-gray-600 text-sm mb-4">
                                We provide a Model Context Protocol (MCP) compatible Server-Sent Events API
                                for AI agents to work with files via <code>/api/sse</code>.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Upload */}
                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="font-medium text-gray-800 mb-2">CreateUploadLink</h3>
                                    <p className="text-gray-600 text-sm mb-2">
                                        Uploads base64-encoded content and returns a download link.
                                    </p>
                                    <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-100 p-2 rounded">{`// Example
await callTool('CreateUploadLink', {
  fileName: 'example.txt',
  contentType: 'text/plain',
  ttlHours: 2,
  base64Content: 'SGVsbG8='
});`}</pre>
                                </div>

                                {/* Download */}
                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="font-medium text-gray-800 mb-2">GetDownloadLink</h3>
                                    <p className="text-gray-600 text-sm mb-2">
                                        Gets download information for an existing file.
                                    </p>
                                    <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-100 p-2 rounded">{`// Example
await callTool('GetDownloadLink', {
  fileId: '1a2b3c4d-5e6f-7g8h'
});`}</pre>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Link href="/docs/local-usage" className="text-primary-500 text-sm hover:text-primary-600">
                                    Learn more about MCP integration →
                                </Link>
                            </div>
                        </section>

                        {/* Limits & Errors */}
                        <section id="limits" className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-medium text-gray-800 mb-4">Limits & Errors</h2>

                            <div className="mb-6">
                                <h3 className="font-medium text-gray-800 mb-2">Rate Limits</h3>
                                <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                                    <li><strong>Uploads:</strong> 20 per 10 minutes per IP</li>
                                    <li><strong>Downloads:</strong> 100 per minute per IP</li>
                                    <li><strong>SSE:</strong> 10 requests per 10 seconds per IP</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Common Error Codes</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <tbody className="text-gray-600">
                                            <tr className="border-b">
                                                <td className="py-2 pr-8">400</td>
                                                <td>Invalid or malformed request</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="py-2 pr-8">404</td>
                                                <td>File not found</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="py-2 pr-8">410</td>
                                                <td>File expired</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 pr-8">429</td>
                                                <td>Rate limit exceeded</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
