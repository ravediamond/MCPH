"use client";

import React from "react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            MCPH: Model Context Protocol (MCP) Usage and Docs
          </h1>
          <p className="text-gray-600">
            Public remote artifact server and tools for the Model Context Protocol (MCP).
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">What is MCP?</h2>
          <p className="text-gray-600 mb-3">
            <b>Model Context Protocol (MCP)</b> is a standard for AI models, agents, and tools to maintain, share, and reference context and artifacts across interactions. MCP enables persistent, portable context and secure sharing of files and data.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">About MCPH</h2>
          <p className="text-gray-600 mb-3">
            MCPH is a public remote MCP server for storing and sharing artifacts (files, data, diagrams, etc.) using the MCP protocol. It supports real-time streaming via SSE (Server-Sent Events) and secure artifact management.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li><b>SSE endpoint:</b> <code>https://mcph.io/api/sse</code></li>
            <li><b>Web UI:</b> <a href="https://mcph.io" className="text-blue-500 hover:underline">mcph.io</a></li>
            <li><b>Artifact page:</b> <code>https://mcph.io/artifact/[id]</code></li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">How to Connect</h2>
          <p className="text-gray-600 mb-3">
            To use MCPH with your AI tools or clients, you need to connect to the official SSE endpoint. You can do this using the <code>mcp-remote</code> CLI or by configuring your client (such as Claude Desktop, Cursor, or other MCP-compatible tools).
          </p>
          <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
            <li>
              <b>Install <code>mcp-remote</code>:</b>
              <pre className="text-xs text-blue-700 bg-gray-100 p-2 rounded mt-1 mb-2">npm install -g mcp-remote</pre>
              Or use <code>npx</code> for one-off usage (no install needed).
            </li>
            <li>
              <b>Connect to MCPH:</b>
              <pre className="text-xs text-blue-700 bg-gray-100 p-2 rounded mt-1 mb-2">npx mcp-remote https://mcph.io/api/sse</pre>
              This will connect your local client to the MCPH SSE endpoint.
            </li>
            <li>
              <b>Advanced: Configure in your MCP client (with Authorization header):</b>
              <p className="text-gray-600 text-sm mb-2">You can add MCPH as a remote server in your client configuration. For example:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded text-blue-700 whitespace-pre-wrap">{`
{
  "mcpServers": {
    "MCPH": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcph.io/api/sse",
        "--header",
        "Authorization: Bearer $\{AUTH_TOKEN}\""
      ]
    }
  },
  "env": {
    "AUTH_TOKEN": "your_token_here"
  }
}
`}
              </pre>
              <p className="text-gray-600 text-sm">Replace <code>your_token_here</code> with your actual API token if required. This allows secure, authenticated access to the MCPH server.</p>
            </li>
          </ol>
          <p className="text-gray-600 mb-3">
            For more details, see the <a href="https://www.npmjs.com/package/mcp-remote" className="text-blue-500 hover:underline">mcp-remote documentation</a>.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Available MCP Tools</h2>
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-gray-800">artifacts/list</div>
              <div className="text-gray-600">List all available artifacts you have access to.</div>
              <pre className="bg-gray-100 text-xs rounded p-2 mt-1 overflow-x-auto"><code>{`Output:
{
  artifacts: [ { id, fileName, ... }, ... ],
  content: [ { type: 'text', text: 'IDs: ...' } ]
}`}</code></pre>
            </div>
            <div>
              <div className="font-semibold text-gray-800">artifacts/get</div>
              <div className="text-gray-600">Get the raw artifact data for a specific artifact by id.</div>
              <pre className="bg-gray-100 text-xs rounded p-2 mt-1 overflow-x-auto"><code>{`Output:
{
  artifact: { ...meta },
  content: [ { type: 'text', text: '...' } ]
}
// For binary files, returns a temporary download link; for text, returns the content directly.`}</code></pre>
            </div>
            <div>
              <div className="font-semibold text-gray-800">artifacts/get_metadata</div>
              <div className="text-gray-600">Get all metadata fields as text for a specific artifact by id.</div>
              <pre className="bg-gray-100 text-xs rounded p-2 mt-1 overflow-x-auto"><code>{`Output:
{
  artifact: { ...meta },
  content: [ { type: 'text', text: 'key: value\n...' } ]
}`}</code></pre>
            </div>
            <div>
              <div className="font-semibold text-gray-800">artifacts/search</div>
              <div className="text-gray-600">Search for artifacts by query string in fileName or description.</div>
              <pre className="bg-gray-100 text-xs rounded p-2 mt-1 overflow-x-auto"><code>{`Output:
{
  artifacts: [ ... ],
  content: [ { type: 'text', text: 'IDs: ...' } ]
}`}</code></pre>
            </div>
            <div>
              <div className="font-semibold text-gray-800">artifacts/upload</div>
              <div className="text-gray-600">Upload a new artifact. For binary files, returns a presigned upload URL. For text, uploads directly.</div>
              <pre className="bg-gray-100 text-xs rounded p-2 mt-1 overflow-x-auto"><code>{`Output (binary):
{
  uploadUrl, fileId, gcsPath, message
}
Output (text):
{
  artifact, message
}`}</code></pre>
            </div>
            <div>
              <div className="font-semibold text-gray-800">artifacts/share</div>
              <div className="text-gray-600">Make an artifact shareable (public link) and optionally set/remove a password.</div>
              <pre className="bg-gray-100 text-xs rounded p-2 mt-1 overflow-x-auto"><code>{`Output:
{
  id, isShared, password, shareUrl, message
}`}</code></pre>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">How to Remove an MCP (Delete Artifacts)</h2>
          <p className="text-gray-600 mb-3">
            Use the <b>artifacts/delete</b> tool via MCP, or the REST API <code>DELETE /api/uploads/:id</code> if you are authorized.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">How the SSE Endpoint Works</h2>
          <p className="text-gray-600 mb-3">
            The <b>SSE endpoint</b> (<code>/api/sse</code>) is the only supported way to interact with MCPH programmatically. It uses the Model Context Protocol (MCP) over Server-Sent Events for real-time, bidirectional communication.
          </p>
          <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
            <li>
              <b>Connect via SSE:</b> Use <code>npx mcp-remote https://mcph.io/api/sse</code> or configure your client to use the endpoint.
            </li>
            <li>
              <b>Authentication:</b> Pass your API key as a Bearer token in the <code>Authorization</code> header.
            </li>
            <li>
              <b>Session:</b> On connect, you receive an <code>endpoint</code> event with your session URL. All JSON-RPC requests must include your <code>sessionId</code> as a query parameter.
            </li>
            <li>
              <b>Calling Tools:</b> Send JSON-RPC requests to the endpoint. Example for <code>artifacts/list</code>:
              <pre className="text-xs bg-gray-100 p-2 rounded text-blue-700 whitespace-pre-wrap">{`
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "artifacts/list",
    "arguments": {}
  }
}
`}</pre>
              <span className="text-xs text-gray-500">The response will be streamed as an SSE <code>message</code> event with the result.</span>
            </li>
          </ol>
          <p className="text-gray-600 mb-3">
            For more details, see the <a href="https://www.npmjs.com/package/mcp-remote" className="text-blue-500 hover:underline">mcp-remote documentation</a> or the <a href="https://github.com/cloudflare/agents/tree/main/examples/mcp" className="text-blue-500 hover:underline">MCP protocol reference</a>.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Learn More</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li><a href="https://github.com/cloudflare/agents/tree/main/examples/mcp" className="text-blue-500 hover:underline">MCP Protocol Overview</a></li>
            <li><a href="https://www.npmjs.com/package/mcp-remote" className="text-blue-500 hover:underline">mcp-remote npm package</a></li>
            <li><a href="https://mcph.io" className="text-blue-500 hover:underline">mcph.io</a></li>
          </ul>
        </div>

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
            <a
              href="#sse"
              className="block text-primary-500 hover:text-primary-600 py-1"
            >
              SSE Endpoint: mcph.io/api/sse
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
