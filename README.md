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

MCPHub is a public remote artifact server for the Model Context Protocol (MCP). It supports real-time artifact management and sharing via the MCP protocol over Server-Sent Events (SSE).

## Quick Start

- **SSE Endpoint:** `https://mcph.io/api/sse`
- **Web UI:** [mcph.io](https://mcph.io)
- **Artifact Page:** `https://mcph.io/artifact/[id]`

### Connect with mcp-remote

```sh
npx mcp-remote https://mcph.io/api/sse
```

Or configure your client:

```json
{
  "mcpServers": {
    "mcphub": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcph.io/api/sse"]
    }
  }
}
```

### Authentication

Pass your API key as a Bearer token in the `Authorization` header if required.

## Available MCP Tools (via SSE)

- **artifacts/list**: List all available artifacts.
  - Output: `{ artifacts: [ { id, fileName, ... }, ... ], content: [ { type: 'text', text: 'IDs: ...' } ] }`
- **artifacts/get**: Get the raw artifact data for a specific artifact by id.
  - Output: `{ artifact: { ...meta }, content: [ { type: 'text', text: '...' } ] }` (binary files return a download link)
- **artifacts/get_metadata**: Get all metadata fields as text for a specific artifact by id.
  - Output: `{ artifact: { ...meta }, content: [ { type: 'text', text: 'key: value\n...' } ] }`
- **artifacts/search**: Search for artifacts by query string in fileName or description.
  - Output: `{ artifacts: [ ... ], content: [ { type: 'text', text: 'IDs: ...' } ] }`
- **artifacts/upload**: Upload a new artifact. For binary files, returns a presigned upload URL. For text, uploads directly.
  - Output: `{ uploadUrl, fileId, gcsPath, message }` (binary) or `{ artifact, message }` (text)
- **artifacts/share**: Make an artifact shareable (public link) and optionally set/remove a password.
  - Output: `{ id, isShared, password, shareUrl, message }`

## How the SSE Endpoint Works

- Connect via SSE: `npx mcp-remote https://mcph.io/api/sse`
- On connect, you receive an `endpoint` event with your session URL. All JSON-RPC requests must include your `sessionId` as a query parameter.
- Send JSON-RPC requests to the endpoint. Example for `artifacts/list`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "artifacts/list",
    "arguments": {}
  }
}
```

The response will be streamed as an SSE `message` event with the result.

## REST API (advanced)

> For most users, use the SSE endpoint above. REST endpoints are for advanced/manual use only.

- `POST /api/uploads` – Upload artifact
- `GET /api/uploads/:id` – Download artifact
- `DELETE /api/uploads/:id` – Delete artifact

## Learn More

- [MCP Protocol Overview](https://github.com/cloudflare/agents/tree/main/examples/mcp)
- [mcp-remote npm package](https://www.npmjs.com/package/mcp-remote)
- [mcph.io](https://mcph.io)

---

MCPHub is open for public use. For questions or feedback, visit [mcph.io](https://mcph.io).
