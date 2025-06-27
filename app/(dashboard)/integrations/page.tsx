"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import { FaCopy, FaCheck, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to redirect to Claude documentation
  const handleClaudeDocRedirect = () => {
    window.open("https://modelcontextprotocol.io/quickstart/user", "_blank");
  };

  // Shared function to render integration cards
  const renderIntegrationCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Claude Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
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
            <h2 className="text-xl font-semibold">Claude AI Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Connect your account to Claude AI for enhanced MCP functionality.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Get your API key from the "My API keys" section
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Follow the setup guide in the Claude documentation
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Use https://mcp.mcph.io/mcp as your MCP server URL
                </span>
              </div>
            </div>
          </div>

          <a
            href="https://modelcontextprotocol.io/quickstart/user"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            onClick={handleClaudeDocRedirect}
          >
            <svg
              className="w-5 h-5 mr-2"
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
            View Setup Guide
          </a>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Your API key can be found in the "My API keys" section
          </p>
        </div>
      </Card>

      {/* ChatGPT Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-green-400 to-teal-500 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <path
                  d="M16 3L20.326 11.9066L30 13.0557L22.7628 19.8434L24.7023 29.4L16 24.5L7.29772 29.4L9.23721 19.8434L2 13.0557L11.674 11.9066L16 3Z"
                  fill="white"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">ChatGPT Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Connect MCPHub to ChatGPT as a custom connector to access your
              specialized tools and data directly in your chat.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Go to ChatGPT Settings → Connectors → Connect custom connector
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Add MCPHub as a Model Context Protocol (MCP) connector
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Use Deep Research to leverage your MCPHub data in
                  conversations
                </span>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
              <p className="text-yellow-700 text-sm">
                <strong>Note:</strong> Custom connectors are available for
                ChatGPT Pro, Team, Enterprise, and Edu workspaces.
              </p>
            </div>
          </div>

          <a
            href="https://help.openai.com/en/articles/11487775-connectors-in-chatgpt"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Go to ChatGPT
          </a>
        </div>
      </Card>

      {/* VS Code Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <path
                  d="M23.5 4.27199L18.4 2.43799C17.9 2.27599 17.35 2.42399 17 2.82399L7.3 11.563L3.7 8.88399C3.35 8.63399 2.85 8.66799 2.5 8.96799L1.9 9.56799C1.55 9.91799 1.55 10.468 1.9 10.818L5 13.998L1.9 17.178C1.55 17.528 1.55 18.078 1.9 18.428L2.5 19.028C2.85 19.328 3.35 19.362 3.7 19.112L7.3 16.433L17 25.173C17.35 25.573 17.9 25.723 18.4 25.558L23.5 23.724C24.05 23.547 24.4 23.047 24.4 22.497V5.49799C24.4 4.94799 24.05 4.44799 23.5 4.27199ZM18.5 18.398L12 13.998L18.5 9.59799V18.398Z"
                  fill="white"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">VS Code Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Integrate MCPHub with Visual Studio Code to access your contexts
              directly within VS Code's Copilot Chat.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Enable MCP support in VS Code (version 1.99+)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Add MCPHub as a server in your workspace or user settings
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Use Agent mode in Copilot Chat to access your MCPHub contexts
                </span>
              </div>
            </div>
          </div>

          <a
            href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Get Extension
          </a>
          <p className="text-xs text-gray-500 mt-2 text-center">
            MCP for VS Code works with all MCPHub contexts
          </p>
        </div>
      </Card>

      {/* GitHub Copilot Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <path
                  d="M16 2C8.26 2 2 8.26 2 16C2 23.74 8.26 30 16 30C23.74 30 30 23.74 30 16C30 8.26 23.74 2 16 2ZM16 6C18.76 6 21 8.24 21 11C21 13.76 18.76 16 16 16C13.24 16 11 13.76 11 11C11 8.24 13.24 6 16 6ZM16 26C12.5 26 9.42 24.32 7.5 21.74C7.54 18.87 13.16 17.3 16 17.3C18.84 17.3 24.46 18.87 24.5 21.74C22.58 24.32 19.5 26 16 26Z"
                  fill="white"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">
              GitHub Copilot Integration
            </h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Use GitHub Copilot with Model Context Protocol support to access
              your MCPHub contexts through VS Code integration.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Install GitHub Copilot extension in VS Code
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Enable MCP support in VS Code settings
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Configure MCPHub as an MCP server in VS Code
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-6">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> GitHub Copilot integrates with MCPHub
                through VS Code's MCP support.
              </p>
            </div>
          </div>

          <a
            href="https://docs.github.com/fr/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Learn More
          </a>
        </div>
      </Card>

      {/* Cursor Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-green-600 to-green-800 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <path
                  d="M23 9L9 23M9 9L23 23"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M16 5V27"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M5 16H27"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Cursor Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Connect MCPHub with Cursor to enhance your AI-powered coding
              experience with custom contexts and tools.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Create a .cursor/mcp.json configuration file in your project
                  or globally
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Set up MCPHub as a server with your API key in the
                  configuration
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Access your MCPHub contexts directly through Cursor's Composer
                  Agent
                </span>
              </div>
            </div>
          </div>

          <a
            href="https://docs.cursor.com/context/model-context-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Get Cursor
          </a>
        </div>
      </Card>

      {/* Windsurf Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <path
                  d="M6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14 22L6 26L8 18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Windsurf Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Integrate MCPHub with Windsurf's Cascade AI assistant using the
              Model Context Protocol to enhance your browsing experience.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Edit your <code>~/.codeium/windsurf/mcp_config.json</code>{" "}
                  file
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Add MCPHub as a server with your API key in the configuration
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Refresh to enable MCPHub tools in Cascade
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-6">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> Enterprise users must manually enable MCP
                via settings.
              </p>
            </div>
          </div>

          <a
            href="https://docs.windsurf.com/windsurf/cascade/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Learn More
          </a>
        </div>
      </Card>

      {/* LangGraph Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <circle cx="8" cy="8" r="3" fill="white" />
                <circle cx="8" cy="24" r="3" fill="white" />
                <circle cx="24" cy="16" r="3" fill="white" />
                <path
                  d="M8 11V21M11 8H21M11 24H21"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">LangGraph Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Integrate MCPHub with LangGraph to build sophisticated AI agents
              that can access your custom tools and contexts.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Install <code>langchain-mcp-adapters</code> package
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Configure MCPHub as a server with{" "}
                  <code>MultiServerMCPClient</code>
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Create agents that use tools from your MCPHub contexts
                </span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md mb-6">
              <p className="text-purple-700 text-sm">
                <strong>Note:</strong> Works with LangGraph's agent framework to
                enable tool usage from MCPHub.
              </p>
            </div>
          </div>

          <a
            href="https://langchain-ai.github.io/langgraph/agents/mcp/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            View LangGraph
          </a>
        </div>
      </Card>

      {/* Perplexity Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white">
          <div className="flex items-center">
            <div className="mr-3">
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
                  fillOpacity="0.2"
                />
                <path d="M16 7L20.5 14.5H11.5L16 7Z" fill="white" />
                <path d="M16 25L11.5 17.5H20.5L16 25Z" fill="white" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Perplexity Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Connect MCPHub with Perplexity AI to enhance your AI experience
              with access to your custom tools and data.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Sign in to Perplexity and access MCP settings
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Add MCPHub as a server with your API key
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Start using MCPHub tools directly in your Perplexity
                  conversations
                </span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md mb-6">
              <p className="text-indigo-700 text-sm">
                <strong>Note:</strong> Works with Perplexity's Pro and Pro+
                plans that support the Model Context Protocol.
              </p>
            </div>
          </div>

          <a
            href="https://docs.perplexity.ai/guides/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
        </div>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MCPHub Integrations</h1>
        <p className="text-gray-600">
          Connect your MCPHub content with popular AI platforms using the Model
          Context Protocol.
        </p>
      </div>

      {renderIntegrationCards()}
    </div>
  );
}
