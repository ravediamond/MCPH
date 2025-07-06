# MCP Server

This is the Model Context Protocol server for MCPH, an AI artifact storage and sharing system. It provides the MCP API endpoints that allow AI models to interact with the MCPH services for storing, sharing, and managing artifacts in crates. Anonymous uploads automatically expire after 30 days, while authenticated user uploads have no expiration.

## What is MCPH?

MCPH is an artifact storage and sharing system for AI tools—store, share, and manage artifacts in crates with one command. This MCP server implementation enables AI tools like ChatGPT and Claude to directly package and share content via simple API calls. MCPH supports multiple content types including markdown, code, images, JSON, YAML, text, and binary files. Anonymous uploads automatically expire after 30 days, while content from authenticated users is stored indefinitely.

## Example Prompts

Here are three working example prompts to get you started with MCPH:

### 1. Upload and Share a Project File

```
I want to upload my React component code to share with my team. Here's the component:

[paste your React component code here]

Please upload this as a crate with the title "UserProfile Component" and tag it as "project:frontend" and "status:review-ready".
```

### 2. Search and Retrieve Team Resources

```
I'm looking for any markdown documentation files related to our API project. Search for crates tagged with "project:api" that contain documentation or guides.
```

### 3. Create a Password-Protected Code Snippet

```
I need to share a database configuration file with my teammate, but it contains sensitive information. Please upload this configuration file and make it password-protected with the password "team2024":

[paste your config file here]

Title it "Database Config - Production" and tag it as "project:backend" and "status:sensitive".
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

- **crates_search**: Search for crates with advanced filtering.
  - Input: `{ query: string, tags?: string[], limit?: number }`
  - Output: List of matching crates with relevance scores
  - Features:
    - Text search across title, description, tags, and metadata fields (not crate content)
    - Vector embeddings for semantic understanding of metadata
    - Structured tag filtering (e.g., `tags: ["project:website", "status:final"]`)
    - Tag hierarchy understanding with relevance boosting for conventional tags
    - Note: Content-based semantic search is available in the Pro version
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
