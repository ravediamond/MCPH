# MCP Server

This is the Model Context Protocol server for MCPHub, the USB stick for AI tools. It provides the MCP API endpoints that allow AI models to interact with the MCPHub services for storing, sharing, and auto-expiring files and outputs.

## What is MCPH?

MCPH is a modern USB key for AI agents—store, share, and auto-expire artifacts in one command. This MCP server implementation enables AI tools like ChatGPT and Claude to directly "plug in" and store/share content via simple API calls, functioning like a virtual USB stick for AI outputs.

## Authentication Flow

The MCP server uses a middleware chain to authenticate requests:

1. `apiKeyAuthMiddleware`: Validates API keys and sets `req.user` with the authenticated user info
2. `mapUserToAuth`: Maps `req.user` to `req.auth` format expected by the MCP SDK
3. MCP SDK's `StreamableHTTPServerTransport`: Forwards `req.auth` to tool handlers as `extra.authInfo`

Tools should access the authenticated user via `extra.authInfo?.clientId` with fallback to `req.user.userId` for backward compatibility.

## Development

To run the MCP server in development mode:

```bash
# From the mcp directory
npm run dev

# Or from the root directory
npm run dev:mcp
```

## Building

To build the MCP server:

```bash
# From the mcp directory
npm run build

# Or from the root directory
npm run build:mcp
```

# Or from the root directory

npm run build:mcp

```

## Deployment

The MCP server is deployed to Google Cloud Run. The deployment is automated through Cloud Build using the `cloudbuild.yaml` configuration file.

## Shared Code

The MCP server shares code with the main MCPHub application:

- `/lib`: Common utility functions and helpers
- `/services`: Shared services for Firebase, storage, etc.
- `/app/types`: Common type definitions

## Environment Variables

Environment variables are stored in `.env.local`. For production, these are set in the Cloud Run configuration.

## Docker

The Docker image is built using the `Dockerfile` in this directory. It includes only the necessary files and dependencies for the MCP server.
```
