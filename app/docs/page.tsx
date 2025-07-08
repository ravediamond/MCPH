"use client";

import React from "react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            MCPH Documentation
          </h1>
          <p className="text-gray-600">
            Learn how to use MCPH to share AI-generated content with anyone,
            anywhere.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            What is MCPH?
          </h2>
          <p className="text-gray-600 mb-3">
            <b>MCPH</b> is an AI artifact storage and sharing system that lets
            you package your AI-generated content in crates. It provides
            permanent storage for your artifacts and auto-expiry for guest
            uploads. It works with ChatGPT, Claude, and other AI tools that
            support the Model Context Protocol (MCP).
          </p>
          <p className="text-gray-600 mb-3">With MCPH, you can:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-3">
            <li>
              <b>Share AI outputs</b> with anyone via a simple link - no login
              required to view
            </li>
            <li>
              <b>Store multiple content types</b> including markdown, code,
              JSON, images, text, YAML, and binary files
            </li>
            <li>
              <b>Integrate directly with AI tools</b> so you can create and
              share without manual uploads
            </li>
            <li>
              <b>Password-protect sensitive content</b> with a simple security
              option
            </li>
          </ul>

          {/* Why crate? call-out box */}
          <div className="bg-beige-100 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-amber-800 mb-2">
              Why "crate"?
            </h3>
            <p className="text-gray-700 mb-2">
              We use the term "crate" to describe the shareable artifacts in
              MCPH:
            </p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>
                <b>Files</b> are raw digital content with specific formats
                (e.g., .md, .jpg, .json)
              </li>
              <li>
                <b>Artifacts</b> are the AI-generated outputs you want to
                preserve and share
              </li>
              <li>
                <b>Crates</b> are these artifacts packaged with metadata, making
                them easy to discover, share, and use
              </li>
              <li>
                <b>Like a shipping crate</b>, they can be transported across
                systems and opened anywhere
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              <i>
                Looking for more details? Run <code>npx mcp-remote --help</code>{" "}
                for CLI information.
              </i>
            </p>
          </div>

          <p className="text-gray-600">
            MCPH is built on the{" "}
            <a
              href="https://github.com/cloudflare/agents/tree/main/examples/mcp"
              className="text-blue-500 hover:underline"
            >
              Model Context Protocol (MCP)
            </a>
            , which enables AI models to maintain and share context across
            interactions.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Using MCPH with AI Assistants
          </h2>
          <p className="text-gray-600 mb-3">
            MCPH tools integrate with AI assistants like Claude and ChatGPT to
            provide seamless file management through natural conversation. You
            can manage your files without learning commands or APIs—just speak
            naturally about what you want to do.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">
                Natural Language Commands
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-700">Managing Files:</p>
                  <ul className="list-disc pl-5 text-gray-600 text-sm">
                    <li>"Show me my files" / "List what I have stored"</li>
                    <li>
                      "Find my report about sales" / "Search for meeting notes"
                    </li>
                    <li>"Save this document" / "Store this analysis for me"</li>
                    <li>"Delete that old file" / "Remove the draft version"</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Sharing & Access:</p>
                  <ul className="list-disc pl-5 text-gray-600 text-sm">
                    <li>"Make this public" / "Share this with others"</li>
                    <li>
                      "Give me a shareable link" / "I want to share this
                      document"
                    </li>
                    <li>
                      "Make this private again" / "Stop sharing this file"
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Viewing Content:</p>
                  <ul className="list-disc pl-5 text-gray-600 text-sm">
                    <li>"Show me that document" / "Open my project notes"</li>
                    <li>"What's in that file?" / "Display the contract"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">
                Contextual Understanding
              </h3>
              <p className="text-gray-600 mb-2">
                The AI remembers what you're working on within conversations:
              </p>
              <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">User:</span> "Write a meeting
                  summary"
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">AI:</span> [Creates summary]
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">User:</span> "Save it"
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">AI:</span> "I've saved your
                  meeting summary to your files"
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">User:</span> "Actually, share it
                  with the team"
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">AI:</span> "Made it public.
                  Here's the link: https://mcph.io/crate/..."
                </p>
              </div>
            </div>
          </div>

          <div className="bg-beige-100 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-amber-800 mb-2">
              Key Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>
                  <b>No learning curve</b> - talk about files naturally
                </li>
                <li>
                  <b>Persistent storage</b> - files remain accessible across
                  sessions indefinitely for authenticated users, 7 days for
                  anonymous uploads
                </li>
                <li>
                  <b>Smart search</b> - AI finds files using keywords and
                  context
                </li>
              </ul>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>
                  <b>Instant sharing</b> - generate public links with simple
                  requests
                </li>
                <li>
                  <b>Cross-session continuity</b> - reference files from
                  previous conversations
                </li>
                <li>
                  <b>Automatic organization</b> - files are tagged with metadata
                  for easy retrieval
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Core Platform Features
          </h2>

          {/* Context Engineering Hub */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-start mb-3">
              <span className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg mr-3 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </span>
              <div>
                <h3 className="font-medium text-gray-800 text-lg">
                  Context Engineering Hub
                </h3>
                <p className="text-gray-600 mb-3">
                  Serve each model everything it needs to complete its tasks.
                </p>
              </div>
            </div>
            <div className="pl-12">
              <p className="text-gray-600 mb-3">
                While MCPH doesn't currently offer a dedicated UI for context
                engineering, its MCP-based infrastructure provides the essential
                foundation for creating and managing AI context. The platform's
                storage capabilities enable you to build your own context
                engineering workflows.
              </p>
              <h4 className="font-medium text-gray-700 mb-2">
                Current capabilities:
              </h4>
              <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-3">
                <li>
                  Store structured context data as Markdown, JSON, or YAML in a
                  searchable format
                </li>
                <li>
                  Access saved context across different AI tools through the
                  shared MCP layer
                </li>
                <li>
                  Organize artifacts with metadata to facilitate context
                  retrieval
                </li>
                <li>
                  Enable AI tools to search and retrieve precisely the context
                  pieces they need
                </li>
                <li>
                  Maintain version history of your context data through the
                  artifact storage system
                </li>
              </ul>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                <h5 className="font-medium text-gray-700 mb-1">
                  Use case example
                </h5>
                <p className="text-sm text-gray-600">
                  Store your company style guide, product specifications, and
                  brand voice as separate artifacts in MCPH. AI tools can then
                  selectively access these through MCP when needed for content
                  generation, ensuring consistency across different models.
                </p>
              </div>
            </div>
          </div>

          {/* Persistent Artifact Storage */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-start mb-3">
              <span className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg mr-3 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <path d="M17 14v6"></path>
                </svg>
              </span>
              <div>
                <h3 className="font-medium text-gray-800 text-lg">
                  Persistent Artifact Storage
                </h3>
                <p className="text-gray-600 mb-3">
                  Every artifact, safe and searchable.
                </p>
              </div>
            </div>
            <div className="pl-12">
              <p className="text-gray-600 mb-3">
                Never lose an AI-generated artifact again. Our storage system
                preserves your valuable AI outputs with powerful organization
                and retrieval capabilities.
              </p>
              <h4 className="font-medium text-gray-700 mb-2">
                Key capabilities:
              </h4>
              <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-3">
                <li>
                  Preservation of all AI outputs—from text to code to images
                </li>
                <li>Automatic versioning to track changes over time</li>
                <li>Rich metadata tagging for better organization</li>
                <li>Powerful semantic search for instant retrieval</li>
                <li>
                  7-day storage for guest users; permanent storage for
                  registered users
                </li>
                <li>
                  Support for various file formats including markdown, code,
                  JSON, YAML, text, images, and binary files
                </li>
              </ul>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                <h5 className="font-medium text-gray-700 mb-1">
                  Use case example
                </h5>
                <p className="text-sm text-gray-600">
                  Store all AI-generated code snippets with proper tagging and
                  search capabilities, allowing your team to build a searchable
                  knowledge base of solutions that grows over time.
                </p>
              </div>
            </div>
          </div>

          {/* Seamless Share Links */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-start mb-3">
              <span className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg mr-3 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </span>
              <div>
                <h3 className="font-medium text-gray-800 text-lg">
                  Seamless Share Links
                </h3>
                <p className="text-gray-600 mb-3">
                  One short link opens for humans and AI tools—no copy-paste
                  pain.
                </p>
              </div>
            </div>
            <div className="pl-12">
              <p className="text-gray-600 mb-3">
                Share your AI artifacts with a single, universal link that works
                for both humans and AI systems, eliminating friction in your
                workflows.
              </p>
              <h4 className="font-medium text-gray-700 mb-2">
                Key capabilities:
              </h4>
              <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-3">
                <li>Generate short, memorable URLs for any artifact</li>
                <li>Links open directly in browsers for human viewers</li>
                <li>
                  Same links can be referenced by AI tools through our API
                </li>
                <li>No authentication required to view shared content</li>
                <li>Optional password protection for sensitive information</li>
                <li>
                  Customizable privacy settings (public, private, or
                  password-protected)
                </li>
              </ul>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                <h5 className="font-medium text-gray-700 mb-1">
                  Use case example
                </h5>
                <p className="text-sm text-gray-600">
                  Generate a complex data visualization with AI, then share it
                  with both your analytics team (who will view it in a browser)
                  and your reporting AI (which will extract insights directly
                  via API)—all using the same link.
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Agent Relay */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-start mb-3">
              <span className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg mr-3 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
              </span>
              <div>
                <h3 className="font-medium text-gray-800 text-lg">
                  Multi-Agent Relay
                </h3>
                <p className="text-gray-600 mb-3">
                  All AI tools—Claude, ChatGPT, Gemini—can write and access the
                  same artifacts.
                </p>
              </div>
            </div>
            <div className="pl-12">
              <p className="text-gray-600 mb-3">
                MCPH provides the foundation for AI collaboration through shared
                artifacts. While not directly orchestrating multi-agent
                workflows, the platform enables different AI systems to access
                the same content through standardized MCP connections.
              </p>
              <h4 className="font-medium text-gray-700 mb-2">
                Current capabilities:
              </h4>
              <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-3">
                <li>Universal artifact access by any MCP-compatible AI tool</li>
                <li>
                  Consistent data format and accessibility across different AI
                  providers
                </li>
                <li>
                  Shared storage layer that maintains artifact integrity between
                  different model interactions
                </li>
                <li>
                  Support for major AI platforms that implement the MCP standard
                </li>
                <li>
                  Persistent artifacts that remain accessible across sessions
                  and different AI tools
                </li>
                <li>
                  API-based access that enables programmatic multi-agent
                  workflows
                </li>
              </ul>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                <h5 className="font-medium text-gray-700 mb-1">
                  Use case example
                </h5>
                <p className="text-sm text-gray-600">
                  Store a complex data analysis in MCPH using Claude, then share
                  the artifact link with a ChatGPT instance that can access and
                  build upon the same content—creating an asynchronous
                  collaboration between different AI systems without data
                  transfer friction.
                </p>
              </div>
            </div>
          </div>

          {/* Native MCP Integration */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex items-start mb-3">
              <span className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg mr-3 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14l2 2 4-4"></path>
                </svg>
              </span>
              <div>
                <h3 className="font-medium text-gray-800 text-lg">
                  Native MCP Integration
                </h3>
                <p className="text-gray-600 mb-3">
                  Fully integrated with compatible AI tools and usable directly
                  by them.
                </p>
              </div>
            </div>
            <div className="pl-12">
              <p className="text-gray-600 mb-3">
                Built on the Model Context Protocol (MCP) standard, our platform
                is designed for direct integration with AI systems without
                requiring custom code or workarounds.
              </p>
              <h4 className="font-medium text-gray-700 mb-2">
                Key capabilities:
              </h4>
              <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-3">
                <li>Direct integration with MCP-compatible AI systems</li>
                <li>No custom code or workarounds required</li>
                <li>Models can autonomously store and retrieve information</li>
                <li>
                  Standardized API for consistent interaction across different
                  tools
                </li>
                <li>Forward compatibility with future MCP enhancements</li>
                <li>Support for emerging AI capabilities as they develop</li>
              </ul>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                <h5 className="font-medium text-gray-700 mb-1">
                  Use case example
                </h5>
                <p className="text-sm text-gray-600">
                  Create an autonomous research assistant that can store its
                  findings, retrieve them when needed, and share them with other
                  tools—all without requiring human intervention for the storage
                  and retrieval processes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Features</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-4">
            <li>
              <span className="font-medium">Content Type Support</span>
              <p className="text-sm text-gray-600 mt-1">
                Store and share multiple content types in a standardized format:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                <li>
                  <b>Markdown</b> - documentation, notes, and formatted text
                </li>
                <li>
                  <b>Code</b> - source code with syntax highlighting
                </li>
                <li>
                  <b>JSON</b> - structured data for easy parsing
                </li>
                <li>
                  <b>YAML</b> - configuration files and structured data
                </li>
                <li>
                  <b>Text</b> - plain text files (.txt)
                </li>
                <li>
                  <b>Images</b> - diagrams, screenshots, and visual content
                </li>
                <li>
                  <b>Binary files</b> - PDFs, spreadsheets, and other documents
                </li>
              </ul>
            </li>

            <li>
              <span className="font-medium">Security & Privacy</span>
              <p className="text-sm text-gray-600 mt-1">
                Control who can access your content:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                <li>
                  <b>Private by default</b> - content is only visible to you
                  unless explicitly shared
                </li>
                <li>
                  <b>Password protection</b> - add an extra layer of security
                  for sensitive content
                </li>
                <li>
                  <b>Temporary access</b> - anonymous uploads expire after 30
                  days
                </li>
                <li>
                  <b>Permanent personal storage</b> - authenticated users get
                  persistent storage
                </li>
              </ul>
            </li>

            <li>
              <span className="font-medium">AI Integration</span>
              <p className="text-sm text-gray-600 mt-1">
                Seamlessly work with AI assistants:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                <li>
                  <b>Natural language interface</b> - manage files through
                  simple conversation
                </li>
                <li>
                  <b>Context awareness</b> - AI understands what files you're
                  working with
                </li>
                <li>
                  <b>Cross-session continuity</b> - reference your content
                  across multiple AI sessions
                </li>
                <li>
                  <b>Direct generation & storage</b> - create and save content
                  in one step
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Anonymous vs. Logged-in Users
          </h2>
          <p className="text-gray-600 mb-3">
            MCPH offers different capabilities depending on whether you are
            logged in or using the service anonymously.
          </p>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">Feature</th>
                <th className="border-b p-2">Anonymous Users</th>
                <th className="border-b p-2">Logged-in Users</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b p-2">Download Crates</td>
                <td className="border-b p-2 text-green-500">✓</td>
                <td className="border-b p-2 text-green-500">✓</td>
              </tr>
              <tr>
                <td className="border-b p-2">Upload Crates</td>
                <td className="border-b p-2 text-red-500">✗</td>
                <td className="border-b p-2 text-green-500">✓</td>
              </tr>
              <tr>
                <td className="border-b p-2">Search Crates</td>
                <td className="border-b p-2 text-red-500">✗</td>
                <td className="border-b p-2 text-green-500">✓</td>
              </tr>
              <tr>
                <td className="border-b p-2">Delete Crates</td>
                <td className="border-b p-2 text-red-500">✗</td>
                <td className="border-b p-2 text-green-500">✓</td>
              </tr>
              <tr>
                <td className="border-b p-2">Manage API Keys</td>
                <td className="border-b p-2 text-red-500">✗</td>
                <td className="border-b p-2 text-green-500">✓</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">
            <i>
              Anonymous users can only download public crates. Logged-in users
              can manage their own crates and API keys.
            </i>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Getting Started
          </h2>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-gray-700 font-medium">Quick Reference</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
              <li>
                <b>Web Interface:</b>{" "}
                <a
                  href="https://mcph.io"
                  className="text-blue-500 hover:underline"
                >
                  mcph.io
                </a>
              </li>
              <li>
                <b>MCP Endpoint:</b> <code>https://api.mcph.io/mcp</code>
              </li>
              <li>
                <b>View Shared Content:</b>{" "}
                <code>https://mcph.io/crate/[id]</code>
              </li>
            </ul>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Step 1: Create an Account
          </h3>
          <p className="text-gray-600 mb-4">
            Visit{" "}
            <a href="https://mcph.io" className="text-blue-500 hover:underline">
              mcph.io
            </a>{" "}
            and sign up for a free account. After logging in, navigate to the
            API Keys section to generate your personal API key. You'll need this
            to connect AI tools to your MCPH account.
          </p>

          <div className="bg-beige-100 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-amber-800 mb-2">
              For Non-Logged In Users
            </h3>
            <p className="text-gray-700 mb-2">
              You can use MCPH without creating an account, but with some
              limitations:
            </p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>
                <b>Anonymous uploads</b> are available through AI assistants
                that support MCP
              </li>
              <li>
                <b>7-day expiration</b> - your content will be automatically
                deleted after 7 days
              </li>
              <li>
                <b>Limited management</b> - you can't search, organize, or
                manage your files
              </li>
              <li>
                <b>No MCP all tools access</b> - you can only use the crates_get
                tool to get a crate by its ID. You cannot use the other tools.
              </li>
            </ul>
            <p className="text-gray-700 mt-2">
              To get the most out of MCPH, we recommend creating a free account.
            </p>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Step 2: Connect Your AI Tool
          </h3>
          <p className="text-gray-600 mb-3">
            MCPH works with any AI tool that supports the Model Context Protocol
            (MCP). The basic steps for connecting any AI tool are:
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-700 mb-2">
              Essential Information
            </h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>
                <b>Get the MCP URL:</b> <code>https://api.mcph.io/mcp</code>
                <p className="text-sm text-gray-600 mt-1">
                  This is the endpoint you'll need to configure in your AI tool.
                </p>
              </li>
              <li>
                <b>Get your API Key:</b>{" "}
                <span className="text-gray-600">
                  Available from your MCPH account dashboard
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Log in to{" "}
                  <a
                    href="https://mcph.io"
                    className="text-blue-500 hover:underline"
                  >
                    mcph.io
                  </a>{" "}
                  and navigate to the API Keys section to generate or retrieve
                  your key.
                </p>
              </li>
              <li>
                <b>Configure your AI tool:</b>{" "}
                <span className="text-gray-600">
                  Set up the MCP server in your tool's settings
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Each AI tool has a different configuration process. Most tools
                  have a dedicated section for MCP server configuration where
                  you'll enter the URL and API key.
                </p>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-amber-800 mb-2">Key Notes</h4>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>
                The specific configuration steps vary by tool (ChatGPT, Claude,
                custom AI applications, etc.)
              </li>
              <li>
                Anonymous uploads are stored for 30 days, while authenticated
                user uploads have no expiration
              </li>
              <li>All generated download links expire in 24 hours</li>
            </ul>
            <p className="mt-3 text-sm">
              For detailed, tool-specific configuration instructions, please
              visit our{" "}
              <Link
                href="/integrations"
                className="text-blue-500 hover:underline"
              >
                Integrations page
              </Link>
              . There you'll find step-by-step guides for all major AI tools
              that support MCP.
            </p>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Step 3: Create and Share Content
          </h3>
          <p className="text-gray-600 mb-3">
            Once connected, you can ask your AI to create and share content via
            MCPH. For example:
          </p>

          <div className="bg-gray-100 p-3 rounded-lg mb-4 text-gray-700 text-sm">
            "Create a markdown guide explaining user authentication best
            practices and share it via MCPH."
          </div>

          <p className="text-gray-600 mb-3">
            The AI will create the content and provide you with a shareable link
            that looks like:
            <code className="ml-2 text-blue-600">
              https://mcph.io/crate/abc123
            </code>
          </p>

          <p className="text-gray-600">
            Share this link with anyone - they don't need an account to view the
            content.
          </p>

          <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-gray-700 font-medium mb-2">Next Steps</p>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <Link
                href="/upload"
                className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300"
              >
                <div className="text-blue-600 mr-3">
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Upload Content Manually
                  </p>
                  <p className="text-xs text-gray-600">
                    Upload crates through the web interface
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            Available MCP Tools
          </h2>
          <p className="text-gray-600 mb-4">
            MCPH provides a comprehensive set of powerful tools that enable you
            to manage your content through the Model Context Protocol (MCP).
            These tools can be used programmatically or through AI assistants
            using natural language commands.
          </p>

          <div className="space-y-6">
            {/* Content Management Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">
                Content Management
              </h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_list</h4>
                  <p className="text-sm text-gray-600">
                    List and discover your stored crates
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Pagination support, category
                    filtering (including 'feedback' templates), tag-based
                    organization
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "List my crates", "Show my
                    feedback templates", "Find my recent uploads"
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_get</h4>
                  <p className="text-sm text-gray-600">
                    Retrieve and display crate contents
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Supports all content types,
                    handles password-protected crates, rich metadata access
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Show me crate abc123", "Get the
                    content of that document", "Display my project specs"
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_upload</h4>
                  <p className="text-sm text-gray-600">
                    Create and store new content with smart tagging
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Intelligent categorization,
                    tagging best practices, dual upload methods, expiration
                    handling
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Upload this file as a crate
                    titled 'Project Requirements'", "Save this with tags
                    project:webapp, type:specs"
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_update</h4>
                  <p className="text-sm text-gray-600">
                    Modify existing crate metadata and content
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Update any crate property, manage
                    sharing settings, modify templates (open/close status)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Update the title of crate
                    abc123", "Add tags to my project crate", "Make my template
                    private"
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_delete</h4>
                  <p className="text-sm text-gray-600">
                    Remove unwanted crates permanently
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Complete removal of content and
                    metadata, irreversible operation
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Delete crate abc123", "Remove
                    that old document", "Clean up my test files"
                  </p>
                </div>
              </div>
            </div>

            {/* Sharing & Access Control Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">
                Sharing & Access Control
              </h3>
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_share</h4>
                  <p className="text-sm text-gray-600">
                    Make content accessible to others with advanced options
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Public/private toggle, password
                    protection, shareable URLs, access control
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Make crate abc123 public",
                    "Share this with password protection", "Generate a share
                    link"
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <h4 className="font-medium text-gray-700">
                    crates_make_public
                  </h4>
                  <p className="text-sm text-gray-600">
                    Quick public sharing for immediate access
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> One-click public sharing, instant
                    shareable URL generation
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Make this public", "Share this
                    crate publicly", "Generate public link"
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_unshare</h4>
                  <p className="text-sm text-gray-600">
                    Remove public access and return to private
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Complete privacy restoration,
                    removes public access and passwords
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Make crate abc123 private",
                    "Remove public access", "Unshare this document"
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <h4 className="font-medium text-gray-700">
                    crates_get_download_link
                  </h4>
                  <p className="text-sm text-gray-600">
                    Generate secure, time-limited download URLs
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Configurable expiration, secure
                    signed URLs, direct download support
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Create download link for crate
                    abc123", "Generate 1-hour access URL"
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <h4 className="font-medium text-gray-700">crates_copy</h4>
                  <p className="text-sm text-gray-600">
                    Duplicate public crates to your collection
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Features:</strong> Complete duplication, removes
                    "Copy of" prefix, converts to private ownership
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>AI Usage:</strong> "Copy this public crate", "Save a
                    copy of crate abc123 to my collection"
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Search & Discovery Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">
                Advanced Search & Discovery
              </h3>
              <div className="border-l-4 border-purple-500 pl-3">
                <h4 className="font-medium text-gray-700">crates_search</h4>
                <p className="text-sm text-gray-600">
                  Find content using intelligent hybrid search
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    <strong>Features:</strong>
                  </p>
                  <ul className="text-xs text-gray-500 list-disc list-inside ml-2 space-y-1">
                    <li>
                      Semantic search with vector embeddings for metadata
                      understanding
                    </li>
                    <li>
                      Tag-based filtering with hierarchical support
                      (project:webapp, type:docs)
                    </li>
                    <li>
                      Category filtering (including feedback templates:
                      category: 'feedback')
                    </li>
                    <li>Relevance scoring and intelligent ranking</li>
                    <li>
                      Full-text search across titles, descriptions, and tags
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  <strong>AI Usage:</strong> "Find my React components", "Search
                  for project documentation", "Find feedback templates about
                  mobile apps"
                </p>
                <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Advanced Search Tips:
                  </p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    <li>
                      • Use tags: ["project:website", "status:final"] for
                      precise filtering
                    </li>
                    <li>
                      • Conventional tags like project:, type:, status: receive
                      relevance boosting
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Feedback Collection System Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">
                Feedback Collection System
              </h3>
              <div className="space-y-3">
                <div className="border-l-4 border-orange-500 pl-3">
                  <h4 className="font-medium text-gray-700">
                    feedback_template_create
                  </h4>
                  <p className="text-sm text-gray-600">
                    Build custom feedback forms with validation
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      <strong>Features:</strong>
                    </p>
                    <ul className="text-xs text-gray-500 list-disc list-inside ml-2 space-y-1">
                      <li>
                        6 field types: text, number, boolean, select,
                        multiselect, rating
                      </li>
                      <li>
                        Custom validation rules, required/optional fields,
                        dropdown options
                      </li>
                      <li>
                        Automatic storage as both feedback template AND crate
                        (category: 'feedback')
                      </li>
                      <li>
                        Tag-based organization, public/private templates, linked
                        crate references
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Limits:</strong> 5 templates per user (Free), 50
                      templates (Pro)
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    <strong>AI Usage:</strong> "Create feedback form for product
                    reviews", "Build survey with rating and text fields"
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-3">
                  <h4 className="font-medium text-gray-700">feedback_submit</h4>
                  <p className="text-sm text-gray-600">
                    Submit responses to feedback templates with validation
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      <strong>Features:</strong>
                    </p>
                    <ul className="text-xs text-gray-500 list-disc list-inside ml-2 space-y-1">
                      <li>
                        Field-specific validation (type checking, required
                        fields, option validation)
                      </li>
                      <li>
                        Support for all field types with proper formatting
                      </li>
                      <li>
                        Anonymous submissions supported, metadata tracking
                      </li>
                      <li>Real-time validation with helpful error messages</li>
                    </ul>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    <strong>AI Usage:</strong> "Submit feedback to template
                    abc123", "Fill out the product survey"
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-3">
                  <h4 className="font-medium text-gray-700">
                    feedback_responses_get
                  </h4>
                  <p className="text-sm text-gray-600">
                    Analyze feedback data with comprehensive analytics
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      <strong>Features:</strong>
                    </p>
                    <ul className="text-xs text-gray-500 list-disc list-inside ml-2 space-y-1">
                      <li>
                        Complete response analytics: averages, distributions,
                        response rates
                      </li>
                      <li>
                        Field-specific statistics (ratings, selections, text
                        analysis)
                      </li>
                      <li>
                        User identification with email/name display (when
                        available)
                      </li>
                      <li>
                        Pagination support for large datasets, export-ready
                        format
                      </li>
                      <li>Comprehensive insights for data-driven decisions</li>
                    </ul>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    <strong>AI Usage:</strong> "Show responses for my feedback
                    template", "Analyze survey results", "Get feedback
                    analytics"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">
            How the MCP Endpoint Works
          </h2>
          <p className="text-gray-600 mb-3">
            The <b>MCP endpoint</b> (<code>/mcp</code>) is the only supported
            way to interact with MCPH programmatically. It uses the Model
            Context Protocol (MCP) over Streamable HTTP for real-time,
            bidirectional communication.
          </p>
          <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
            <li>
              <b>Connect via Streamable HTTP:</b> Use{" "}
              <code>npx mcp-remote https://api.mcph.io/mcp</code> or configure
              your client to use the endpoint.
            </li>
            <li>
              <b>Authentication:</b> Pass your API key as a Bearer token in the{" "}
              <code>Authorization</code> header.
            </li>
            <li>
              <b>Session:</b> On connect, you receive a session ID in the{" "}
              <code>MCP-Session-ID</code> response header. All subsequent
              requests must include this ID in the <code>MCP-Session-ID</code>{" "}
              header.
            </li>
            <li>
              <b>Calling Tools:</b> Send JSON-RPC requests to the endpoint.
              Example for <code>crates/list</code>:
              <pre className="text-xs bg-gray-100 p-2 rounded text-blue-700 whitespace-pre-wrap">{`
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "crates/list",
    "arguments": {}
  }
}
`}</pre>
              <span className="text-xs text-gray-500">
                The response will be streamed using Streamable HTTP, with
                content delivered as chunks in the HTTP response.
              </span>
            </li>
          </ol>
          <p className="text-gray-600 mb-3">
            For more details, see the{" "}
            <a
              href="https://www.npmjs.com/package/mcp-remote"
              className="text-blue-500 hover:underline"
            >
              mcp-remote documentation
            </a>{" "}
            or the{" "}
            <a
              href="https://github.com/cloudflare/agents/tree/main/examples/mcp"
              className="text-blue-500 hover:underline"
            >
              MCP protocol reference
            </a>
            .
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Learn More</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li>
              <a
                href="https://github.com/cloudflare/agents/tree/main/examples/mcp"
                className="text-blue-500 hover:underline"
              >
                MCP Protocol Overview
              </a>
            </li>
            <li>
              <a
                href="https://www.npmjs.com/package/mcp-remote"
                className="text-blue-500 hover:underline"
              >
                mcp-remote npm package
              </a>
            </li>
            <li>
              <a
                href="https://mcph.io"
                className="text-blue-500 hover:underline"
              >
                mcph.io
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
