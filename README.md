[![Build Status](https://github.com/yourusername/MCPHub/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/MCPHub/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/mcp-hub.svg)](https://www.npmjs.com/package/mcp-hub)

# MCPHub: Model Context Protocol (MCP) Remote Artifact Server

**Website:** [https://mcph.io](https://mcph.io)
**MCP SSE Endpoint:** `https://mcph.io/sse`

## What is MCP?

The **Model Context Protocol (MCP)** is a standardized way for AI models, agents, and tools to maintain, share, and reference context across interactions. MCP enables:

- Persistent, portable context for AI models
- Secure sharing of context and artifacts between users, agents, and tools
- Improved coherence and utility in AI-powered workflows

## About MCPHub

MCPHub is a public, remote MCP server for storing and sharing artifacts (files, data, diagrams, etc.) using the MCP protocol. It implements the official MCP specification, including:

- **SSE (Server-Sent Events) support** for real-time context streaming
- Secure artifact upload, download, and sharing
- Expiry and access control for all artifacts

### Key Features

- **Remote MCP server**: Connect from any MCP-compatible client (e.g., Claude Desktop, Cursor, Windsurf)
- **SSE endpoint**: Real-time context and artifact streaming
- **OAuth-ready**: Secure authentication for future integrations
- **Web UI**: Upload, manage, and share artifacts at [mcph.io](https://mcph.io)

## How to Connect (with `mcp-remote`)

You can connect your local MCP client to MCPHub using the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) package:

```sh
npx mcp-remote https://mcph.io/sse
```

Or add to your MCP client config (e.g., Cursor, Claude Desktop):

```json
{
  "mcpServers": {
    "mcphub": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcph.io/sse"]
    }
  }
}
```

- Supports custom headers and OAuth for secure access
- Choose transport: `--transport sse-only` for SSE, or default for HTTP+SSE fallback

## Available Tools

MCPHub exposes the following tools via MCP:

- **artifacts/upload**: Upload a new artifact
- **artifacts/get_metadata**: Get metadata for an artifact
- **artifacts/download**: Download an artifact
- **artifacts/search**: Search for artifacts
- **artifacts/delete**: Delete an artifact (if authorized)

## API Documentation (Simple)

- **SSE Endpoint:** `https://mcph.io/sse` (MCP protocol)
- **Web Upload:** `https://mcph.io/upload`
- **Artifact Page:** `https://mcph.io/artifact/[id]`
- **REST API:** (for advanced users)
  - `POST /api/uploads` – Upload artifact
  - `GET /api/uploads/:id` – Download artifact
  - `DELETE /api/uploads/:id` – Delete artifact
  - `GET /api/sse` – SSE endpoint for MCP

## Example Usage

**Upload an artifact via Web UI:**

1. Go to [https://mcph.io/upload](https://mcph.io/upload)
2. Select your artifact, set expiry, and upload
3. Share the generated link or use in your MCP client

**Connect from an MCP client:**

```sh
npx mcp-remote https://mcph.io/api/sse
```

**Search for artifacts:**

- Use the web UI or the `artifacts/search` tool via MCP

## Learn More

- [MCP Protocol Overview](https://github.com/cloudflare/agents/tree/main/examples/mcp)
- [mcp-remote npm package](https://www.npmjs.com/package/mcp-remote)
- [mcph.io](https://mcph.io)

---

MCPHub is open for public use. For questions or feedback, visit [mcph.io](https://mcph.io).
