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