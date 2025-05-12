# MCPHub

A file sharing platform built with Next.js, deployed on Vercel, using Google Cloud Storage for file storage and Firebase Realtime Database for metadata.

## Architecture

- **Frontend/Backend**: Next.js deployed on Vercel
- **File Storage**: Google Cloud Storage Bucket
- **Metadata Storage**: Firebase Realtime Database
- **API Routes**: Next.js API Routes (Vercel Edge Functions)

## Setup Instructions

### Prerequisites

1. Google Cloud Platform account with a project and service account
2. Firebase project with Realtime Database enabled
3. Vercel account

### Local Development Setup

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   cd MCPHub
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on the `.env.local.example` template
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in the required environment variables in `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `GCS_BUCKET_NAME`: Your Google Cloud Storage bucket name
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID (optional for local dev)
   - `GEMINI_API_KEY`: Your Gemini API key (if using AI features)

5. For local development, you'll need Application Default Credentials (ADC) set up:
   ```bash
   gcloud auth application-default login
   ```

6. Start the development server
   ```bash
   ./dev.sh
   # or
   npm run dev
   ```

### Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Configure the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `GCS_BUCKET_NAME`: Your Google Cloud Storage bucket name
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID
   - `GCP_SERVICE_ACCOUNT`: Your Google Cloud service account JSON (as a string)
   - `MAINTENANCE_AUTH_KEY`: Secret key for maintenance endpoints
   - `GEMINI_API_KEY`: Your Gemini API key (if using AI features)
3. Deploy from the Vercel dashboard or push to your main branch

## Features

- File upload/download
- Server-sent events (SSE) for real-time notifications
- Signed URLs for secure file sharing
- API routes for file operations
- Automatic cleanup of expired files

## API Endpoints

- `POST /api/uploads`: Upload a file
- `GET /api/uploads/:id`: Download a file
- `DELETE /api/uploads/:id`: Delete a file
- `GET /api/uploads/:id/signed-url`: Generate a signed URL for a file
- `GET /api/sse`: Server-sent events endpoint
- `POST /api/maintenance/cleanup`: Cleanup expired files (requires auth)

## Environment Variables

See `.env.local.example` for all required environment variables and their descriptions.

## License

[MIT](LICENSE)

# MCPH🚀

Welcome to **MCPH**, your one-stop hub for discovering, sharing, and exploring Model Context Protocol (MCP) tools! Whether you're a developer looking to publish your awesome MCP or an AI system hunting for the perfect integration, we've got you covered. 😊

Visit us at [mcph.io](https://mcph.io)

---

## Features

### 🔐 User Authentication & Profiles
- **Sign Up & Log In:** Create your account and log in securely.
- **Profile Management:** Update your details and track the MCPs you submit.

### 📦 MCP Creation with GitHub Integration
- **Easy MCP Submission:** Just fill in a simple form and link your GitHub repository.
- **Automatic README Import:** We fetch your repository's README and display it right on your MCP's detail page—no manual copy-pasting required!

### 📚 MCP Catalog & Detailed View
- **Browse & Explore:** Check out our searchable and filterable catalog of MCPs.
- **MCP Detail Pages:** Get all the info you need in one place, including the latest documentation pulled directly from GitHub.

### 🔎 Basic Search & Filtering
- **Smart Search:** Find MCPs by name, description, or tags.
- **Filtering Options:** Narrow down your search by categories, recent updates, or specific keywords.

### 🤖 API Endpoint for AI Integration
- **Simple RESTful API:** AI systems (looking at you, ChatGPT 😉) can query our database for the most relevant MCPs.
- **Secure Access:** Use API keys or tokens to ensure only authorized tools connect and access data.

---

## Future Roadmap (Dream Big, Start Simple) 🛤️

- **Seamless Deployment:** In the future, easily deploy both official and open-source MCPs on our platform.
- **Advanced Versioning & Documentation:** More robust version management and extra documentation features for the growing ecosystem.
- **Task cutomized MCP usage planning** Better MCP by giving an optimized list of MCP to use depending on the task.
- **Usabe based Monetisation:** Give an usage based monetization system for the MCP developers.

---

## Getting Started

1. **Fork & Clone the Repo:** Get your local copy ready.
2. **Sign Up:** Create your account and set up your profile.
3. **Submit Your MCP:** Fill in the submission form with your GitHub URL.
4. **Explore:** Browse, search, and interact with MCPs contributed by our awesome community!

---

## Deployment to Vercel

### Prerequisites
- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.io) project

### Steps to Deploy

1. **Push your code to GitHub**:
   ```
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import your project to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Select "Import Git Repository" and choose your repository
   - Configure project settings

3. **Set Environment Variables**:
   - In the Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables" section
   - Add these required variables:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Deploy**:
   - Click "Deploy" and wait for your project to build
   - Once deployed, your site will be available at `https://your-project-name.vercel.app`

### Post-Deployment

- Set up your custom domain if desired
  - For this project, we're using [mcph.io](https://mcph.io) as our official domain
- Monitor the analytics and logs in Vercel dashboard

---

## Domain Configuration

### Setting up mcph.io on Vercel

1. **Purchase the Domain**: If not already purchased, acquire the mcph.io domain from a domain registrar.

2. **Add Domain to Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to "Settings" > "Domains"
   - Add your domain: `mcph.io`
   - Also add `www.mcph.io` (configured to redirect to the apex domain)

3. **Configure DNS**:
   - Update your domain's DNS settings to point to Vercel's nameservers, or
   - Add the required A, CNAME, TXT records as provided by Vercel

4. **SSL Configuration**:
   - Vercel automatically provisions SSL certificates for custom domains
   - Ensure HTTPS is enforced for all traffic

---

We're all about making integrations fun and accessible. Dive in, explore, and let your imagination run wild with what you can build. Happy integrating! 🎉


# Dev

## Continuous Integration

This project uses GitHub Actions for continuous integration. The workflow automatically runs on:
- Every push to the main/master branch
- Every pull request to the main/master branch
- Weekly (Sunday at midnight) to ensure dependencies remain compatible

The CI workflow performs the following checks:
- Installs dependencies
- Runs linting
- Builds the application
- Archives the build artifacts for inspection

This helps catch errors early in the development process, ensuring the application remains in a deployable state.

## Add admin user

INSERT INTO public.profiles (id, username, is_admin)
VALUES ('USER_ID', 'admin', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;


## 🛡️ Pre-push Checks (Husky + lint-staged)

We enforce fast, incremental type-checks and linting on every `git push` to catch build-only errors locally:

### 1. Install dev-deps
```bash
npm install --save-dev husky lint-staged typescript eslint
```

### 2. Enable Husky
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```  

Then bootstrap Husky:
```bash
npm run prepare
```

### 3. Configure lint-staged
```json
{
  "scripts": {
    "type-check": "tsc --noEmit --incremental",
    "lint":       "next lint",
    "check":      "npm run type-check && npm run lint"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "npm run type-check",
      "npm run lint"
    ]
  }
}
```

- type-check runs a no-emit incremental TypeScript pass.
- lint runs next lint.
- check combines both for full sweeps (e.g. in CI).

### 4. Create the pre-push hook
```bash
mkdir -p .husky

cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOF

chmod +x .husky/pre-push
```   

## Usage
Local fast checks:
- On every git push, only your staged files will be type-checked and linted instantly.
- Full sweep (CI or manual):
```bash
npm run check
```
