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
- **Feedback Collection System**: Create custom feedback templates with various field types (text, rating, select, etc.) to collect structured feedback on your projects

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

## 🚀 6 Power Use Cases for MCPH

### 1. Persistent AI Memory System 🧠

Transform AI into a learning partner that remembers everything across sessions. Build a searchable knowledge base that grows smarter over time.

**Implementation Steps:**

1. **Upload project contexts**: "Save our coding standards as a crate"
2. **Tag systematically**: `project:webapp`, `type:guidelines`, `team:frontend`
3. **Search & retrieve**: "Find our React component patterns"
4. **AI remembers**: "Apply our coding standards to this new component"

**Real Example:** Store your API error handling patterns once, and every AI session can reference them: "How do we handle auth errors in our system?"

### 2. Living Documentation That Updates Itself 📚

Documentation that evolves with your code. When you change features, AI updates all related docs automatically.

**Implementation Steps:**

1. **Create base docs**: README, API specs, architecture diagrams
2. **Link with tags**: `doc:api-v2`, `component:auth`, `version:latest`
3. **Update cascade**: "Update all auth documentation after this refactor"
4. **AI maintains consistency** across all docs

**Real Example:** Change your database schema → AI updates ERD diagrams, migration guides, and API docs in connected crates.

### 3. Multi-Agent Project Pipeline 🤝

Different AI specialists working together on your project, each handling what they do best.

**Implementation Steps:**

1. **Claude (Architect)**: Creates system design → saves to crate
2. **ChatGPT (Developer)**: Reads design → implements code → saves to crate
3. **Gemini (Tester)**: Reads both → writes test suite → saves to crate
4. **Share progress**: One link shows entire project evolution

**Real Example:** Building a chat app where each AI handles their specialty, all coordinated through shared crates.

### 4. Instant Project Context Switching 🎯

Switch between projects instantly with full context. Each project has its own "brain" that any AI can load.

**Implementation Steps:**

1. **Create project crate**: Stack, conventions, architecture, team notes
2. **Share the link with your AI**: "Load context: mcph.io/crate/abc123"
3. **AI instantly knows**: Tech stack, coding style, business rules
4. **Update as needed**: Context evolves with your project

**Real Example:** "Switch to the e-commerce project" → AI immediately knows to use Next.js, Stripe APIs, and your custom auth flow.

### 5. Dynamic Feedback Collection System 📊

Build smart surveys that adapt based on responses, with AI analyzing feedback in real-time.

**Implementation Steps:**

1. **Create feedback template**: Rating + select + text fields
2. **Share form link**: Send to users or embed in your app
3. **Collect responses**: All data stored in your account
4. **AI analyzes**: "What patterns do you see in user feedback?"
5. **Iterate**: Update product based on insights

**Real Example:** Create a bug report form that AI monitors. When similar bugs are reported, AI can suggest known fixes or escalate critical issues.

### 6. Knowledge Graph Builder 🕸️

Connect ideas, research, and insights into a searchable knowledge network that reveals hidden patterns.

**Implementation Steps:**

1. **Store insights**: Tag with topics, dates, projects, connections
2. **Build over time**: Each crate adds to your knowledge graph
3. **Discover patterns**: "What connects my AI and education research?"
4. **Share discoveries**: One link to entire research threads
5. **AI synthesizes**: "Summarize my thinking evolution on AI ethics"

**Real Example:** Research competitive products → store findings in tagged crates → AI reveals market gaps you hadn't noticed.

### Anonymous vs. Logged-in Users

MCPH offers different capabilities depending on whether you are logged in or using the service anonymously:

| Feature         | Anonymous Users | Logged-in Users |
| --------------- | --------------- | --------------- |
| Download Crates | ✓               | ✓               |
| Upload Crates   | ✗               | ✓               |
| Search Crates   | ✗               | ✓               |
| Delete Crates   | ✗               | ✓               |
| Manage API Keys | ✗               | ✓               |
| Create Feedback | ✗               | ✓ (5 templates) |
| Submit Feedback | ✓               | ✓               |

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

MCPH provides a comprehensive set of powerful tools that enable you to manage your content through the Model Context Protocol (MCP). These tools can be used programmatically or through AI assistants using natural language commands.

### Content Management

- **crates_list**: List and discover your stored crates
  - **Input**: `{ limit?: number, startAfter?: string, category?: string }`
  - **Output**: `{ crates: [ { id, title, description, category, tags, shared, ... }, ... ], lastCrateId, hasMore }`
  - **Features**: Pagination support, category filtering (including 'feedback' templates), tag-based organization
  - **Permissions**: Requires authentication; shows only user's crates
  - **AI Usage**: "List my crates", "Show my feedback templates", "Find my recent uploads"

- **crates_get**: Retrieve and display crate contents
  - **Input**: `{ id: string, password?: string }`
  - **Output**: `{ content: [ { type: 'text|image', text|data, mimeType? }, ... ], metadata: {...} }`
  - **Features**: Supports all content types, handles password-protected crates, rich metadata access
  - **Permissions**: Owner access always; public crate access based on sharing settings
  - **AI Usage**: "Show me crate abc123", "Get the content of that document", "Display my project specs"

- **crates_upload**: Create and store new content with smart tagging
  - **Input**: `{ fileName: string, contentType: string, data: string, title?: string, description?: string, tags?: string[], category?: string, isPublic?: boolean, password?: string }`
  - **Output**: `{ crate: CrateObject, content: [...] }` or `{ uploadUrl, crateId }` (for large files)
  - **Features**: Intelligent categorization, tagging best practices, dual upload methods, expiration handling
  - **Permissions**: Authenticated users get permanent storage; anonymous uploads expire in 30 days
  - **AI Usage**: "Upload this file as a crate titled 'Project Requirements'", "Save this with tags project:webapp, type:specs"

- **crates_update**: Modify existing crate metadata and content
  - **Input**: `{ id: string, title?: string, description?: string, tags?: string[], metadata?: object, shared?: object }`
  - **Output**: `{ success: true, crate: UpdatedCrateObject, content: [...] }`
  - **Features**: Update any crate property, manage sharing settings, modify templates (open/close status)
  - **Permissions**: Only crate owners can update their crates
  - **AI Usage**: "Update the title of crate abc123", "Add tags to my project crate", "Make my template private"

- **crates_delete**: Remove unwanted crates permanently
  - **Input**: `{ id: string }`
  - **Output**: `{ success: true, content: [...] }`
  - **Features**: Complete removal of content and metadata, irreversible operation
  - **Permissions**: Only crate owners can delete their crates
  - **AI Usage**: "Delete crate abc123", "Remove that old document", "Clean up my test files"

### Sharing & Access Control

- **crates_share**: Make content accessible to others with advanced options
  - **Input**: `{ id: string, public?: boolean, passwordProtected?: boolean, password?: string, removePassword?: boolean }`
  - **Output**: `{ id, isShared, shareUrl, passwordProtected, content: [...] }`
  - **Features**: Public/private toggle, password protection, shareable URLs, access control
  - **Permissions**: Only crate owners can modify sharing settings
  - **AI Usage**: "Make crate abc123 public", "Share this with password protection", "Generate a share link"

- **crates_make_public**: Quick public sharing for immediate access
  - **Input**: `{ id: string }`
  - **Output**: `{ id, isShared: true, shareUrl, content: [...] }`
  - **Features**: One-click public sharing, instant shareable URL generation
  - **Permissions**: Only crate owners can make their crates public
  - **AI Usage**: "Make this public", "Share this crate publicly", "Generate public link"

- **crates_unshare**: Remove public access and return to private
  - **Input**: `{ id: string }`
  - **Output**: `{ success: true, content: [...] }`
  - **Features**: Complete privacy restoration, removes public access and passwords
  - **Permissions**: Only crate owners can unshare their crates
  - **AI Usage**: "Make crate abc123 private", "Remove public access", "Unshare this document"

- **crates_get_download_link**: Generate secure, time-limited download URLs
  - **Input**: `{ id: string, expiresInSeconds?: number }`
  - **Output**: `{ url: string, validForSeconds: number, content: [...] }`
  - **Features**: Configurable expiration, secure signed URLs, direct download support
  - **Use Cases**: Binary files, large content, temporary access, external integrations
  - **AI Usage**: "Create download link for crate abc123", "Generate 1-hour access URL"

- **crates_copy**: Duplicate public crates to your collection
  - **Input**: `{ id: string }`
  - **Output**: `{ crate: NewCrateObject, content: [...] }`
  - **Features**: Complete duplication, removes "Copy of" prefix, converts to private ownership
  - **Permissions**: Can copy public crates and anonymous uploads; removes expiration on copy
  - **AI Usage**: "Copy this public crate", "Save a copy of crate abc123 to my collection"

### Advanced Search & Discovery

- **crates_search**: Find content using intelligent hybrid search
  - **Input**: `{ query: string, tags?: string[], category?: string, limit?: number }`
  - **Output**: `{ crates: [ { id, title, description, relevanceScore, category, tags, ... }, ... ], searchMetadata: {...} }`
  - **Features**:
    - Semantic search with vector embeddings for metadata understanding
    - Tag-based filtering with hierarchical support (`project:webapp`, `type:docs`)
    - Category filtering (including feedback templates: `category: 'feedback'`)
    - Relevance scoring and intelligent ranking
    - Full-text search across titles, descriptions, and tags
  - **Permissions**: Searches only user's crates; requires authentication
  - **AI Usage**: "Find my React components", "Search for project documentation", "Find feedback templates about mobile apps"

### Feedback Collection System

- **feedback_template_create**: Build custom feedback forms with validation
  - **Input**: `{ title: string, description?: string, fields: Array<FieldConfig>, isPublic?: boolean, tags?: string[], linkedCrates?: string[] }`
  - **Output**: `{ success: true, template: FeedbackTemplate, content: [...] }`
  - **Features**:
    - 6 field types: text, number, boolean, select, multiselect, rating
    - Custom validation rules, required/optional fields, dropdown options
    - Automatic storage as both feedback template AND crate (category: 'feedback')
    - Tag-based organization, public/private templates, linked crate references
  - **Limits**: 5 templates per user (Free), 50 templates (Pro)
  - **AI Usage**: "Create feedback form for product reviews", "Build survey with rating and text fields"

- **feedback_submit**: Submit responses to feedback templates with validation
  - **Input**: `{ templateId: string, responses: Record<string, any>, metadata?: Record<string, any> }`
  - **Output**: `{ success: true, response: FeedbackResponse, content: [...] }`
  - **Features**:
    - Field-specific validation (type checking, required fields, option validation)
    - Support for all field types with proper formatting
    - Anonymous submissions supported, metadata tracking
    - Real-time validation with helpful error messages
  - **Permissions**: Anyone can submit to open public templates
  - **AI Usage**: "Submit feedback to template abc123", "Fill out the product survey"

- **feedback_responses_get**: Analyze feedback data with comprehensive analytics
  - **Input**: `{ templateId: string, limit?: number, startAfter?: string }`
  - **Output**: `{ success: true, template: TemplateInfo, responses: [...], statistics: {...}, pagination: {...}, content: [...] }`
  - **Features**:
    - Complete response analytics: averages, distributions, response rates
    - Field-specific statistics (ratings, selections, text analysis)
    - User identification with email/name display (when available)
    - Pagination support for large datasets, export-ready format
    - Comprehensive insights for data-driven decisions
  - **Permissions**: Only template owners can access response data
  - **AI Usage**: "Show responses for my feedback template", "Analyze survey results", "Get feedback analytics"

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
- **Collecting Feedback**: "Create a feedback form for my product", "Show me responses to my survey", "Close this feedback template"

### Key Benefits

- **No learning curve** - talk about files naturally
- **Persistent storage** - files remain accessible across sessions indefinitely for authenticated users, 30 days for anonymous uploads
- **Smart search** - AI finds files using keywords and context
- **Instant sharing** - generate public links with simple requests
- **Cross-session continuity** - reference files from previous conversations
- **Feedback collection** - create structured forms and collect responses with analytics

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
