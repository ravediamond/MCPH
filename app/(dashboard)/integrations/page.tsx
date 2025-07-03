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
      {/* Claude Code Integration Card */}
      <Card hoverable>
        <Card.Header className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white">
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
                  d="M12 20L20 12M12 12L20 20"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white shadow-sm">
              Claude Code Integration
            </h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Connect MCPH to Claude Code to enhance your AI coding assistant
              with access to your stored artifacts and crates.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <span className="text-gray-700">
                  Create a <code>claude-code.toml</code> configuration file in
                  your project
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <span className="text-gray-700">
                  Configure MCPH as an MCP server with your API key
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Access your MCPH contexts directly in Claude Code
                </span>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
              <p className="text-yellow-700 text-sm">
                <strong>Example configuration:</strong>
                <br />
                <code>
                  [mcp.servers.mcph]
                  <br />
                  url = "https://mcp.mcph.io/mcp"
                  <br />
                  headers = {"{"} "Authorization" = "Bearer YOUR_API_KEY" {"}"}
                </code>
              </p>
            </div>
          </div>

          <a
            href="https://docs.anthropic.com/en/docs/claude-code/mcp"
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
          <p className="text-xs text-gray-500 mt-2 text-center">
            Claude Code MCP integration is available to all Claude users
          </p>
        </div>
      </Card>

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

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-6">
            <p className="text-yellow-700 text-sm">
              <strong>Important:</strong> MCP integration with simplified setup
              is only available in Claude Pro and Enterprise plans. Without
              these plans, you won't be able to use the MCP feature that allows
              direct integration with MCPH.
              <br />
              <br />
              The configuration file is located at:
              <br />
              <strong>macOS:</strong>{" "}
              <code>
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>
              <br />
              <strong>Windows:</strong>{" "}
              <code>%APPDATA%\Claude\claude_desktop_config.json</code>
              <br />
              <br />
              For more details, please refer to the{" "}
              <a
                href="https://modelcontextprotocol.io/quickstart/user"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Claude MCP documentation
              </a>
              .
            </p>
          </div>
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
              Connect MCPH to ChatGPT as a custom connector to access your
              stored artifacts and crates directly in your chat.
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
                  Add MCPH as a Model Context Protocol (MCP) connector
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Use Deep Research to leverage your MCPH data in conversations
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
                  d="M23.5 4.27199L18.4 2.43799C17.9 2.27599 17.35 2.42399 17 2.82399L7.3 11.563L3.7 8.88399C3.35 8.63399 2.85 8.66799 2.5 8.96799L1.9 9.56799C1.55 9.91799 1.55 10.468 1.9 10.818L6 14.018L2 24.968C2 25.518 2.45 26.018 3 26.018C3.2 26.018 3.4 25.968 3.55 25.818L8.1 22.618L12.8 26.368C13 26.518 13.2 26.618 13.45 26.618C13.55 26.618 13.65 26.618 13.75 26.568C14.15 26.468 14.45 26.118 14.55 25.718L19 4.91799C19.05 4.71799 19.05 4.51799 19 4.31799C18.8 3.76799 18.25 3.47599 17.75 3.62599L17.65 3.67599L8.55 7.46799L17 16.968C17.15 17.118 17.15 17.368 17 17.518C16.85 17.668 16.6 17.668 16.45 17.518L7.9 7.96799L17.05 4.17599C17.2 4.12599 17.35 4.12599 17.45 4.22599C17.5 4.27599 17.55 4.32599 17.55 4.42599L13.1 25.168C13.05 25.318 12.95 25.368 12.85 25.368C12.8 25.368 12.7 25.318 12.65 25.268L7.85 21.518C7.7 21.368 7.5 21.318 7.3 21.318C7.15 21.318 7 21.368 6.85 21.468L2.35 24.618C2.2 24.718 2.1 24.668 2.05 24.618C2 24.568 1.95 24.468 2 24.318L6.05 13.218C6.1 13.068 6.05 12.918 5.95 12.818L1.95 9.61799C1.85 9.51799 1.85 9.36799 1.95 9.26799L2.55 8.66799C2.65 8.56799 2.8 8.56799 2.9 8.66799L6.6 11.418C6.75 11.518 6.9 11.568 7.05 11.568C7.3 11.568 7.5 11.468 7.65 11.268L17.4 2.46799C17.55 2.31799 17.75 2.26799 17.95 2.31799L23.05 4.17599C23.3 4.27599 23.4 4.46799 23.4 4.71799V27.218C23.4 27.518 23.2 27.768 22.9 27.818C22.85 27.818 22.75 27.818 22.7 27.768L13.35 22.368C13.3 22.318 13.3 22.318 13.25 22.318C13.15 22.318 13.05 22.368 13 22.468C12.9 22.568 12.95 22.718 13.05 22.768L22.45 28.218C22.6 28.318 22.8 28.368 22.95 28.368C23.65 28.368 24.25 27.768 24.25 27.068V4.71799C24.25 4.17599 23.95 3.67599 23.45 3.46799L18.35 1.61799C17.8 1.41799 17.2 1.56799 16.8 1.96799L7.05 10.768L3.25 8.01799C2.7 7.61799 1.95 7.66799 1.45 8.11799L0.85 8.71799C0.35 9.21799 0.35 10.018 0.85 10.518L4.75 13.668L0.8 24.568C0.7 24.868 0.65 25.168 0.7 25.468C0.85 26.218 1.5 26.718 2.25 26.718C2.6 26.718 2.95 26.618 3.25 26.368L7.3 23.468L11.75 26.968C12.05 27.168 12.4 27.268 12.75 27.268C12.9 27.268 13.05 27.268 13.2 27.218C13.75 27.068 14.2 26.618 14.35 26.068L18.8 5.26799C18.85 4.91799 18.85 4.51799 18.7 4.17599C18.4 3.27599 17.5 2.76799 16.65 3.06799L8.9 6.42599L16.2 14.768C16.95 15.518 16.95 16.768 16.2 17.518C15.45 18.268 14.2 18.268 13.45 17.518L6.2 9.11799L15.8 5.01799C16.4 4.76799 16.55 4.01799 16.05 3.56799C15.8 3.31799 15.45 3.21799 15.1 3.31799L14.85 3.41799L5.75 7.21799C5.3 7.36799 5 7.76799 5 8.26799C5 8.56799 5.1 8.86799 5.3 9.06799L13.45 18.368C14.6 19.518 16.5 19.518 17.65 18.368C18.8 17.218 18.8 15.318 17.65 14.168L11.15 6.71799L17.55 3.97599C17.6 3.97599 17.65 3.97599 17.7 3.97599C17.85 4.01799 17.95 4.11799 17.95 4.26799L13.5 25.018C13.45 25.168 13.35 25.268 13.2 25.318C13.05 25.368 12.9 25.318 12.8 25.218L8.15 21.668L4.15 24.518C4 24.618 3.8 24.668 3.65 24.618C3.5 24.568 3.4 24.468 3.35 24.318L7.2 13.768L3.2 10.568C3.05 10.418 3.05 10.168 3.2 10.018L3.8 9.41799C3.95 9.31799 4.1 9.26799 4.25 9.31799L7.95 12.068"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">VS Code Integration</h2>
          </div>
        </Card.Header>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Connect MCPH to VS Code with MCP support to access your stored
              artifacts and crates directly in your development environment.
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
                  Add MCPH as a server in your workspace or user settings
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Use Agent mode in Copilot Chat to access your MCPH contexts
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
            MCP for VS Code works with all MCPH contexts
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
              your MCPH contexts through VS Code integration.
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
                  Configure MCPH as an MCP server in VS Code
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-6">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> GitHub Copilot integrates with MCPH
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
              Connect MCPH with Cursor to enhance your AI-powered coding
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
                  Set up MCPH as a server with your API key in the configuration
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Access your MCPH contexts directly through Cursor's Composer
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
              Integrate MCPH with Windsurf's Cascade AI assistant using the
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
                  Add MCPH as a server with your API key in the configuration
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Refresh to enable MCPH tools in Cascade
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
              Integrate MCPH with LangGraph to build sophisticated AI agents
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
                  Configure MCPH as a server with{" "}
                  <code>MultiServerMCPClient</code>
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Create agents that use tools from your MCPH contexts
                </span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md mb-6">
              <p className="text-purple-700 text-sm">
                <strong>Note:</strong> Works with LangGraph's agent framework to
                enable tool usage from MCPH.
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
              Connect MCPH with Perplexity AI to enhance your AI experience with
              access to your custom tools and data.
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
                  Add MCPH as a server with your API key
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <span className="text-gray-700">
                  Start using MCPH tools directly in your Perplexity
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
        <h1 className="text-3xl font-bold mb-2">MCPH Integrations</h1>
        <p className="text-gray-600">
          Connect your MCPH content with popular AI platforms using the Model
          Context Protocol.
        </p>
      </div>

      {renderIntegrationCards()}
    </div>
  );
}
