[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/mcp-hub.svg)](https://www.npmjs.com/package/mcp-hub)
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Vercel](https://vercelbadge.vercel.app/api/OWNER/REPO)](https://vercel.com/OWNER/REPO)
[![Open Issues](https://img.shields.io/github/issues/OWNER/REPO.svg)](https://github.com/OWNER/REPO/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/OWNER/REPO.svg)](https://github.com/OWNER/REPO/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/OWNER/REPO.svg)](https://github.com/OWNER/REPO/commits/main)
[![Forks](https://img.shields.io/github/forks/OWNER/REPO.svg?style=social&label=Fork)](https://github.com/OWNER/REPO/fork)
[![Stars](https://img.shields.io/github/stars/OWNER/REPO.svg?style=social&label=Star)](https://github.com/OWNER/REPO)

# MCPHub: Model Context Protocol (MCP) Server

MCPHub is a public remote crate server for the Model Context Protocol (MCP). It supports real-time crate management and sharing via the MCP protocol over Server-Sent Events (SSE).

## Features at a Glance

- **Direct AI Integration**: Connect ChatGPT, Claude, and other MCP-compatible AI tools directly to share content
- **Multiple Content Types**: Share markdown, code, images, JSON, and binary files
- **Security Features**: Password protection and automatic 30-day expiration for all content
- **Simple Sharing**: Generate shareable links that anyone can access - no login required to view content
- **Enhanced Content Preview**: Better visualization and interaction with different content types
- **MCP Protocol Support**: Built on the standardized Model Context Protocol for AI interoperability

## Quick Start

- **SSE Endpoint:** `https://mcp.mcph.io/`
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
npx mcp-remote https://mcp.mcph.io/
```

Or configure your client:

```json
{
  "mcpServers": {
    "mcphub": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.mcph.io/"]
    }
  }
}
```

### Authentication

Pass your API key as a Bearer token in the `Authorization` header if required.

## Available MCP Tools (via SSE)

- **crates/list**: List all available crates.
  - Output: `{ crates: [ { id, fileName, ... }, ... ], content: [ { type: 'text', text: 'IDs: ...' } ] }`
- **crates/get**: Get the raw crate data for a specific crate by id.
  - Output: `{ crate: { ...meta }, content: [ { type: 'text', text: '...' } ] }` (binary files return a download link)
- **crates/get_metadata**: Get all metadata fields as text for a specific crate by id.
  - Output: `{ crate: { ...meta }, content: [ { type: 'text', text: 'key: value\n...' } ] }`
- **crates/search**: Search for crates by query string in fileName or description.
  - Output: `{ crates: [ ... ], content: [ { type: 'text', text: 'IDs: ...' } ] }`
- **crates/upload**: Upload a new crate. For binary files, returns a presigned upload URL. For text, uploads directly.
  - Output: `{ uploadUrl, fileId, gcsPath, message }` (binary) or `{ crate, message }` (text)
- **crates/[id]/share**: Update a crate's sharing settings with unified link management.
  - Input: `{ public: boolean, passwordProtected: boolean, password?: string, removePassword?: boolean }`
  - Output: `{ id, isShared, passwordProtected, shareUrl, message }`
- **crates/[id]/content**: Optimized endpoint for content retrieval with caching and direct access.
  - Supports both GET (with optional URL params) and POST (with JSON body for password)

## How the SSE Endpoint Works

- Connect via SSE: `npx mcp-remote https://mcp.mcph.io/`
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
