# MCPHub Upload Flow

## Overview

MCPHub offers two upload experiences to serve different user needs:

1. **Landing Page Quick Upload** - A simplified drag-and-drop interface for instant sharing without login
2. **Advanced Upload Page** - A full-featured upload interface for authenticated users with batch uploads and metadata options

## Component Architecture

The upload flow is built around these key components:

- **HeroUpload.tsx** - The quick upload component used on the landing page (/)
- **FileUpload.tsx** - The advanced upload component used on the authenticated upload page (/upload)
- **useUploadService.tsx** - A shared hook that provides consistent upload logic for both components
- **useAnonymousUploadTransition.tsx** - A hook to handle migration of anonymous uploads when a user logs in

## User Flow

### Unauthenticated Users

1. Unauthenticated users land on the home page (/)
2. They can immediately upload a file via drag-and-drop or paste
3. After upload, they receive a shareable link with a 30-day expiration
4. A toast notification offers the option to create an account for more features
5. If they create an account later, their previous anonymous uploads are linked to their account

### Authenticated Users

1. Authenticated users can use either the landing page quick upload or navigate to /upload
2. The landing page upload provides a quick experience with a button to access advanced options
3. The /upload page offers:
   - Multi-file batch uploads (up to 20 files)
   - Metadata fields (title, description, tags)
   - Custom expiration options (Pro feature)
   - Larger file size limits (Pro feature)

## Navigation Rules

Navigation items have different visibility based on authentication status:

| Nav item | Unauthenticated | Authenticated |
|----------|-----------------|---------------|
| Docs     | visible         | visible       |
| Log in   | visible         | becomes avatar dropdown |
| Upload   | hidden          | visible; points to /upload |
| Home / Files | hidden      | visible; dashboard grid |

## Shared Upload Logic

Both upload components use the same core upload service (`useUploadService.tsx`), which ensures consistent handling of files. The quick uploader passes simplified options, while the advanced uploader allows for detailed configuration.

## Anonymous-to-Authenticated Transition

When an anonymous user creates an account, we use local storage to track their temporary uploads. Once authenticated, these uploads are automatically linked to their new account, providing a seamless experience.

## Implementation Details

- The landing page dropzone handles single file uploads with minimal options
- The /upload page is protected, requiring authentication
- Both components use the same underlying storage mechanisms
- Responsive UI adjusts for optimal experience on mobile and desktop
- Toast notifications provide clear feedback about the upload process
- Temporary anonymous uploads are tracked in local storage via `mcphub_temp_crates`

This architecture maintains a clean separation between the instant-value landing page experience and the power-user advanced upload features, while sharing core logic to ensure consistency.
