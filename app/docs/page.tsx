"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Home, Menu, X } from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation items
  const navItems = [
    { id: "what-is-mcp-storage-hub", title: "What is MCP Storage Hub?" },
    { id: "getting-started", title: "Getting Started" },
    { id: "organizing-content", title: "Organizing & Tagging Content" },
    { id: "mcp-tools", title: "Available MCP Tools" },
    { id: "ai-assistants", title: "Using with AI Assistants" },
    { id: "api-reference", title: "API Reference" },
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
                  MCP Storage Hub Documentation
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Store, organize, and search your AI artifacts with advanced
                  tagging and semantic search
                </p>
              </div>
            </div>

            <div
              id="what-is-mcp-storage-hub"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                What is MCP Storage Hub?
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                <b>MCP Storage Hub</b> is an AI artifact storage and
                organization platform that lets you store, tag, and search your
                AI-generated content. It provides intelligent organization
                capabilities with advanced tagging, semantic search, and content
                categorization through intelligent templates.
              </p>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Key benefits:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-3 mb-6 leading-relaxed">
                <li>
                  <b>Standardized feedback collection</b> - Create consistent
                  templates for different types of feedback
                </li>
                <li>
                  <b>AI-powered insights</b> - Templates work seamlessly with AI
                  assistants to analyze and categorize feedback
                </li>
                <li>
                  <b>Easy template management</b> - Create, update, and organize
                  feedback templates through simple tools
                </li>
                <li>
                  <b>Flexible structure</b> - Support for various feedback
                  formats including surveys, reviews, and evaluations
                </li>
                <li>
                  <b>Open/closed status</b> - Control when templates accept new
                  responses
                </li>
              </ul>

              {/* How It Works call-out box */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                  <span className="bg-blue-100 p-2 rounded-lg mr-3">✨</span>
                  How It Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📝</div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      1. Create Templates
                    </h4>
                    <p className="text-sm text-gray-600">
                      Design structured feedback forms with custom fields
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🤖</div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      2. Connect AI Tools
                    </h4>
                    <p className="text-sm text-gray-600">
                      Use with Claude, ChatGPT, and other AI assistants
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      3. Collect & Analyze
                    </h4>
                    <p className="text-sm text-gray-600">
                      Gather structured feedback and generate insights
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600">
                MCP Feedback Hub is built on the{" "}
                <a
                  href="https://github.com/cloudflare/agents/tree/main/examples/mcp"
                  className="text-blue-500 hover:underline"
                >
                  Model Context Protocol (MCP)
                </a>
                , enabling seamless integration with AI assistants for automated
                feedback collection and analysis.
              </p>
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
                    <b>View Templates:</b>{" "}
                    <code>https://mcph.io/template/[id]</code>
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
                need this to connect AI tools to your MCP Feedback Hub account.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Step 2: Connect Your AI Tool
              </h3>
              <p className="text-gray-600 mb-3">
                MCP Feedback Hub works with any AI tool that supports the Model
                Context Protocol (MCP). For ChatGPT, this requires Pro or higher
                plans. The basic steps for connecting any AI tool are:
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
                      Available from your MCP Feedback Hub account dashboard
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

              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Step 3: Create Your First Feedback Template
              </h3>
              <p className="text-gray-600 mb-3">
                Once connected, you can ask your AI to create feedback
                templates. For example:
              </p>

              <div className="bg-gray-100 p-3 rounded-lg mb-4 text-gray-700 text-sm">
                "Create a customer feedback template for our product reviews
                with fields for rating, comments, and improvement suggestions."
              </div>

              <p className="text-gray-600 mb-3">
                The AI will create the template and you can start collecting
                feedback immediately through the structured format.
              </p>
            </div>

            <div
              id="creating-templates"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                Creating Feedback Templates
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Feedback templates are structured forms that define how feedback
                should be collected and organized. They ensure consistency
                across different feedback sessions and make it easier to analyze
                responses.
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                  <span className="bg-green-100 p-2 rounded-lg mr-3">📝</span>
                  Template Components
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      📋 Basic Information:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>Template title and description</li>
                      <li>Category or type classification</li>
                      <li>Open/closed status for responses</li>
                      <li>Tags for organization and discovery</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      🔧 Template Structure:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>Custom fields and question types</li>
                      <li>Rating scales and validation rules</li>
                      <li>Conditional logic and branching</li>
                      <li>Response formatting guidelines</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <span className="bg-blue-100 p-2 rounded-lg mr-3">🎯</span>
                  Common Template Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      📊 Business Templates:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>Customer satisfaction surveys</li>
                      <li>Product feedback forms</li>
                      <li>Employee performance reviews</li>
                      <li>Event evaluation forms</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      🎓 Educational Templates:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>Course evaluation surveys</li>
                      <li>Peer review forms</li>
                      <li>Learning assessment templates</li>
                      <li>Workshop feedback forms</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">
                  Best Practices
                </h4>
                <ul className="list-disc pl-5 text-gray-700 space-y-2 text-sm">
                  <li>Keep templates focused on specific feedback goals</li>
                  <li>Use clear, unambiguous questions</li>
                  <li>Include both quantitative and qualitative fields</li>
                  <li>
                    Test templates with a small group before wider deployment
                  </li>
                  <li>
                    Regularly review and update templates based on usage
                    patterns
                  </li>
                </ul>
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
                MCP Feedback Hub provides three specialized tools for managing
                feedback templates through the Model Context Protocol (MCP).
                These tools can be used programmatically or through AI
                assistants using natural language commands.
              </p>

              <div className="space-y-6">
                {/* Feedback Template Management Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Feedback Template Management
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        feedback_templates_list
                      </h4>
                      <p className="text-sm text-gray-600">
                        List and discover your feedback templates
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> View all templates, filter by
                        status (open/closed), category-based organization
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "List my feedback templates",
                        "Show my open templates"
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        feedback_templates_create
                      </h4>
                      <p className="text-sm text-gray-600">
                        Create new feedback templates with structured fields
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> Define custom fields, set
                        template status, add descriptions and categories,
                        automatic tagging
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Create a customer feedback
                        template", "Make a new survey for product reviews"
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-3">
                      <h4 className="font-medium text-gray-700">
                        feedback_templates_update
                      </h4>
                      <p className="text-sm text-gray-600">
                        Modify existing templates and their settings
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Features:</strong> Update template fields,
                        change open/closed status, modify descriptions, adjust
                        categories and tags
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <strong>AI Usage:</strong> "Close my customer survey
                        template", "Update the description of template abc123"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="ai-assistants"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                Using with AI Assistants
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                MCP Feedback Hub tools integrate with AI assistants like Claude
                and ChatGPT to provide seamless feedback template management
                through natural conversation. You can create and manage
                templates without learning commands or APIs—just speak naturally
                about what you want to do.
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
                        Managing Templates:
                      </p>
                      <ul className="list-disc pl-5 text-gray-600 text-sm">
                        <li>"Show me my feedback templates"</li>
                        <li>"List all my open templates"</li>
                        <li>"Create a customer satisfaction survey"</li>
                        <li>"Close my product feedback template"</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        Template Configuration:
                      </p>
                      <ul className="list-disc pl-5 text-gray-600 text-sm">
                        <li>"Add rating scale questions"</li>
                        <li>"Update the template description"</li>
                        <li>"Make this template for event feedback"</li>
                        <li>"Change the category to surveys"</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        Status Management:
                      </p>
                      <ul className="list-disc pl-5 text-gray-600 text-sm">
                        <li>"Open my template for responses"</li>
                        <li>"Close this template to new feedback"</li>
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
                      <span className="font-medium">User:</span> "Create a
                      customer feedback template"
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">AI:</span> [Creates template
                      with rating and comment fields]
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">User:</span> "Add a field
                      for improvement suggestions"
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">AI:</span> "I've updated
                      your customer feedback template with an improvement
                      suggestions field"
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">User:</span> "Make it live"
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">AI:</span> "Template is now
                      open for responses"
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
                      <b>No learning curve</b> - talk about templates naturally
                    </li>
                    <li>
                      <b>Structured feedback</b> - templates ensure consistent
                      data collection
                    </li>
                    <li>
                      <b>Smart organization</b> - AI categorizes and tags
                      templates automatically
                    </li>
                  </ul>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>
                      <b>Status control</b> - easily open/close templates for
                      responses
                    </li>
                    <li>
                      <b>Cross-session continuity</b> - reference templates from
                      previous conversations
                    </li>
                    <li>
                      <b>Template reuse</b> - create once, use across multiple
                      projects
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              id="api-reference"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                API Reference
              </h2>
              <p className="text-gray-600 mb-4">
                The MCP Feedback Hub API uses the Model Context Protocol (MCP)
                over Streamable HTTP for real-time communication. All feedback
                template operations require authentication with your API key.
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">
                  Connection Details
                </h3>
                <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                  <li>
                    <strong>Endpoint:</strong>{" "}
                    <code>https://api.mcph.io/mcp</code>
                  </li>
                  <li>
                    <strong>Protocol:</strong> MCP over Streamable HTTP
                  </li>
                  <li>
                    <strong>Authentication:</strong> Bearer token in
                    Authorization header
                  </li>
                  <li>
                    <strong>Session Management:</strong> Use MCP-Session-ID
                    header
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-4 text-lg">
                    📝 feedback_templates_list
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Retrieves a list of feedback templates with optional
                    filtering.
                  </p>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Request Example:
                    </h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded text-blue-700 whitespace-pre-wrap">{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "feedback_templates_list",
    "arguments": {
      "status": "open",
      "category": "survey"
    }
  }
}`}</pre>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Parameters:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                      <li>
                        <code>status</code> (optional): Filter by "open" or
                        "closed"
                      </li>
                      <li>
                        <code>category</code> (optional): Filter by template
                        category
                      </li>
                      <li>
                        <code>limit</code> (optional): Number of results
                        (default: 50)
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-4 text-lg">
                    ➕ feedback_templates_create
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Creates a new feedback template with specified structure and
                    settings.
                  </p>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Request Example:
                    </h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded text-blue-700 whitespace-pre-wrap">{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "feedback_templates_create",
    "arguments": {
      "title": "Customer Satisfaction Survey",
      "description": "Collect feedback on product experience",
      "category": "survey",
      "status": "open",
      "fields": [
        {
          "name": "rating",
          "type": "scale",
          "label": "Overall Rating",
          "required": true,
          "scale": { "min": 1, "max": 5 }
        },
        {
          "name": "comments", 
          "type": "text",
          "label": "Additional Comments",
          "required": false
        }
      ]
    }
  }
}`}</pre>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Required Parameters:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                      <li>
                        <code>title</code>: Template name
                      </li>
                      <li>
                        <code>description</code>: Template purpose/description
                      </li>
                      <li>
                        <code>fields</code>: Array of form field definitions
                      </li>
                    </ul>

                    <h4 className="font-semibold text-gray-700 mb-2 mt-3">
                      Optional Parameters:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                      <li>
                        <code>category</code>: Template category
                      </li>
                      <li>
                        <code>status</code>: "open" or "closed" (default:
                        "open")
                      </li>
                      <li>
                        <code>tags</code>: Array of tags for organization
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-4 text-lg">
                    ✏️ feedback_templates_update
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Updates an existing feedback template's properties or
                    status.
                  </p>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Request Example:
                    </h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded text-blue-700 whitespace-pre-wrap">{`{
  "jsonrpc": "2.0", 
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "feedback_templates_update",
    "arguments": {
      "template_id": "template_abc123",
      "status": "closed",
      "description": "Updated survey for Q4 feedback"
    }
  }
}`}</pre>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Parameters:
                    </h4>
                    <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                      <li>
                        <code>template_id</code> (required): ID of template to
                        update
                      </li>
                      <li>
                        <code>title</code> (optional): New template title
                      </li>
                      <li>
                        <code>description</code> (optional): Updated description
                      </li>
                      <li>
                        <code>status</code> (optional): Change to "open" or
                        "closed"
                      </li>
                      <li>
                        <code>category</code> (optional): Update category
                      </li>
                      <li>
                        <code>tags</code> (optional): Replace tags array
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mt-6">
                <h3 className="font-bold text-amber-800 mb-2">
                  Authentication
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  All API calls require your API key in the Authorization
                  header:
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block text-blue-700">
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <p className="text-gray-600 text-xs mt-2">
                  Get your API key from the dashboard at{" "}
                  <a
                    href="https://mcph.io"
                    className="text-blue-500 hover:underline"
                  >
                    mcph.io
                  </a>
                </p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-4 mt-6">
                <h3 className="font-bold text-green-800 mb-2">Rate Limits</h3>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                  <li>Free accounts: 100 requests per hour</li>
                  <li>Maximum 5 feedback templates per free account</li>
                  <li>Template field limit: 20 fields per template</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
