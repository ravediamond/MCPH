"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Home, Menu, X } from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation items
  const navItems = [
    { id: "what-is-mcph", title: "What is MCPH?" },
    { id: "ai-assistants", title: "Using with AI Assistants" },
    { id: "features", title: "Features" },
    { id: "getting-started", title: "Getting Started" },
    { id: "mcp-tools", title: "Available MCP Tools" },
    { id: "mcp-endpoint", title: "How MCP Endpoint Works" },
    { id: "learn-more", title: "Learn More" },
  ];

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsSidebarOpen(false); // Close mobile sidebar
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Set initial active section
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);
  return (
    <div
      className="bg-gray-50 min-h-screen"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Documentation</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-6 overflow-y-auto h-full pb-20">
          <ul className="space-y-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                    activeSection === item.id
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        <div className="py-8 px-4 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-md shadow-md border border-gray-200 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb navigation */}
            <nav className="mb-8">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Link
                  href="/"
                  className="inline-flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 hover:shadow-sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="inline-flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium">
                  Documentation
                </span>
              </div>
            </nav>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  MCPH Documentation
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Save and share anything from your AI chats with permanent links
                </p>
              </div>
            </div>

            <div
              id="what-is-mcph"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                What is MCPH?
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                <b>MCPH</b> (Model Context Protocol Hub) is an AI artifact storage and sharing platform that 
                lets you save and share anything from your AI chats with permanent links. One click in Claude 
                or ChatGPT creates a shareable link that works everywhere.
              </p>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Key benefits:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-6 leading-relaxed">
                <li>
                  <b>Never lose AI creations</b> - Everything saved permanently and searchable
                </li>
                <li>
                  <b>Share with one link</b> - No login required for viewers to access content
                </li>
                <li>
                  <b>Works in Claude & ChatGPT</b> - Direct integration with your favorite AI tools
                </li>
                <li>
                  <b>Simple access model</b> - Upload requires login, viewing doesn't
                </li>
                <li>
                  <b>Complete AI workflow ecosystem</b> - Recipe, Text, Images, Code, Data, and Polls
                </li>
              </ul>

              {/* Why crate? call-out box */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                  <span className="bg-blue-100 p-2 rounded-lg mr-3">✨</span>
                  How It Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔑</div>
                    <h4 className="font-semibold text-gray-800 mb-1">1. Sign in with Google</h4>
                    <p className="text-sm text-gray-600">Quick setup - no passwords to remember</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔌</div>
                    <h4 className="font-semibold text-gray-800 mb-1">2. Connect to AI tools</h4>
                    <p className="text-sm text-gray-600">Works with Claude, ChatGPT, and others</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">💫</div>
                    <h4 className="font-semibold text-gray-800 mb-1">3. Save & share anything</h4>
                    <p className="text-sm text-gray-600">One command creates shareable links instantly</p>
                  </div>
                </div>
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

            <div
              id="ai-assistants"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                Using MCPH with AI Assistants
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                MCPH tools integrate with AI assistants like Claude and ChatGPT
                to provide seamless file management through natural
                conversation. You can manage your files without learning
                commands or APIs—just speak naturally about what you want to do.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 p-2 rounded-lg mr-3">💬</span>
                    Natural Language Commands
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-700">
                        Managing Files:
                      </p>
                      <ul className="list-disc pl-5 text-gray-600 text-sm">
                        <li>"Show me my files" / "List what I have stored"</li>
                        <li>
                          "Find my report about sales" / "Search for meeting
                          notes"
                        </li>
                        <li>
                          "Save this document" / "Store this analysis for me"
                        </li>
                        <li>
                          "Delete that old file" / "Remove the draft version"
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        Sharing & Access:
                      </p>
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
                      <p className="font-medium text-gray-700">
                        Viewing Content:
                      </p>
                      <ul className="list-disc pl-5 text-gray-600 text-sm">
                        <li>
                          "Show me that document" / "Open my project notes"
                        </li>
                        <li>"What's in that file?" / "Display the contract"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-green-100 p-2 rounded-lg mr-3">🧠</span>
                    Contextual Understanding
                  </h3>
                  <p className="text-gray-600 mb-2">
                    The AI remembers what you're working on within
                    conversations:
                  </p>
                  <div className="bg-white p-4 rounded-xl border border-green-200 text-sm shadow-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">User:</span> "Write a
                      meeting summary"
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
                      <span className="font-medium">User:</span> "Actually,
                      share it with the team"
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">AI:</span> "Made it public.
                      Here's the link: https://mcph.io/crate/..."
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                  <span className="bg-purple-100 p-2 rounded-lg mr-3">⭐</span>
                  Key Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>
                      <b>No learning curve</b> - talk about files naturally
                    </li>
                    <li>
                      <b>Persistent storage</b> - files remain accessible across
                      sessions indefinitely
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
                      <b>Automatic organization</b> - files are tagged with
                      metadata for easy retrieval
                    </li>
                  </ul>
                </div>
              </div>
            </div>


            <div
              id="features"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                  <div className="text-3xl mb-3">💾</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Never lose AI creations</h3>
                  <p className="text-gray-600">Everything you create in AI chats, saved permanently and searchable</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                  <div className="text-3xl mb-3">🔗</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Share with one link</h3>
                  <p className="text-gray-600">Turn any AI creation into a shareable link. No login required for viewers!</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Works in Claude & ChatGPT</h3>
                  <p className="text-gray-600">One command in your favorite AI tool saves everything instantly</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  🗂️ Complete AI Workflow Ecosystem
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📝</div>
                    <div className="font-medium text-gray-700">Text</div>
                    <div className="text-gray-500">Any written content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="font-medium text-gray-700">Images</div>
                    <div className="text-gray-500">Pictures, charts, diagrams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💻</div>
                    <div className="font-medium text-gray-700">Code</div>
                    <div className="text-gray-500">Scripts and programming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="font-medium text-gray-700">Data</div>
                    <div className="text-gray-500">Spreadsheets, JSONs, CSVs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🧾</div>
                    <div className="font-medium text-gray-700">Recipe</div>
                    <div className="text-gray-500">AI task instructions</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-800 mb-3 flex items-center">
                  <span className="bg-green-100 p-2 rounded-lg mr-3">🧾</span>
                  Recipe: AI Task Instructions
                </h3>
                <p className="text-gray-700 mb-4">
                  Recipes are structured, step-by-step instructions that tell AI agents exactly how to execute complex tasks. 
                  They serve as reusable workflows that can be shared across different AI tools and team members.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">🎯 Key Benefits:</h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>Consistent task execution across AI tools</li>
                      <li>Reusable workflows for complex processes</li>
                      <li>Team knowledge sharing and standardization</li>
                      <li>Reduced setup time for repetitive tasks</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📋 Common Examples:</h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>Content creation workflows</li>
                      <li>Data analysis procedures</li>
                      <li>Code review checklists</li>
                      <li>Customer support protocols</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-100">
                  <p className="text-sm text-gray-600">
                    <strong>Example:</strong> A "Blog Post Creation Recipe" might include steps for research, 
                    outline creation, writing, SEO optimization, and publishing - all documented in a way 
                    that any AI tool can follow consistently.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-800 mb-3 flex items-center">
                  <span className="bg-green-100 p-2 rounded-lg mr-3">🆓</span>
                  Free Account Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Up to 10MB file size</li>
                    <li>500MB total storage</li>
                    <li>10 shared crates maximum</li>
                    <li>5 feedback templates maximum</li>
                  </ul>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Permanent storage (no expiration)</li>
                    <li>Password protection for sensitive content</li>
                    <li>AES-256 encryption</li>
                    <li>Secure HTTPS access</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <span className="bg-blue-100 p-2 rounded-lg mr-3">🔗</span>
                  Simple Access Model
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">🔒 Upload = Login Required</h4>
                    <p className="text-sm text-gray-600">You need a Google account to save and organize your AI creations</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">🌐 View = No Login Needed</h4>
                    <p className="text-sm text-gray-600">Anyone with a public link can view shared content instantly</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="getting-started"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
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
                <a
                  href="https://mcph.io"
                  className="text-blue-500 hover:underline"
                >
                  mcph.io
                </a>{" "}
                and sign up for a free account. After logging in, navigate to
                the API Keys section to generate your personal API key. You'll
                need this to connect AI tools to your MCPH account.
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
                    <b>Secure uploads</b> are available through AI assistants
                    that support MCP
                  </li>
                  <li>
                    <b>Limited management</b> - you can't search, organize, or
                    manage your files
                  </li>
                  <li>
                    <b>No MCP all tools access</b> - you can only use the
                    crates_get tool to get a crate by its ID. You cannot use the
                    other tools.
                  </li>
                </ul>
                <p className="text-gray-700 mt-2">
                  To get the most out of MCPH, we recommend creating a free
                  account.
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Step 2: Connect Your AI Tool
              </h3>
              <p className="text-gray-600 mb-3">
                MCPH works with any AI tool that supports the Model Context
                Protocol (MCP). The basic steps for connecting any AI tool are:
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Essential Information
                </h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>
                    <b>Get the MCP URL:</b> <code>https://api.mcph.io/mcp</code>
                    <p className="text-sm text-gray-600 mt-1">
                      This is the endpoint you'll need to configure in your AI
                      tool.
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
                      and navigate to the API Keys section to generate or
                      retrieve your key.
                    </p>
                  </li>
                  <li>
                    <b>Configure your AI tool:</b>{" "}
                    <span className="text-gray-600">
                      Set up the MCP server in your tool's settings
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Each AI tool has a different configuration process. Most
                      tools have a dedicated section for MCP server
                      configuration where you'll enter the URL and API key.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-amber-800 mb-2">Key Notes</h4>
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  <li>
                    The specific configuration steps vary by tool (ChatGPT,
                    Claude, custom AI applications, etc.)
                  </li>
                  <li>Authenticated user uploads have no expiration</li>
                  <li>All generated download links expire in 24 hours</li>
                </ul>
                <p className="mt-3 text-sm">
                  For detailed, tool-specific configuration instructions, 
                  refer to your AI tool's documentation for MCP setup. 
                  Most major AI tools that support MCP have similar configuration processes.
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Step 3: Create and Share Content
              </h3>
              <p className="text-gray-600 mb-3">
                Once connected, you can ask your AI to create and share content
                via MCPH. For example:
              </p>

              <div className="bg-gray-100 p-3 rounded-lg mb-4 text-gray-700 text-sm">
                "Create a markdown guide explaining user authentication best
                practices and share it via MCPH."
              </div>

              <p className="text-gray-600 mb-3">
                The AI will create the content and provide you with a shareable
                link that looks like:
                <code className="ml-2 text-blue-600">
                  https://mcph.io/crate/abc123
                </code>
              </p>

              <p className="text-gray-600">
                Share this link with anyone - they don't need an account to view
                the content.
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


            <div
              id="mcp-tools"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                Available MCP Tools
              </h2>
              <p className="text-gray-600 mb-4">
                MCPH provides a comprehensive set of powerful tools that enable
                you to manage your content through the Model Context Protocol
                (MCP). These tools can be used programmatically or through AI
                assistants using natural language commands.
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
                        filtering (including 'poll' templates), tag-based
                        organization
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "List my crates", "Show my
                        poll templates", "Find my recent uploads"
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
                        <strong>AI Usage:</strong> "Show me crate abc123", "Get
                        the content of that document", "Display my project
                        specs"
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        crates_upload
                      </h4>
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
                      <h4 className="font-medium text-gray-700">
                        crates_update
                      </h4>
                      <p className="text-sm text-gray-600">
                        Modify existing crate metadata and content
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> Update any crate property,
                        manage sharing settings, modify templates (open/close
                        status)
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Update the title of crate
                        abc123", "Add tags to my project crate", "Make my
                        template private"
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        crates_delete
                      </h4>
                      <p className="text-sm text-gray-600">
                        Remove unwanted crates permanently
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> Complete removal of content
                        and metadata, irreversible operation
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Delete crate abc123",
                        "Remove that old document", "Clean up my test files"
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
                      <h4 className="font-medium text-gray-700">
                        crates_share
                      </h4>
                      <p className="text-sm text-gray-600">
                        Make content accessible to others with advanced options
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> Public/private toggle,
                        password protection, shareable URLs, access control
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
                        <strong>Features:</strong> One-click public sharing,
                        instant shareable URL generation
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Make this public", "Share
                        this crate publicly", "Generate public link"
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        crates_unshare
                      </h4>
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
                        <strong>Features:</strong> Configurable expiration,
                        secure signed URLs, direct download support
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Create download link for
                        crate abc123", "Generate 1-hour access URL"
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        crates_share_social
                      </h4>
                      <p className="text-sm text-gray-600">
                        Generate social media share URLs and content for crates
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> Supports Twitter/X, Reddit, LinkedIn, Discord, Telegram, and Email sharing, custom messages, platform-specific formatting
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Share crate abc123 on Twitter", "Get all social sharing links for this crate", "Generate Discord share message"
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
                        <strong>AI Usage:</strong> "Copy this public crate",
                        "Save a copy of crate abc123 to my collection"
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
                          Category filtering (including poll templates:
                          category: 'poll')
                        </li>
                        <li>Relevance scoring and intelligent ranking</li>
                        <li>
                          Full-text search across titles, descriptions, and tags
                        </li>
                      </ul>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      <strong>AI Usage:</strong> "Find my React components",
                      "Search for project documentation", "Find poll
                      templates about mobile apps"
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
                          • Conventional tags like project:, type:, status:
                          receive relevance boosting
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Poll Collection System Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Poll Collection System
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-orange-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        poll_template_create
                      </h4>
                      <p className="text-sm text-gray-600">
                        Build custom poll forms with validation
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
                            Automatic storage as both poll template AND
                            crate (category: 'poll')
                          </li>
                          <li>
                            Tag-based organization, public/private templates,
                            linked crate references
                          </li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Limits:</strong> 5 templates per user (Free),
                          50 templates (Pro)
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        <strong>AI Usage:</strong> "Create poll form for
                        product reviews", "Build survey with rating and text
                        fields"
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        poll_submit
                      </h4>
                      <p className="text-sm text-gray-600">
                        Submit responses to poll templates with validation
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
                          <li>User submissions with metadata tracking</li>
                          <li>
                            Real-time validation with helpful error messages
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        <strong>AI Usage:</strong> "Submit response to template
                        abc123", "Fill out the product survey"
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        poll_responses_get
                      </h4>
                      <p className="text-sm text-gray-600">
                        Analyze poll data with comprehensive analytics
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          <strong>Features:</strong>
                        </p>
                        <ul className="text-xs text-gray-500 list-disc list-inside ml-2 space-y-1">
                          <li>
                            Complete response analytics: averages,
                            distributions, response rates
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
                          <li>
                            Comprehensive insights for data-driven decisions
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        <strong>AI Usage:</strong> "Show responses for my
                        poll template", "Analyze survey results", "Get
                        poll analytics"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="mcp-endpoint"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                How the MCP Endpoint Works
              </h2>
              <p className="text-gray-600 mb-3">
                The <b>MCP endpoint</b> (<code>/mcp</code>) is the only
                supported way to interact with MCPH programmatically. It uses
                the Model Context Protocol (MCP) over Streamable HTTP for
                real-time, bidirectional communication.
              </p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
                <li>
                  <b>Connect via Streamable HTTP:</b> Use{" "}
                  <code>npx mcp-remote https://api.mcph.io/mcp</code> or
                  configure your client to use the endpoint.
                </li>
                <li>
                  <b>Authentication:</b> Pass your API key as a Bearer token in
                  the <code>Authorization</code> header.
                </li>
                <li>
                  <b>Session:</b> On connect, you receive a session ID in the{" "}
                  <code>MCP-Session-ID</code> response header. All subsequent
                  requests must include this ID in the{" "}
                  <code>MCP-Session-ID</code> header.
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

            <div
              id="learn-more"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                Learn More
              </h2>
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
      </div>
    </div>
  );
}
