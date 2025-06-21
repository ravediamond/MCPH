"use client";

import React from "react";
import Link from "next/link";

export default function ContentTypesPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Content Types & Features
          </h1>
          <p className="text-gray-600">
            Explore the different types of content you can share with MCPH
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Supported Content Types
          </h2>

          <p className="text-gray-600 mb-5">
            MCPH supports a variety of content types, each with optimized
            viewing experiences:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-1">Markdown</h4>
              <p className="text-sm text-gray-600">
                Perfect for formatted text, documentation, and articles. Renders
                with full markdown support including tables, code blocks, and
                images.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-1">Code</h4>
              <p className="text-sm text-gray-600">
                Share code snippets with syntax highlighting for multiple
                languages. Supports copying code blocks with a single click.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-1">Images</h4>
              <p className="text-sm text-gray-600">
                Upload PNG, JPEG, GIF, SVG and other image formats. Images are
                displayed in a clean viewer with download option.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-1">JSON</h4>
              <p className="text-sm text-gray-600">
                Share structured data in JSON format with an interactive tree
                viewer. Easily expand, collapse, and explore nested data.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-1">Binary Files</h4>
              <p className="text-sm text-gray-600">
                Upload and share generic binary files up to 10MB. Perfect for
                documents, archives, and other file types that need to be shared
                directly.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Security Features
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Password Protection</p>
                <p className="text-sm text-gray-600">
                  Add password protection to any crate to restrict access to
                  sensitive content. Anyone with the link will need to enter the
                  password to view the content.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  Automatic Expiration
                </p>
                <p className="text-sm text-gray-600">
                  All crates have an automatic expiration date of 30 days. After
                  expiration, the content is automatically deleted from our
                  servers.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">API Key Management</p>
                <p className="text-sm text-gray-600">
                  Create, rotate, and revoke API keys for secure integration
                  with AI tools. Each API key can be individually managed and
                  tracked.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Sharing Options
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Public Links</p>
                <p className="text-sm text-gray-600">
                  Share content with anyone via a simple link. No login required
                  to view shared content. The link format is:{" "}
                  <code>https://mcph.io/crate/[id]</code>
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Direct Downloads</p>
                <p className="text-sm text-gray-600">
                  All content can be downloaded directly by the viewer for
                  offline use. This makes it easy to save and reuse the shared
                  content.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-blue-600 mr-3 mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Embeddable Content</p>
                <p className="text-sm text-gray-600">
                  Embed shared content in other websites or applications using
                  the provided iframe code. Great for including code snippets in
                  documentation or blog posts.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/docs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Documentation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
