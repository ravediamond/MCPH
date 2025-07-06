[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/mcph.svg)](https://www.npmjs.com/package/mcph)
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Vercel](https://vercelbadge.vercel.app/api/OWNER/REPO)](https://vercel.com/OWNER/REPO)
[![Open Issues](https://img.shields.io/github/issues/OWNER/REPO.svg)](https://github.com/OWNER/REPO/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/OWNER/REPO.svg)](https://github.com/OWNER/REPO/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/OWNER/REPO.svg)](https://github.com/OWNER/REPO/commits/main)
[![Forks](https://img.shields.io/github/forks/OWNER/REPO.svg?style=social&label=Fork)](https://github.com/OWNER/REPO/fork)
[![Stars](https://img.shields.io/github/stars/OWNER/REPO.svg?style=social&label=Star)](https://github.com/OWNER/REPO)

# MCPH: Model Context Protocol (MCP) Hub

## 🗜️ MCPH — AI Artifact Storage & Sharing System

![MCPH Demo](https://mcph.io/assets/demo.gif)

MCPH is an AI artifact storage and sharing system that lets you package your AI-generated content in crates. It provides permanent storage for your artifacts and auto-expiry for guest uploads. It works with ChatGPT, Claude, and other AI tools that support the Model Context Protocol (MCP).

## Features at a Glance

- **Context Engineering Hub**: Store your AI context like company style guides and brand voice as separate artifacts
- **Persistent Artifact Storage**: Never lose an AI-generated artifact again with powerful organization and retrieval
- **Seamless Share Links**: Share your AI artifacts with a single, universal link that works for both humans and AI systems
- **Multi-Agent Relay**: All AI tools—Claude, ChatGPT, Gemini—can write and access the same artifacts
- **Native MCP Integration**: Built on the Model Context Protocol (MCP) standard for direct integration with AI systems
- **Multiple Content Types**: Store and share markdown, code, images, JSON, YAML, text, and binary files
- **Security Features**: Private by default with optional password protection, 30-day expiration for anonymous uploads (authenticated users' crates have no expiration)
- **Enhanced Content Preview**: Better visualization and interaction with different content types

## Quick Start

- **MCP Endpoint:** `https://mcp.mcph.io/mcp`
- **Web UI:** [mcph.io](https://mcph.io)
- **Crate Page:** `https://mcph.io/crate/[id]`

### Getting Started with MCPH

1. **Create an Account**: Visit [mcph.io](https://mcph.io) and sign up for a free account. After logging in, navigate to the API Keys section to generate your personal API key.

2. **Connect Your AI Tool**: MCPH works with any AI tool that supports the Model Context Protocol (MCP). Configure your tool with:
   - MCP URL: `https://mcp.mcph.io/mcp`
   - Your API Key (from your MCPH account dashboard)

3. **Create and Share Content**: Once connected, you can ask your AI to create and share content via MCPH. For example:
   ```
   "Create a markdown guide explaining user authentication best practices and share it via MCPH."
   ```
   The AI will create the content and provide you with a shareable link that looks like: `https://mcph.io/crate/abc123`

### Anonymous vs. Logged-in Users

MCPH offers different capabilities depending on whether you are logged in or using the service anonymously:

| Feature         | Anonymous Users | Logged-in Users |
| --------------- | --------------- | --------------- |
| Download Crates | ✓               | ✓               |
| Upload Crates   | ✗               | ✓               |
| Search Crates   | ✗               | ✓               |
| Delete Crates   | ✗               | ✓               |
| Manage API Keys | ✗               | ✓               |

For anonymous users:

- **Anonymous uploads** are available through AI assistants that support MCP
- **30-day expiration** - your content will be automatically deleted after 30 days
- **Limited management** - you can't search, organize, or manage your files
- **No MCP all tools access** - you can only use the crates_get tool to get a crate by its ID. You cannot use the other tools.

## Development

### Running the Application

The project consists of two separate services:

```bash
# Run the Next.js frontend
npm run dev

# Run the MCP server (from the mcp directory)
cd mcp && npm run dev
# Or using the helper script from the root directory
npm run dev:mcp
```

### Building

```bash
# Build the Next.js frontend
npm run build

# Build the MCP server (from the mcp directory)
cd mcp && npm run build
# Or using the helper script from the root directory
npm run build:mcp
```

### Connect with mcp-remote

```sh
npx mcp-remote https://mcp.mcph.io/mcp
```

Or configure your client:

```json
{
  "mcpServers": {
    "MCPH": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.mcph.io/mcp"]
    }
  }
}
```

### Authentication

MCPH supports two authentication methods:

1. **OAuth (Recommended)**: Sign in with your MCPH account through the OAuth flow
2. **API Key**: Pass your API key as a Bearer token in the `Authorization` header

For AI assistants using custom integrations (like Claude AI), OAuth provides the easiest setup experience.

## Available MCP Tools

MCPH provides a set of powerful tools that enable you to manage your content through the Model Context Protocol (MCP). These tools can be used programmatically or through AI assistants using natural language.

### Content Management

- **crates_list**: List all your stored crates
  - Input: `{ limit?: number, startAfter?: string }`
  - Output: `{ crates: [ { id, title, description, category, ... }, ... ], lastCrateId, hasMore }`
  - Pagination: Use `limit` (default: 20, max: 100) and `startAfter` (ID of the last crate from the previous page)
  - Permission: Requires authentication to list user's crates
  - Sort: Most recent crates first

- **crates_get**: Retrieve a crate's contents
  - Input: `{ id: string, password?: string }`
  - Output: `{ content: [ { type: 'text|image', text|data, mimeType? }, ... ] }`
  - Permission:
    - Owner can always access their crates
    - Anonymous uploads are public by default (expire after 30 days)
    - Password-protected crates require the password parameter
    - For binary files, directs to use `crates_get_download_link` instead

- **crates_upload**: Create and store new content
  - Input: `{ fileName: string, contentType: string, data: string, ... }`
  - Output (binary): `{ uploadUrl, fileId, gcsPath, message }`
  - Output (text): `{ crate, message }`
  - Small text content is uploaded directly; large/binary files return a pre-signed upload URL
  - Note: Anonymous uploads expire after 30 days, authenticated user uploads have no expiration

- **crates_delete**: Remove unwanted crates
  - Input: `{ id: string }`
  - Output: `{ message }`
  - Removes both the crate content and metadata
  - Permission: Only the owner can delete their crates

### Sharing & Access

- **crates_share**: Make content accessible to others
  - Input: `{ id: string, password?: string }`
  - Output: `{ id, isShared, shareUrl, message }`
  - Options: Make public or password-protected

- **crates_unshare**: Restrict access to private
  - Input: `{ id: string }`
  - Output: `{ message, ... }`
  - Removes public access and password protection

- **crates_get_download_link**: Create shareable links
  - Input: `{ id: string, expiresInSeconds?: number }`
  - Output: `{ url: string, validForSeconds: number }`
  - Useful for: Binary files, large files, or direct downloads
  - Default expiration: 24 hours (can be customized with `expiresInSeconds`)

- **crates_copy**: Save others' public crates to your collection
  - Input: `{ id: string }`
  - Output: `{ crate, message }`
  - Creates a new private copy of a public crate in your collection
  - Permission: Requires authentication; can only copy public crates or anonymous uploads
  - Note: If you already own the crate, it will not be copied again
  - Note: When an authenticated user copies an anonymous crate, the expiration is removed

### Search & Discovery

- **crates_search**: Find your content using advanced hybrid search
  - Input: `{ query: string, tags?: string[], limit?: number }`
  - Output: `{ crates: [ { id, title, description, category, relevanceScore, ... }, ... ], searchMetadata: { ... } }`
  - Features:
    - Combines vector embeddings for semantic understanding of metadata with text-based search
    - Structured tag filtering (e.g., `tags: ["project:website", "status:final"]`)
    - Tag hierarchy understanding with relevance boosting for conventional tags
    - Note: Content-based semantic search is available in the Pro version
  - Permission: Requires authentication to search user's crates
  - Results: Ranked by relevance, limited to specified limit (default: 10)

## How the MCP Endpoint Works

The **MCP endpoint** (`https://mcp.mcph.io/mcp`) is the only supported way to interact with MCPH programmatically. It uses the Model Context Protocol (MCP) over Streamable HTTP for real-time, bidirectional communication.

1. **Connect via Streamable HTTP:** Use `npx mcp-remote https://mcp.mcph.io/mcp` or configure your client to use the endpoint.
2. **Authentication:** Pass your API key as a Bearer token in the `Authorization` header.
3. **Session:** On connect, you receive a session ID in the `MCP-Session-ID` response header. All subsequent requests must include this ID in the `MCP-Session-ID` header.
4. **Calling Tools:** Send JSON-RPC requests to the endpoint. Example for `crates/list`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "crates/list",
    "arguments": {}
  }
}
```

The response will be streamed using Streamable HTTP, with content delivered as chunks in the HTTP response.

For more details, see the [mcp-remote documentation](https://www.npmjs.com/package/mcp-remote) or the [MCP protocol reference](https://github.com/cloudflare/agents/tree/main/examples/mcp).

## Using MCPH with AI Assistants

MCPH tools integrate with AI assistants like Claude and ChatGPT to provide seamless file management through natural conversation. You can manage your files without learning commands or APIs—just speak naturally about what you want to do.

### Natural Language Commands

- **Managing Files**: "Show me my files", "Save this document", "Delete that old file"
- **Sharing Content**: "Make this public", "Give me a shareable link", "Make this private again"
- **Viewing Content**: "Show me that document", "What's in that file?"

### Key Benefits

- **No learning curve** - talk about files naturally
- **Persistent storage** - files remain accessible across sessions indefinitely for authenticated users, 30 days for anonymous uploads
- **Smart search** - AI finds files using keywords and context
- **Instant sharing** - generate public links with simple requests
- **Cross-session continuity** - reference files from previous conversations

### Getting Started with AI Assistants

#### Claude AI (Recommended - Easiest Setup)

1. **Open Claude AI** and click "Integrations" in the bottom left corner
2. **Add custom integration** and enter: `https://mcp.mcph.io/mcp`
3. **Choose authentication**: OAuth (recommended) or API key
4. **Start using** - Ask Claude to access your MCPH crates and create new content

#### Other AI Assistants

1. **Connect MCPH to your AI assistant** using your API key or OAuth
2. **Use natural language commands** to manage your files
3. **Share content instantly** by simply asking your AI to make content public

For detailed, tool-specific configuration instructions, please visit our [Integrations page](https://mcph.io/integrations).

## REST API (advanced)

> For most users, use the MCP endpoint above. REST endpoints are for advanced/manual use only.

- `POST /api/uploads` – Upload crate
- `GET /api/uploads/:id` – Download crate
- `DELETE /api/uploads/:id` – Delete crate

## Learn More

- [MCP Protocol Overview](https://github.com/cloudflare/agents/tree/main/examples/mcp)
- [mcp-remote npm package](https://www.npmjs.com/package/mcp-remote)
- [mcph.io](https://mcph.io)

---

MCPH is open for public use. For questions or feedback, visit [mcph.io](https://mcph.io).
