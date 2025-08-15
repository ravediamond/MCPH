# MCP Storage Hub Server

This is the Model Context Protocol server for MCPH Storage Hub, an AI artifact storage and organization system. It provides MCP API endpoints that allow AI models to store, organize, search, and manage artifacts in crates with advanced tagging and semantic search capabilities. Anonymous uploads automatically expire after 30 days, while authenticated user uploads have permanent storage.

## What is MCPH Storage Hub?

MCPH Storage Hub is an AI artifact storage and organization system that lets you store, tag, and search your AI-generated content. This MCP server enables AI tools like ChatGPT and Claude to directly store and organize content with intelligent tagging, semantic search, and content categorization. MCPH supports multiple content types including markdown, code, images, JSON, YAML, text, and binary files. Anonymous uploads expire after 30 days, while authenticated users get permanent storage with advanced organization features.

## Example Prompts

Here are example prompts showcasing MCPH Storage Hub's organization and search capabilities:

### 1. Store with Smart Tagging

```
I want to upload my React component code and organize it properly. Here's the component:

[paste your React component code here]

Please store this as a crate with the title "UserProfile Component" and tag it with "project:frontend", "component:user", and "status:review-ready" so I can find it easily later.
```

### 2. Semantic Search for Related Content

```
I'm working on user authentication. Search for any crates related to authentication, login, or user management - even if they don't have those exact words in the title.
```

### 3. Organize by Categories and Tags

```
I have a database configuration file that needs secure storage. Please upload this configuration file with password protection:

[paste your config file here]

Title it "Database Config - Production", categorize it as "Data", and tag it with "env:production", "type:config", and "security:sensitive" for easy filtering.
```

## Core MCP Tools

### Fetching Crate Data

- **crates_list**: List crates owned by the authenticated user.
  - Input: `{ limit?: number, startAfter?: string }`
  - Output: Paginated list of crates with metadata (including expiration dates for anonymous uploads)
  - Permissions: Requires authentication

- **crates_get**: Get the content of a crate by ID.
  - Input: `{ id: string, password?: string }`
  - Output: Content of the crate (text, image, or download info)
  - Permissions:
    - Owner can always access
    - Anonymous uploads are public by default (expire after 30 days)
    - Password-protected crates require a password
  - Note: Will return an error if the crate has expired

- **crates_get_download_link**: Generate a pre-signed download URL for a crate.
  - Input: `{ id: string, expiresInSeconds?: number }`
  - Output: `{ url: string, validForSeconds: number, expiresAt: string }`
  - Permissions: Same as crates_get
  - Note: Default expiration is 24 hours for the download link
  - Note: Will return an error if the crate has expired

- **crates_search**: Advanced semantic search with intelligent filtering.
  - Input: `{ query: string, tags?: string[], category?: string, limit?: number }`
  - Output: List of matching crates with relevance scores and search insights
  - Features:
    - **Semantic Search**: Vector embeddings understand meaning, not just keywords
    - **Smart Tag Filtering**: Hierarchical tag support (e.g., `project:webapp`, `env:production`)
    - **Category Filtering**: Search within specific content categories
    - **Relevance Scoring**: Results ranked by semantic similarity and tag matching
    - **Natural Language**: "Find authentication code" matches auth-related content
    - **Cross-Content Discovery**: Finds related content you didn't know you had
  - Permissions: Requires authentication

### Creating & Managing Crates

- **crates_upload**: Upload a new crate.
  - Input: `{ fileName: string, contentType: string, data?: string, ... }`
  - Output (text): `{ crate: object }`
  - Output (binary): `{ uploadUrl: string, crateId: string }`
  - Permissions: Requires authentication (except anonymous uploads)
  - Note: Anonymous uploads expire after 30 days, authenticated user uploads have no expiration

- **crates_update**: Update an existing crate.
  - Input: `{ id: string, title?: string, description?: string, data?: string, ... }`
  - Output: `{ crate: object }`
  - Permissions: Owner only
  - Note: Updates content, metadata, or organizational information while preserving the crate ID, sharing settings, and creation timestamp

- **crates_delete**: Delete a crate permanently.
  - Input: `{ id: string }`
  - Output: Confirmation message
  - Permissions: Owner only
  - Note: Requires user confirmation via elicitation

### Sharing Controls

- **crates_share**: Make a crate public or password-protected.
  - Input: `{ id: string, password?: string }`
  - Output: `{ id: string, shareUrl: string }`
  - Permissions: Owner only

- **crates_unshare**: Make a crate private.
  - Input: `{ id: string }`
  - Output: Confirmation message
  - Permissions: Owner only

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

The MCP server shares code with the main MCPH application:

- `/lib`: Common utility functions and helpers
- `/services`: Shared services for Firebase, storage, etc.
- `/app/types`: Common type definitions

## Environment Variables

Environment variables are stored in `.env.local`. For production, these are set in the Cloud Run configuration.

## Docker

The Docker image is built using the `Dockerfile` in this directory. It includes only the necessary files and dependencies for the MCP server.
```
