# MCP Server

This is the Model Context Protocol server for MCPHub. It provides the MCP API endpoints that allow AI models to interact with the MCPHub services.

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
