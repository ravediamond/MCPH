# MCPH🚀

Welcome to **MCPH**, your one-stop hub for discovering, sharing, and exploring Model Context Protocol (MCP) tools! Whether you're a developer looking to publish your awesome MCP or an AI system hunting for the perfect integration, we've got you covered. 😊

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

We’re all about making integrations fun and accessible. Dive in, explore, and let your imagination run wild with what you can build. Happy integrating! 🎉


# Dev

## Add admin user

INSERT INTO public.profiles (id, username, is_admin)
VALUES ('USER_ID', 'admin', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;