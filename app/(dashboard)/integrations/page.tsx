"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import { FaCopy, FaCheck, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to redirect to Claude documentation
  const handleClaudeDocRedirect = () => {
    window.open("https://modelcontextprotocol.io/quickstart/user", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
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
              Integrations
            </span>
          </div>
        </nav>

        {/* Header section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              AI Platform Integrations
            </h1>
            <p className="text-lg text-gray-600">
              Connect MCPH with your favorite AI tools for seamless artifact management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claude Code Integration Card */}
          <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 bg-white">
            <Card.Header className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-t-lg">
              <div className="flex items-center p-6">
                <div className="mr-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        width="32"
                        height="32"
                        rx="6"
                        fill="white"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M7 16C7 11.0294 11.0294 7 16 7C20.9706 7 25 11.0294 25 16C25 20.9706 20.9706 25 16 25C11.0294 25 7 20.9706 7 16Z"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 20L20 12M12 12L20 20"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Claude Code Integration
                  </h2>
                  <p className="text-purple-100 mt-1">
                    Professional AI coding assistant
                  </p>
                </div>
              </div>
            </Card.Header>
            <div className="p-8">
              <div className="mb-8">
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Connect MCPH to Claude Code to enhance your AI coding assistant
                  with access to your stored artifacts and crates.
                </p>

                <div className="space-y-5 mb-8">
                  <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Create Configuration File</h4>
                      <span className="text-gray-700">
                        Create a <code className="bg-gray-200 px-2 py-1 rounded text-sm">claude-code.toml</code> configuration file in
                        your project
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Configure MCP Server</h4>
                      <span className="text-gray-700">
                        Configure MCPH as an MCP server with your API key
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Access Contexts</h4>
                      <span className="text-gray-700">
                        Access your MCPH contexts directly in Claude Code
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 mb-8 shadow-sm">
                  <h4 className="font-bold text-yellow-800 mb-3 flex items-center">
                    <span className="bg-yellow-100 p-2 rounded-lg mr-3">
                      ⚙️
                    </span>
                    Example configuration:
                  </h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>
                      [mcp.servers.mcph]
                      <br />
                      url = "https://api.mcph.io/mcp"
                      <br />
                      headers = {"{"} "Authorization" = "Bearer YOUR_API_KEY" {"}"}
                    </code>
                  </div>
                </div>
              </div>

              <a
                href="https://docs.anthropic.com/en/docs/claude-code/mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
                Setup Guide
              </a>
              <p className="text-sm text-gray-600 mt-4 text-center bg-gray-50 p-3 rounded-lg">
                Claude Code MCP integration is available to all Claude users
              </p>
            </div>
          </Card>

          {/* Claude Integration Card */}
          <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 bg-white">
            <Card.Header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center p-6">
                <div className="mr-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        width="32"
                        height="32"
                        rx="6"
                        fill="white"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M7 16C7 11.0294 11.0294 7 16 7C20.9706 7 25 11.0294 25 16C25 20.9706 20.9706 25 16 25C11.0294 25 7 20.9706 7 16Z"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 13V19"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M13 16H19"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Claude AI Integration</h2>
                  <p className="text-purple-100 mt-1">
                    Advanced AI assistant with custom integrations
                  </p>
                </div>
              </div>
            </Card.Header>
            <div className="p-8">
              <div className="mb-8">
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Connect MCPH to Claude AI using the new custom integrations
                  feature. Choose between API key or OAuth authentication.
                </p>

                <div className="space-y-5 mb-8">
                  <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Open Integrations</h4>
                      <span className="text-gray-700">
                        In Claude AI, click "Integrations" in the bottom left corner
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Add Custom Integration</h4>
                      <span className="text-gray-700">
                        Click "Add custom integration" and enter:{" "}
                        <code className="bg-gray-200 px-2 py-1 rounded text-sm">https://api.mcph.io/mcp</code>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Choose Authentication</h4>
                      <span className="text-gray-700">
                        Choose authentication: OAuth (recommended) or API key
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                    <span className="bg-blue-100 p-2 rounded-lg mr-3">
                      🔑
                    </span>
                    Authentication Options:
                  </h4>
                  <div className="space-y-3 text-blue-700">
                    <div>
                      <strong>OAuth:</strong> Sign in with your MCPH account for automatic authentication
                    </div>
                    <div>
                      <strong>API Key:</strong> Use your API key from the "My API keys" section
                    </div>
                  </div>
                </div>
              </div>

              <a
                href="https://support.anthropic.com/fr/articles/11175166-commencer-avec-les-integrations-personnalisees-en-utilisant-mcp-distant"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
                Custom Integrations Guide
              </a>
              <p className="text-sm text-gray-600 mt-4 text-center bg-gray-50 p-3 rounded-lg">
                Custom integrations are available to all Claude Pro and Team users
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}