[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/mcph.svg)](https://www.npmjs.com/package/mcph)
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Vercel](https://vercelbadge.vercel.app/api/OWNER/REPO)](https://vercel.com/OWNER/REPO)
[![Open Issues](https://img.shields.io/github/issues/OWNER/REPO.svg)](https://github.com/OWNER/REPO/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/OWNER/REPO.svg)](https://github.com/OWNER/REPO/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/OWNER/REPO.svg)](https://github.com/OWNER/REPO/commits/main)
[![Forks](https://img.shields.io/github/forks/OWNER/REPO.svg?style=social&label=Fork)](https://github.com/OWNER/REPO/fork)
[![Stars](https://img.shields.io/github/stars/OWNER/REPO.svg?style=social&label=Star)](https://github.com/OWNER/REPO)

# MCPH: Model Context Protocol (MCP) Server

## 🗜️ MCPH — a USB stick for your AI

![MCPH Demo](https://mcph.io/assets/demo.gif)

MCPH is a public remote crate server for the Model Context Protocol (MCP). It supports real-time crate management and sharing via the MCP protocol over Server-Sent Events (SSE).

## Features at a Glance

- **Direct AI Integration**: Connect ChatGPT, Claude, and other MCP-compatible AI tools directly to share content
- **Multiple Content Types**: Share markdown, code, images, JSON, and binary files
- **Security Features**: Password protection and automatic 30-day expiration for all content
- **Simple Sharing**: Generate shareable links that anyone can access - no login required to view content
- **Enhanced Content Preview**: Better visualization and interaction with different content types
- **MCP Protocol Support**: Built on the standardized Model Context Protocol for AI interoperability

## Quick Start

- **MCP Endpoint:** `https://mcp.mcph.io/mcp`
- **Web UI:** [mcph.io](https://mcph.io)
- **Crate Page:** `https://mcph.io/crate/[id]`

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
    "mcphub": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.mcph.io/mcp"]
    }
  }
}
```

### Authentication

Pass your API key as a Bearer token in the `Authorization` header if required.

## Available MCP Tools (via SSE)

- **crates_list**: List all available crates owned by the authenticated user.
  - Input: `{ limit?: number, startAfter?: string }`
  - Output: `{ crates: [ { id, title, description, category, ... }, ... ], lastCrateId, hasMore }`
  - Pagination: Use `limit` (default: 20, max: 100) and `startAfter` (ID of the last crate from the previous page)
  - Permission: Requires authentication to list user's crates
  - Sort: Most recent crates first

- **crates_get**: Get the content of a specific crate by ID.
  - Input: `{ id: string, password?: string }`
  - Output: `{ content: [ { type: 'text|image', text|data, mimeType? }, ... ] }`
  - Permission:
    - Owner can always access their crates
    - Anonymous uploads are public by default
    - Password-protected crates require the password parameter
    - For binary files, directs to use `crates_get_download_link` instead

- **crates_get_download_link**: Generate a pre-signed download URL for a crate.
  - Input: `{ id: string, expiresInSeconds?: number }`
  - Output: `{ url: string, validForSeconds: number }`
  - Useful for: Binary files, large files, or direct downloads
  - Default expiration: 24 hours (can be customized with `expiresInSeconds`)

- **crates_search**: Search for crates by query text.
  - Input: `{ query: string }`
  - Output: `{ crates: [ { id, title, description, category, ... }, ... ] }`
  - Search covers: title, description, tags, and metadata
  - Permission: Requires authentication to search user's crates
  - Results: Ranked by relevance, limited to 10 most relevant matches

- **crates_upload**: Upload a new crate.
  - Input: `{ fileName: string, contentType: string, data: string, ... }`
  - Output (binary): `{ uploadUrl, fileId, gcsPath, message }`
  - Output (text): `{ crate, message }`
  - Small text content is uploaded directly; large/binary files return a pre-signed upload URL

- **crates_share**: Update a crate's sharing settings.
  - Input: `{ id: string, password?: string }`
  - Output: `{ id, isShared, shareUrl, message }`
  - Options: Make public or password-protected

- **crates_unshare**: Make a crate private by removing all sharing settings.
  - Input: `{ id: string }`
  - Output: `{ message, ... }`
  - Removes public access and password protection

- **crates_delete**: Permanently delete a crate.
  - Input: `{ id: string }`
  - Output: `{ message }`
  - Removes both the crate content and metadata
  - Permission: Only the owner can delete their crates

## How the SSE Endpoint Works

- Connect via SSE: `npx mcp-remote https://mcp.mcph.io/mcp`
- On connect, you receive an `endpoint` event with your session URL. All JSON-RPC requests must include your `sessionId` as a query parameter.
- Send JSON-RPC requests to the endpoint. Example for `crates/list`:

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

The response will be streamed as an SSE `message` event with the result.

## Using MCPH with AI Assistants

MCPH integrates seamlessly with AI assistants like Claude and ChatGPT, enabling natural language file management without learning complex commands.

### Natural Language Commands

- **Managing Files**: "Show me my files", "Save this document", "Delete that old file"
- **Sharing Content**: "Make this public", "Give me a shareable link", "Make this private again"
- **Viewing Content**: "Show me that document", "What's in that file?"

### Key Benefits

- **No learning curve** - talk about files naturally
- **Persistent storage** - files remain accessible across sessions for 30 days
- **Smart search** - AI finds files using keywords and context
- **Instant sharing** - generate public links with simple requests
- **Cross-session continuity** - reference files from previous conversations

### Getting Started with AI Assistants

1. **Connect MCPH to your AI assistant** using your API key
2. **Use natural language commands** to manage your files
3. **Share content instantly** by simply asking your AI to make content public

For detailed instructions and examples, visit our [documentation](https://mcph.io/docs).

## REST API (advanced)

> For most users, use the SSE endpoint above. REST endpoints are for advanced/manual use only.

- `POST /api/uploads` – Upload crate
- `GET /api/uploads/:id` – Download crate
- `DELETE /api/uploads/:id` – Delete crate

## Learn More

- [MCP Protocol Overview](https://github.com/cloudflare/agents/tree/main/examples/mcp)
- [mcp-remote npm package](https://www.npmjs.com/package/mcp-remote)
- [mcph.io](https://mcph.io)

---

MCPHub is open for public use. For questions or feedback, visit [mcph.io](https://mcph.io).
