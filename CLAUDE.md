# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCPH (Model Context Protocol Hub) is a full-stack application that provides AI artifact storage and sharing. It consists of:

1. **Next.js Frontend** - React-based web interface with TypeScript
2. **MCP Server** - Express-based API server implementing Model Context Protocol
3. **Firebase Backend** - Firestore database and Firebase Auth
4. **Google Cloud Storage** - File storage for artifacts

## Architecture

### Frontend (Next.js App Router)
- **App Router Structure**: Uses Next.js 15+ app directory structure
- **Authentication**: Firebase Auth with custom AuthContext (`contexts/AuthContext.tsx`)
- **UI Components**: Located in `components/` with reusable UI components in `components/ui/`
- **Styling**: Tailwind CSS with dark theme as default
- **State Management**: React Context for auth and upload transitions

### MCP Server (`/mcp` directory)
- **Express Server**: Located in `mcp/src/server/express.ts`
- **MCP Tools**: Individual tools in `mcp/src/tools/` (crates_*, each implementing specific functionality)
- **Authentication**: API key-based auth with Firebase Admin SDK
- **Rate Limiting**: Per-user and per-API-key limits

### Data Layer
- **Firebase Service**: `services/firebaseService.ts` handles all Firestore operations
- **Storage Service**: `services/storageService.ts` manages Google Cloud Storage
- **Types**: Shared types in `shared/types/crate.ts` and `lib/types/crate.ts`

## Development Commands

### Frontend Development
```bash
# Start Next.js development server
npm run dev

# Build Next.js application
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run both type checking and linting
npm run check
```

### MCP Server Development
```bash
# Start MCP server in development mode
npm run dev:mcp

# Build MCP server
npm run build:mcp

# Start production MCP server
npm run start:mcp

# Build both frontend and MCP server
npm run build:all
```

## Key Development Patterns

### MCP Tool Implementation
Each MCP tool follows this pattern:
1. Located in `mcp/src/tools/[tool_name].ts`
2. Exports a `register[ToolName]Tool(server: McpServer)` function
3. Implements input validation with Zod schemas
4. Uses Firebase Admin SDK for data operations
5. Includes proper error handling and logging

### Component Architecture
- **Layout Components**: `components/layout/` for app structure
- **Feature Components**: Organized by feature (home, auth, admin)
- **UI Components**: Reusable components in `components/ui/`
- **Context Providers**: Wrap components for state management

### API Route Structure
- **Admin APIs**: `/app/api/admin/` for admin-only operations
- **User APIs**: `/app/api/user/` for authenticated user operations
- **Public APIs**: `/app/api/` for public endpoints
- **MCP Endpoint**: Separate Express server in `/mcp`

## Firebase Configuration

### Authentication
- Firebase Auth is configured in `lib/firebaseClient.ts`
- Admin SDK in `lib/firebaseAdmin.ts` and `services/firebaseService.ts`
- Environment variables required: `GOOGLE_APPLICATION_CREDENTIALS`

### Firestore Collections
- `crates`: Main crate metadata
- `apiKeys`: User API keys (hashed)
- `metrics`: Usage metrics and counters
- `events`: System events and logs
- `apiKeyUsage`: API key usage tracking
- `userUsage`: User usage tracking

## Testing

Currently no automated tests are configured. When adding tests:
- Use Jest for unit tests
- Consider React Testing Library for component tests
- Test MCP tools with proper mocking of Firebase

## Important Notes

### Security
- All API keys are hashed using SHA-256
- Firebase service account credentials are required
- CORS is configured for the domain
- Rate limiting is implemented for MCP endpoints

### Performance
- Next.js Image optimization is enabled
- Static files are served from `public/`
- Firestore queries use proper indexing
- File uploads use signed URLs for large files

### Environment Setup
- Development: Uses `.env.local` file
- Production: Uses Vercel environment variables
- MCP server loads environment separately from Next.js

## File Organization

### Critical Files
- `mcp/src/index.ts`: MCP server entry point
- `app/layout.tsx`: Root layout with providers
- `services/firebaseService.ts`: All database operations
- `lib/firebaseAdmin.ts`: Firebase Admin SDK setup
- `components/layout/Layout.tsx`: Main app layout

### Configuration Files
- `next.config.js`: Next.js configuration with webpack customization
- `tailwind.config.ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `firebase.json`: Firebase project configuration

## Common Operations

### Adding a New MCP Tool
1. Create tool file in `mcp/src/tools/`
2. Export register function
3. Add to `mcp/src/tools/index.ts`
4. Test with MCP client

### Adding a New API Route
1. Create route in appropriate `app/api/` subdirectory
2. Use `route.ts` naming convention
3. Implement proper authentication if needed
4. Add error handling

### Adding New Components
1. Create in appropriate `components/` subdirectory
2. Use TypeScript interfaces for props
3. Follow existing styling patterns
4. Export from index files when appropriate