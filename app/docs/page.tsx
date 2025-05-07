'use client';

import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
    return (
        <div className="bg-beige-200 min-h-screen py-12">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">API Documentation</h1>
                    <p className="text-gray-600">Integrate file sharing into your applications</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="md:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-24 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Contents</h3>
                            <nav className="space-y-2">
                                <a href="#overview" className="block text-primary-500 hover:text-primary-600">Overview</a>
                                <a href="#rest-api" className="block text-primary-500 hover:text-primary-600">REST API</a>
                                <a href="#upload-endpoint" className="block text-primary-500 hover:text-primary-600 pl-4">Upload Endpoint</a>
                                <a href="#download-endpoint" className="block text-primary-500 hover:text-primary-600 pl-4">Download Endpoint</a>
                                <a href="#sse-api" className="block text-primary-500 hover:text-primary-600">SSE API for AI</a>
                                <a href="#create-upload-link" className="block text-primary-500 hover:text-primary-600 pl-4">CreateUploadLink</a>
                                <a href="#get-download-link" className="block text-primary-500 hover:text-primary-600 pl-4">GetDownloadLink</a>
                                <a href="#rate-limits" className="block text-primary-500 hover:text-primary-600">Rate Limits</a>
                                <a href="#errors" className="block text-primary-500 hover:text-primary-600">Error Handling</a>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-3">
                        {/* Overview Section */}
                        <section id="overview" className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
                            <p className="text-gray-600 mb-4">
                                MCPH offers a simple API for uploading and downloading files. Our API supports both traditional
                                REST endpoints and Server-Sent Events (SSE) for AI integration.
                            </p>
                            <p className="text-gray-600 mb-4">
                                All files uploaded through our API are temporary and will be automatically deleted after their
                                expiration time (default: 1 hour, maximum: 24 hours).
                            </p>
                            <p className="text-gray-600">
                                All API endpoints are public and do not require authentication, but they are subject to rate limiting
                                to prevent abuse.
                            </p>
                        </section>

                        {/* REST API Section */}
                        <section id="rest-api" className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">REST API</h2>
                            <p className="text-gray-600 mb-4">
                                Our REST API provides two main endpoints for uploading and downloading files.
                            </p>

                            {/* Upload Endpoint */}
                            <div id="upload-endpoint" className="mb-8">
                                <h3 className="text-xl font-semibold text-primary-500 mb-4">Upload Endpoint</h3>
                                <div className="bg-beige-100 p-4 rounded-md mb-4">
                                    <code className="text-green-600">POST /api/uploads</code>
                                </div>

                                <p className="text-gray-600 mb-4">
                                    Uploads a file and returns a file ID and download URL.
                                </p>

                                <h4 className="text-gray-800 font-medium mb-2">Request</h4>
                                <p className="text-gray-600 mb-2">
                                    Content-Type: <code className="text-primary-600">multipart/form-data</code>
                                </p>

                                <div className="mb-4">
                                    <h5 className="text-gray-800 font-medium">Form Parameters:</h5>
                                    <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                        <li><code className="text-primary-600">file</code> (required) - The file to upload</li>
                                        <li><code className="text-primary-600">ttl</code> (optional) - Time-to-live in hours (default: 1, min: 0.016, max: 24)</li>
                                        <li><code className="text-primary-600">[key: string]</code> (optional) - Additional metadata fields</li>
                                    </ul>
                                </div>

                                <h4 className="text-gray-800 font-medium mb-2">Response</h4>
                                <p className="text-gray-600 mb-2">
                                    Status: <code className="text-primary-600">201 Created</code>
                                </p>

                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mb-4">
                                    {`{
  "id": "string",          // Unique file ID
  "fileName": "string",    // Original filename
  "contentType": "string", // MIME type
  "size": number,          // File size in bytes
  "uploadedAt": "string",  // ISO datetime
  "expiresAt": "string",   // ISO datetime
  "downloadUrl": "string"  // URL to download the file
}`}
                                </div>

                                <h4 className="text-gray-800 font-medium mb-2">Example</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto">
                                    {`// Using fetch with FormData
const formData = new FormData();
formData.append('file', fileObject);
formData.append('ttl', '2'); // 2 hours TTL

const response = await fetch('https://your-domain.com/api/uploads', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.downloadUrl); // Use this URL to download the file`}
                                </div>
                            </div>

                            {/* Download Endpoint */}
                            <div id="download-endpoint">
                                <h3 className="text-xl font-semibold text-primary-500 mb-4">Download Endpoint</h3>
                                <div className="bg-beige-100 p-4 rounded-md mb-4">
                                    <code className="text-green-600">GET /api/uploads/{'{id}'}</code>
                                </div>

                                <p className="text-gray-600 mb-4">
                                    Downloads a file by its ID or returns file metadata if the <code className="text-primary-600">info</code> parameter is set to <code className="text-primary-600">true</code>.
                                </p>

                                <h4 className="text-gray-800 font-medium mb-2">Parameters</h4>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                                    <li><code className="text-primary-600">id</code> (required) - The unique file ID</li>
                                    <li><code className="text-primary-600">info</code> (optional) - Set to <code className="text-primary-600">true</code> to get file metadata instead of downloading</li>
                                </ul>

                                <h4 className="text-gray-800 font-medium mb-2">Response: Download</h4>
                                <p className="text-gray-600 mb-2">
                                    Status: <code className="text-primary-600">302 Found</code> (redirect to signed download URL)
                                </p>

                                <h4 className="text-gray-800 font-medium mb-2">Response: Info</h4>
                                <p className="text-gray-600 mb-2">
                                    Status: <code className="text-primary-600">200 OK</code>
                                </p>

                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mb-4">
                                    {`{
  "id": "string",          // Unique file ID
  "fileName": "string",    // Original filename
  "contentType": "string", // MIME type
  "size": number,          // File size in bytes
  "uploadedAt": "string",  // ISO datetime
  "expiresAt": "string",   // ISO datetime
  "downloadCount": number  // Number of downloads
}`}
                                </div>
                            </div>
                        </section>

                        {/* SSE API Section */}
                        <section id="sse-api" className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">SSE API for AI Integration</h2>
                            <p className="text-gray-600 mb-4">
                                We provide a Model Context Protocol (MCP) compatible Server-Sent Events (SSE) API for AI agents to upload and download files.
                            </p>
                            <p className="text-gray-600 mb-4">
                                The SSE API is available at <code className="text-primary-600">/api/sse</code> and follows the JSON-RPC protocol.
                            </p>

                            {/* CreateUploadLink Tool */}
                            <div id="create-upload-link" className="mb-6">
                                <h3 className="text-xl font-semibold text-primary-500 mb-4">CreateUploadLink Tool</h3>
                                <p className="text-gray-600 mb-3">
                                    This tool allows AI agents to upload files via base64-encoded content.
                                </p>

                                <h4 className="text-gray-800 font-medium mb-2">Input Schema</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mb-4">
                                    {`{
  "fileName": "string",     // Required: Name of the file
  "contentType": "string",  // Required: MIME type of the file
  "ttlHours": number,       // Optional: Time-to-live in hours (default: 1)
  "base64Content": "string" // Required: Base64-encoded file content
}`}
                                </div>

                                <h4 className="text-gray-800 font-medium mb-2">Response</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mb-4">
                                    {`{
  "fileId": "string",       // Unique file ID
  "fileName": "string",     // Original filename
  "size": number,           // File size in bytes
  "downloadUrl": "string",  // URL to download the file
  "uploadedAt": "string",   // ISO datetime
  "expiresAt": "string"     // ISO datetime
}`}
                                </div>

                                <h4 className="text-gray-800 font-medium mb-2">Example</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto">
                                    {`// Example AI agent usage
const result = await callTool('CreateUploadLink', {
  fileName: 'example.txt',
  contentType: 'text/plain',
  ttlHours: 2,
  base64Content: 'SGVsbG8gV29ybGQh' // "Hello World!" in base64
});

console.log(result.downloadUrl);`}
                                </div>
                            </div>

                            {/* GetDownloadLink Tool */}
                            <div id="get-download-link">
                                <h3 className="text-xl font-semibold text-primary-500 mb-4">GetDownloadLink Tool</h3>
                                <p className="text-gray-600 mb-3">
                                    This tool allows AI agents to get a download link for an existing file.
                                </p>

                                <h4 className="text-gray-800 font-medium mb-2">Input Schema</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mb-4">
                                    {`{
  "fileId": "string" // Required: The unique file ID
}`}
                                </div>

                                <h4 className="text-gray-800 font-medium mb-2">Response</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mb-4">
                                    {`{
  "fileId": "string",         // Unique file ID
  "fileName": "string",       // Original filename
  "contentType": "string",    // MIME type
  "size": number,             // File size in bytes
  "downloadUrl": "string",    // Signed URL to download the file
  "directUrl": "string",      // Direct URL to the file
  "uploadedAt": "string",     // ISO datetime
  "expiresAt": "string",      // ISO datetime
  "downloadCount": number     // Number of downloads
}`}
                                </div>

                                <h4 className="text-gray-800 font-medium mb-2">Example</h4>
                                <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto">
                                    {`// Example AI agent usage
const result = await callTool('GetDownloadLink', {
  fileId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p'
});

console.log(result.downloadUrl);`}
                                </div>
                            </div>
                        </section>

                        {/* Rate Limits Section */}
                        <section id="rate-limits" className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Rate Limits</h2>
                            <p className="text-gray-600 mb-4">
                                To ensure service stability and prevent abuse, we apply the following rate limits:
                            </p>

                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li><strong>Uploads:</strong> 20 uploads per 10 minutes per IP address</li>
                                <li><strong>Downloads:</strong> 100 downloads per minute per IP address</li>
                                <li><strong>SSE connections:</strong> 10 requests per 10 seconds per IP address</li>
                            </ul>

                            <p className="text-gray-600 mt-4">
                                If you exceed these limits, you will receive a <code className="text-primary-600">429 Too Many Requests</code> response
                                with appropriate headers indicating the wait time before your next allowed request.
                            </p>
                        </section>

                        {/* Error Handling Section */}
                        <section id="errors" className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error Handling</h2>
                            <p className="text-gray-600 mb-4">
                                Our API uses standard HTTP status codes to indicate the success or failure of requests.
                            </p>

                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-beige-100 rounded-lg">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-4 text-left text-primary-600 border-b border-gray-300">Status Code</th>
                                            <th className="py-2 px-4 text-left text-primary-600 border-b border-gray-300">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600">
                                        <tr>
                                            <td className="py-2 px-4 border-b border-gray-200">200 OK</td>
                                            <td className="py-2 px-4 border-b border-gray-200">The request was successful</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-4 border-b border-gray-200">201 Created</td>
                                            <td className="py-2 px-4 border-b border-gray-200">The file was uploaded successfully</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-4 border-b border-gray-200">400 Bad Request</td>
                                            <td className="py-2 px-4 border-b border-gray-200">The request was invalid or malformed</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-4 border-b border-gray-200">404 Not Found</td>
                                            <td className="py-2 px-4 border-b border-gray-200">The requested file does not exist</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-4 border-b border-gray-200">410 Gone</td>
                                            <td className="py-2 px-4 border-b border-gray-200">The file has expired and been deleted</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-4 border-b border-gray-200">429 Too Many Requests</td>
                                            <td className="py-2 px-4 border-b border-gray-200">You have exceeded the rate limit</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 px-4">500 Internal Server Error</td>
                                            <td className="py-2 px-4">An unexpected error occurred on the server</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-gray-600 mt-6">
                                In case of errors, the response body will contain a JSON object with an <code className="text-primary-600">error</code> property
                                providing additional details about the error.
                            </p>

                            <div className="bg-beige-100 p-4 rounded-md font-mono text-sm text-gray-700 overflow-x-auto mt-4">
                                {`{
  "error": "File not found or expired"
}`}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
