"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LocalUsagePage() {
  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-8 text-sm text-gray-400">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-blue-400 transition-colors">
            Documentation
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Local Usage</span>
        </div>

        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-100 mb-8">
          🚀 Getting Started with Local MCP Usage
        </h1>

        {/* Main Content */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-md mb-10">
          <h2 className="text-2xl font-semibold text-gray-100 mb-6">
            Using MCP Servers in Repositories
          </h2>

          <div className="mb-10">
            <h3 className="text-xl font-medium text-gray-100 mb-4">
              TypeScript-based Servers
            </h3>
            <p className="text-gray-300 mb-4">
              TypeScript-based servers in this repository can be used directly
              with npx, making them easy to run without installation.
            </p>
            <p className="text-gray-300 mb-4">
              For example, this will start the Memory server:
            </p>
            <div className="bg-gray-900 p-4 rounded-md mb-4">
              <code className="text-green-400">
                npx -y @modelcontextprotocol/server-memory
              </code>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-xl font-medium text-gray-100 mb-4">
              Python-based Servers
            </h3>
            <p className="text-gray-300 mb-4">
              Python-based servers can be used directly with uvx or pip. uvx is
              recommended for ease of use and setup.
            </p>
            <p className="text-gray-300 mb-4">
              For example, this will start the Git server:
            </p>
            <div className="bg-gray-900 p-4 rounded-md mb-4">
              <code className="text-green-400">
                # With uvx
                <br />
                uvx mcp-server-git
                <br />
                <br />
                # With pip
                <br />
                pip install mcp-server-git
                <br />
                python -m mcp_server_git
              </code>
            </div>
            <p className="text-gray-300 mb-4">
              Follow these instructions to install{" "}
              <a
                href="https://github.com/astral-sh/uv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                uv / uvx
              </a>{" "}
              and these to install{" "}
              <a
                href="https://pip.pypa.io/en/stable/installation/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                pip
              </a>
              .
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-semibold text-gray-100 mb-6">
              Using an MCP Client
            </h2>
            <p className="text-gray-300 mb-4">
              Running a server on its own isn't very useful, and should instead
              be configured into an MCP client. For example, here's the Claude
              Desktop configuration to use the above server:
            </p>
            <div className="bg-gray-900 p-4 rounded-md mb-6">
              <pre className="text-blue-400 whitespace-pre-wrap">{`{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}`}</pre>
            </div>

            <h3 className="text-xl font-medium text-gray-100 mb-4">
              Additional Configuration Examples
            </h3>
            <p className="text-gray-300 mb-4">
              Additional examples of using the Claude Desktop as an MCP client
              might look like:
            </p>
            <div className="bg-gray-900 p-4 rounded-md mb-6">
              <pre className="text-blue-400 whitespace-pre-wrap">{`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "path/to/git/repo"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}`}</pre>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-blue-900/20 border border-blue-800 rounded-lg p-6 mb-10"
          >
            <h3 className="text-xl font-medium text-blue-300 mb-3">
              Tips for Local Usage
            </h3>
            <ul className="list-disc list-inside space-y-3 text-gray-300">
              <li>
                For development purposes, you may want to run the MCP server in
                a separate terminal window to view logs and debug information.
              </li>
              <li>
                MCP servers typically expose their APIs on localhost with a
                default port (often 8080). Ensure this port isn't being used by
                other applications.
              </li>
              <li>
                Check the documentation of each MCP server to understand the
                specific parameters and environment variables they support.
              </li>
              <li>
                When using TypeScript-based servers, you can usually pass the{" "}
                <code className="bg-gray-900 px-1 rounded text-blue-400">
                  --help
                </code>{" "}
                flag to see available options.
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold text-gray-100 mb-6">
              🛠️ Creating Your Own MCP Server
            </h2>
            <p className="text-gray-300 mb-4">
              Interested in creating your own MCP server? Here's how to get
              started:
            </p>
            <div className="bg-gray-900 p-6 rounded-md mb-6">
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li>
                  Choose your programming language (TypeScript or Python are
                  well-supported)
                </li>
                <li>Install the appropriate MCP SDK</li>
                <li>
                  Define your capabilities and implement the required methods
                </li>
                <li>Test your implementation with an MCP client</li>
                <li>Package and distribute your MCP server</li>
              </ol>
            </div>
            <p className="text-gray-300 mb-4">
              Visit the{" "}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                official documentation
              </a>{" "}
              at modelcontextprotocol.io for comprehensive guides, best
              practices, and technical details on implementing MCP servers.
            </p>
          </motion.div>
        </div>

        {/* Navigation links */}
        <div className="flex justify-between items-center mt-12">
          <Link
            href="/docs"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Documentation
          </Link>
          <Link
            href="/docs/faq"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
          >
            FAQ
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
