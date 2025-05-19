"use client";

import React from "react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            MCPHub Documentation
          </h1>
          <p className="text-gray-600">
            Remote artifact storage and sharing using the Model Context Protocol
            (MCP).
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            What is MCP?
          </h2>
          <p className="text-gray-600 mb-3">
            The <b>Model Context Protocol (MCP)</b> is a standard for AI models
            and tools to maintain, share, and reference context and artifacts
            across interactions. MCPHub is a public remote MCP server for
            storing and sharing artifacts (files, data, diagrams, etc.) with
            real-time streaming via SSE.
          </p>
          <p className="text-gray-600">
            Connect your MCP-compatible client to <b>https://mcph.io/sse</b> for
            remote artifact access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navigation sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
              <h3 className="font-medium text-gray-800 mb-3">Contents</h3>
              <nav className="space-y-1 text-sm">
                <a
                  href="#mcp"
                  className="block text-primary-500 hover:text-primary-600 py-1"
                >
                  MCP Overview
                </a>
                <a
                  href="#tools"
                  className="block text-primary-500 hover:text-primary-600 py-1"
                >
                  Available Tools
                </a>
                <a
                  href="#api"
                  className="block text-primary-500 hover:text-primary-600 py-1"
                >
                  API Usage
                </a>
                <a
                  href="#limits"
                  className="block text-primary-500 hover:text-primary-600 py-1"
                >
                  Limits & Errors
                </a>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            {/* MCP Overview */}
            <section
              id="mcp"
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                MCP Overview
              </h2>
              <p className="text-gray-600 mb-3">
                MCP enables persistent, portable context for AI models and
                secure sharing of artifacts between users, agents, and tools.
                MCPHub implements the official protocol with SSE (Server-Sent
                Events) for real-time context streaming.
              </p>
              <p className="text-gray-600 mb-3">
                <b>SSE Endpoint:</b> <code>https://mcph.io/sse</code>
              </p>
              <p className="text-gray-600 mb-3">
                <b>Connect with:</b>{" "}
                <code>npx mcp-remote https://mcph.io/sse</code>
              </p>
            </section>

            {/* Available Tools */}
            <section
              id="tools"
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                Available Tools
              </h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>
                  <b>artifacts/upload</b>: Upload a new artifact
                </li>
                <li>
                  <b>artifacts/get_metadata</b>: Get metadata for an artifact
                </li>
                <li>
                  <b>artifacts/download</b>: Download an artifact
                </li>
                <li>
                  <b>artifacts/search</b>: Search for artifacts
                </li>
                <li>
                  <b>artifacts/delete</b>: Delete an artifact (if authorized)
                </li>
              </ul>
            </section>

            {/* API Usage */}
            <section
              id="api"
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                API Usage
              </h2>
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">
                  Upload Artifact (REST)
                </h3>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-primary-600">
                  POST /api/uploads
                </code>
                <p className="text-gray-600 text-sm mb-3">
                  Upload an artifact and receive an artifact ID and download
                  URL.
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm mb-3">
                  <p className="font-medium mb-1">Request:</p>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>
                      <code>artifact</code> - The artifact to upload (required)
                    </li>
                    <li>
                      <code>ttl</code> - Time-to-live in hours (optional)
                    </li>
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
              <div>
                <h3 className="font-medium text-gray-800 mb-2">
                  Download Artifact (REST)
                </h3>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-primary-600">
                  GET /api/uploads/&lt;id&gt;
                </code>
                <p className="text-gray-600 text-sm mb-3">
                  Download an artifact by its ID or get artifact metadata.
                </p>
              </div>
              <div className="mt-6">
                <h3 className="font-medium text-gray-800 mb-2">
                  SSE / MCP Usage
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Connect your MCP client to <code>https://mcph.io/sse</code>{" "}
                  for real-time artifact access and tool usage.
                </p>
                <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-100 p-2 rounded">
                  npx mcp-remote https://mcph.io/sse
                </pre>
              </div>
            </section>

            {/* Limits & Errors */}
            <section id="limits" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                Limits & Errors
              </h2>
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Rate Limits</h3>
                <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                  <li>
                    <strong>Uploads:</strong> 20 per 10 minutes per IP
                  </li>
                  <li>
                    <strong>Downloads:</strong> 100 per minute per IP
                  </li>
                  <li>
                    <strong>SSE:</strong> 10 requests per 10 seconds per IP
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">
                  Common Error Codes
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <tbody className="text-gray-600">
                      <tr className="border-b">
                        <td className="py-2 pr-8">400</td>
                        <td>Invalid or malformed request</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-8">404</td>
                        <td>Artifact not found</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-8">410</td>
                        <td>Artifact expired</td>
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
