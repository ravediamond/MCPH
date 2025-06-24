"use client";

import React from "react";
import Link from "next/link";

export default function CratesApiPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-blue-600 transition-colors">
            Documentation
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Crates API</span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Crates API Documentation
          </h1>
          <p className="text-gray-600">
            Comprehensive documentation for all MCP tools to manage crates
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
          <p className="text-gray-600 mb-4">
            The MCPH Crates API provides a comprehensive set of endpoints for
            working with crates through the Model Context Protocol (MCP). This
            document covers all available tools for listing, searching,
            retrieving, uploading, sharing, and managing crates.
          </p>
          <p className="text-gray-600 mb-4">
            All crates tools are accessible through the MCP endpoint at{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              https://mcp.mcph.io/mcp
            </code>
            .
          </p>

          <div className="bg-beige-100 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-amber-800 mb-2">
              API Tools Quick Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded border border-amber-100">
                <span className="font-medium">Fetching Data</span>
                <ul className="list-disc list-inside text-sm ml-2">
                  <li>
                    <code>crates_list</code>
                  </li>
                  <li>
                    <code>crates_get</code>
                  </li>
                  <li>
                    <code>crates_get_download_link</code>
                  </li>
                  <li>
                    <code>crates_search</code>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-2 rounded border border-amber-100">
                <span className="font-medium">Creating & Managing</span>
                <ul className="list-disc list-inside text-sm ml-2">
                  <li>
                    <code>crates_upload</code>
                  </li>
                  <li>
                    <code>crates_delete</code>
                  </li>
                  <li>
                    <code>crates_copy</code>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-2 rounded border border-amber-100">
                <span className="font-medium">Sharing Controls</span>
                <ul className="list-disc list-inside text-sm ml-2">
                  <li>
                    <code>crates_share</code>
                  </li>
                  <li>
                    <code>crates_unshare</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Crates API Tools
          </h2>

          {/* crates_list */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_list
            </h3>
            <p className="text-gray-600 mb-3">
              Lists all crates owned by the authenticated user. Results are
              paginated and sorted by creation date (newest first).
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2">
                  <code className="font-mono text-blue-600">limit</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Number of
                  crates to return per page. Default: 20, Max: 100.
                </p>
                <p>
                  <code className="font-mono text-blue-600">startAfter</code>{" "}
                  <span className="text-gray-500">(optional)</span>: ID of the
                  last crate from the previous page for pagination.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">crates</code>:
                    Array of crate metadata objects
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">lastCrateId</code>
                    : ID of the last crate in the result set (for pagination)
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">hasMore</code>:
                    Boolean indicating if there are more pages
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "crates_list",
    "arguments": { 
      "limit": 5
    }
  }
}

// Response
{
  "crates": [
    {
      "id": "abc123",
      "title": "Example Crate",
      "description": "This is an example crate",
      "category": "markdown",
      "createdAt": "2025-06-24T12:34:56.789Z",
      "mimeType": "text/markdown",
      "size": 1024,
      "tags": ["example", "documentation"],
      "isPublic": true,
      "isPasswordProtected": false
    },
    // ...more crates
  ],
  "lastCrateId": "xyz789",
  "hasMore": true
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication. The list only returns crates owned by
                the authenticated user.
              </p>
            </div>
          </div>

          {/* crates_get */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_get
            </h3>
            <p className="text-gray-600 mb-3">
              Retrieves a crate's contents by its ID. Supports text, images, and
              binary files. Anonymous uploads are public by default.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2">
                  <code className="font-mono text-blue-600">id</code>{" "}
                  <span className="text-gray-500">(required)</span>: The unique
                  identifier of the crate.
                </p>
                <p>
                  <code className="font-mono text-blue-600">password</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Password
                  for accessing password-protected crates.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-1">
                  <code className="font-mono text-blue-600">content</code>:
                  Array of content objects with:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">type</code>:
                    "text" or "image"
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">text</code>: For
                    text content
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">data</code>: For
                    image content (base64)
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">mimeType</code>:
                    For images
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "crates_get",
    "arguments": { 
      "id": "abc123"
    }
  }
}

// Response for Text
{
  "content": [
    {
      "type": "text",
      "text": "# Example Markdown\\n\\nThis is some sample content."
    }
  ]
}

// Response for Image
{
  "content": [
    {
      "type": "image",
      "data": "base64EncodedImageData...",
      "mimeType": "image/png"
    }
  ]
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Access Rules</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Owner can always access their own crates</li>
                <li>Anonymous uploads are public by default</li>
                <li>Public crates are accessible by anyone</li>
                <li>
                  Password-protected crates require the password parameter
                </li>
                <li>
                  Binary files direct the user to use{" "}
                  <code>crates_get_download_link</code> instead
                </li>
              </ul>
            </div>
          </div>

          {/* crates_get_download_link */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_get_download_link
            </h3>
            <p className="text-gray-600 mb-3">
              Generates a pre-signed download URL for a crate, especially for
              binary files or large content. Download links expire by default
              after 24 hours.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2">
                  <code className="font-mono text-blue-600">id</code>{" "}
                  <span className="text-gray-500">(required)</span>: The unique
                  identifier of the crate.
                </p>
                <p>
                  <code className="font-mono text-blue-600">
                    expiresInSeconds
                  </code>{" "}
                  <span className="text-gray-500">(optional)</span>: Duration in
                  seconds until the download link expires. Default: 86400 (24
                  hours), Min: 1, Max: 86400.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">url</code>:
                    Pre-signed URL for downloading the crate
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">
                      validForSeconds
                    </code>
                    : Number of seconds the URL will be valid
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">expiresAt</code>:
                    ISO timestamp when the URL expires
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "crates_get_download_link",
    "arguments": { 
      "id": "abc123",
      "expiresInSeconds": 3600
    }
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Download link for crate Example File: https://storage.example.com/signed-url-abc123\\nThis link is valid for 1 hours and 0 minutes."
    }
  ],
  "url": "https://storage.example.com/signed-url-abc123",
  "validForSeconds": 3600,
  "expiresAt": "2025-06-24T13:34:56.789Z"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Access Rules</h4>
              <p className="text-gray-600">
                Same as crates_get: owner can always access, anonymous uploads
                are public by default, and access to shared crates follows the
                same permission rules.
              </p>
            </div>
          </div>

          {/* crates_search */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_search
            </h3>
            <p className="text-gray-600 mb-3">
              Searches for crates by query text. The search covers title,
              description, tags, and metadata fields.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>
                  <code className="font-mono text-blue-600">query</code>{" "}
                  <span className="text-gray-500">(required)</span>: Text to
                  search for in crates.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>
                  <code className="font-mono text-blue-600">crates</code>: Array
                  of matching crate metadata objects (same structure as in
                  crates_list).
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "crates_search",
    "arguments": { 
      "query": "example"
    }
  }
}

// Response
{
  "crates": [
    {
      "id": "abc123",
      "title": "Example Crate",
      "description": "This is an example crate",
      "category": "markdown",
      "createdAt": "2025-06-24T12:34:56.789Z",
      "mimeType": "text/markdown",
      "size": 1024,
      "tags": ["example", "documentation"],
      "isPublic": true,
      "isPasswordProtected": false
    },
    // ...more matching crates
  ]
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication. Search only returns crates owned by the
                authenticated user.
              </p>
            </div>
          </div>

          {/* crates_upload */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_upload
            </h3>
            <p className="text-gray-600 mb-3">
              Uploads a new crate. Small text content is uploaded directly;
              large/binary files return a pre-signed URL that must be used to
              upload the file separately.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2">
                  <code className="font-mono text-blue-600">fileName</code>{" "}
                  <span className="text-gray-500">(required)</span>: Original
                  filename of the content being uploaded.
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">contentType</code>{" "}
                  <span className="text-gray-500">(required)</span>: MIME type
                  of the content (e.g., "text/markdown", "image/png").
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">data</code>{" "}
                  <span className="text-gray-500">
                    (required for direct upload)
                  </span>
                  : The content to upload as a string. Required for text
                  content.
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">title</code>{" "}
                  <span className="text-gray-500">(optional)</span>: A title for
                  the crate. Defaults to fileName if not provided.
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">description</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Description
                  of the crate.
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">category</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Category of
                  the crate ("markdown", "code", "image", "json", "binary").
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">tags</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Array of
                  string tags to associate with the crate.
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">metadata</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Object with
                  additional metadata key-value pairs.
                </p>
                <p className="mb-2">
                  <code className="font-mono text-blue-600">isPublic</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Boolean
                  indicating if the crate should be public. Anonymous uploads
                  are public by default.
                </p>
                <p>
                  <code className="font-mono text-blue-600">password</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Password to
                  protect the crate.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Output for Direct Upload
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">crate</code>:
                    Object containing the created crate metadata
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Output for Pre-signed URL (binary/large files)
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">uploadUrl</code>:
                    Pre-signed URL to upload the file content
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">crateId</code>: ID
                    of the crate that will be created
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">gcsPath</code>:
                    Google Cloud Storage path where the file will be stored
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Example - Text Upload
              </h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "crates_upload",
    "arguments": { 
      "fileName": "notes.md",
      "contentType": "text/markdown",
      "data": "# Meeting Notes\\n\\n- Point 1\\n- Point 2",
      "title": "Important Meeting Notes",
      "description": "Notes from our team meeting",
      "tags": ["meeting", "team", "notes"],
      "isPublic": true
    }
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Crate uploaded successfully. Crate ID: def456"
    }
  ],
  "crate": {
    "id": "def456",
    "title": "Important Meeting Notes",
    "description": "Notes from our team meeting",
    "category": "markdown",
    "createdAt": "2025-06-24T12:34:56.789Z",
    "fileName": "notes.md",
    "size": 42,
    "tags": ["meeting", "team", "notes"],
    "ownerId": "user123",
    "shared": {
      "public": true
    }
  }
}`}
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Example - Binary Upload
              </h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "crates_upload",
    "arguments": { 
      "fileName": "data.bin",
      "contentType": "application/octet-stream",
      "title": "Binary Data File",
      "category": "binary"
    }
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Upload your file using this URL with a PUT request: https://storage.example.com/upload-url-def456. Crate ID: def456"
    }
  ],
  "uploadUrl": "https://storage.example.com/upload-url-def456",
  "crateId": "def456",
  "gcsPath": "crates/def456/data.bin"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication for non-anonymous uploads. Anonymous
                uploads are created with ownerId="anonymous" and are public by
                default.
              </p>
            </div>
          </div>

          {/* crates_share */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_share
            </h3>
            <p className="text-gray-600 mb-3">
              Updates a crate's sharing settings, allowing you to make it public
              or password-protected.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="mb-2">
                  <code className="font-mono text-blue-600">id</code>{" "}
                  <span className="text-gray-500">(required)</span>: The unique
                  identifier of the crate to share.
                </p>
                <p>
                  <code className="font-mono text-blue-600">password</code>{" "}
                  <span className="text-gray-500">(optional)</span>: Password to
                  protect the crate. If not provided, the crate will be made
                  public without password protection.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">id</code>: ID of
                    the shared crate
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">shareUrl</code>:
                    Full URL to access the crate
                  </li>
                  <li>
                    <code className="font-mono text-blue-600">crateLink</code>:
                    Shortened URL (domain and path)
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "crates_share",
    "arguments": { 
      "id": "def456",
      "password": "secret123"
    }
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Crate def456 sharing settings updated. Link: https://mcph.io/crate/def456"
    }
  ],
  "id": "def456",
  "shareUrl": "https://mcph.io/crate/def456",
  "crateLink": "mcph.io/crate/def456"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication. Only the owner can change a crate's
                sharing settings.
              </p>
            </div>
          </div>

          {/* crates_unshare */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_unshare
            </h3>
            <p className="text-gray-600 mb-3">
              Makes a crate private by removing all sharing settings (public
              access and password protection).
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>
                  <code className="font-mono text-blue-600">id</code>{" "}
                  <span className="text-gray-500">(required)</span>: The unique
                  identifier of the crate to make private.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">id</code>: ID of
                    the crate that was made private
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "crates_unshare",
    "arguments": { 
      "id": "def456"
    }
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Crate def456 has been unshared. It is now private."
    }
  ],
  "id": "def456"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication. Only the owner can make a crate
                private.
              </p>
            </div>
          </div>

          {/* crates_delete */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_delete
            </h3>
            <p className="text-gray-600 mb-3">
              Permanently deletes a crate's data and metadata. This action
              requires confirmation and cannot be undone.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>
                  <code className="font-mono text-blue-600">id</code>{" "}
                  <span className="text-gray-500">(required)</span>: The unique
                  identifier of the crate to delete.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Confirmation Process
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-600">
                  This tool requires explicit confirmation through the MCP
                  elicitation process. The caller will be prompted to confirm
                  the deletion and can provide an optional reason.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">id</code>: ID of
                    the deleted crate
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "crates_delete",
    "arguments": { 
      "id": "def456"
    }
  }
}

// Response after confirmation
{
  "content": [
    {
      "type": "text",
      "text": "Crate def456 has been successfully deleted."
    }
  ],
  "id": "def456"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication. Only the owner can delete a crate.
              </p>
            </div>
          </div>

          {/* crates_copy */}
          <div className="mb-10 border-b border-gray-200 pb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              crates_copy
            </h3>
            <p className="text-gray-600 mb-3">
              Copies an existing crate to the user's collection. If the crate is
              already owned by the user, it will not be copied. The new copy
              will be private by default.
            </p>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Input Parameters
              </h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>
                  <code className="font-mono text-blue-600">id</code>{" "}
                  <span className="text-gray-500">(required)</span>: The unique
                  identifier of the crate to copy.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Output</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>
                    <code className="font-mono text-blue-600">crate</code>: The
                    new crate object with complete metadata
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Example</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
                {`// Request
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tools/call",
  "params": {
    "name": "crates_copy",
    "arguments": { 
      "id": "abc123"
    }
  }
}

// Response
{
  "content": [
    {
      "type": "text",
      "text": "Crate copied successfully to your collection. New crate ID: def456"
    }
  ],
  "crate": {
    "id": "def456",
    "title": "Copy of Example Crate",
    "description": "This is an example crate",
    "category": "markdown",
    "createdAt": "2025-06-24T12:34:56.789Z",
    "mimeType": "text/markdown",
    "size": 1024,
    "tags": ["example", "documentation"],
    "isPublic": false,
    "isPasswordProtected": false
  }
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
              <p className="text-gray-600">
                Requires authentication. Anonymous users cannot copy crates.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Access Rules</h4>
              <p className="text-gray-600">
                Users can only copy crates that are public or owned by anonymous
                users. Private crates cannot be copied unless the user is the
                owner, in which case copying is not needed as they already own
                the crate.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-beige-100 border border-amber-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-amber-800 mb-3">
            Important Notes
          </h3>

          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <span className="font-medium">Anonymous Uploads:</span> All
              anonymously uploaded crates are public by default. These are
              automatically created with <code>ownerId="anonymous"</code> and{" "}
              <code>public=true</code>.
            </li>
            <li>
              <span className="font-medium">Authentication:</span> Use API keys
              for authenticated access to your own crates. API keys should be
              passed as Bearer tokens in the Authorization header.
            </li>
            <li>
              <span className="font-medium">Binary Files:</span> For binary
              files, use <code>crates_get_download_link</code> instead of{" "}
              <code>crates_get</code>. When uploading binary files, you'll
              receive a pre-signed URL to upload the content separately.
            </li>
            <li>
              <span className="font-medium">Retention:</span> Crates are
              automatically deleted after 30 days. Download links expire after
              24 hours by default.
            </li>
            <li>
              <span className="font-medium">Error Handling:</span> All tools
              return clear error messages when operations fail. Common errors
              include permission issues, invalid IDs, and missing required
              parameters.
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/docs"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
          >
            ← Back to Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
