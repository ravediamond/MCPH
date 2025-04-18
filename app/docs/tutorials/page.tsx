'use client';

export default function TutorialsPage() {
  return (
    <div className="bg-white min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">MCP Tutorials</h1>

      <section className="mb-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-xl font-medium mb-3">Official MCP Resources</h2>
          <p className="mb-3">
            These tutorials provide a simplified introduction to MCP. For comprehensive and up-to-date documentation,
            please refer to the official resources:
          </p>
          <ul className="list-disc pl-6 mb-3 space-y-1">
            <li>
              <a
                href="https://github.com/modelcontextprotocol/python-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Python SDK GitHub Repository
              </a> - Official Python implementation with examples and documentation
            </li>
            <li>
              <a
                href="https://github.com/modelcontextprotocol/typescript-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                TypeScript SDK GitHub Repository
              </a> - Official TypeScript implementation with examples and documentation
            </li>
            <li>
              <a
                href="https://modelcontextprotocol.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Model Context Protocol Website
              </a> - Complete protocol specification and ecosystem information
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Creating Your First MCP Server</h2>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
          <p className="text-gray-700 italic">
            This tutorial will guide you through creating a simple MCP server that provides a
            resource for accessing local files, an essential starting point for MCP development.
          </p>
        </div>

        <h3 className="text-xl font-medium mb-3">Prerequisites</h3>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>Basic knowledge of JavaScript/TypeScript</li>
          <li>Node.js installed (v16 or later)</li>
          <li>npm or yarn package manager</li>
          <li>A code editor (VS Code recommended)</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Step 1: Set Up Your Project</h3>
        <p className="mb-3">Create a new directory for your MCP server and initialize a new Node.js project:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <code>{`mkdir my-first-mcp-server
cd my-first-mcp-server
npm init -y`}</code>
        </div>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 2: Install Dependencies</h3>
        <p className="mb-3">Install the MCP SDK and other necessary packages:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <code>{`npm install @anthropic-ai/mcp-sdk express cors dotenv`}</code>
        </div>
        <p className="text-sm text-gray-600 italic mb-3">
          Note: For the latest official MCP SDKs, check the
          <a href="https://github.com/modelcontextprotocol/typescript-sdk" className="text-blue-600 hover:underline"> TypeScript SDK</a> or
          <a href="https://github.com/modelcontextprotocol/python-sdk" className="text-blue-600 hover:underline"> Python SDK</a> repositories.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 3: Create Server Configuration</h3>
        <p className="mb-3">Create a <code className="bg-gray-100 px-1 py-0.5 rounded">config.js</code> file to store your MCP server configuration:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`// config.js
module.exports = {
  SERVER_NAME: 'My First MCP Server',
  SERVER_DESCRIPTION: 'A simple MCP server that provides access to local files',
  SERVER_VERSION: '1.0.0',
  PORT: process.env.PORT || 3000,
  BASE_PATH: '/mcp'
};`}</pre>
        </div>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 4: Implement a Basic File Resource</h3>
        <p className="mb-3">Create a <code className="bg-gray-100 px-1 py-0.5 rounded">fileResource.js</code> file that implements a simple file resource:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`// fileResource.js
const fs = require('fs').promises;
const path = require('path');
const { Resource } = require('@anthropic-ai/mcp-sdk');

class FileResource extends Resource {
  constructor() {
    super({
      name: 'file',
      description: 'Access files on the local filesystem',
      usage: 'Use this resource to read text files from the server filesystem'
    });
  }

  async process(request) {
    try {
      if (!request.params || !request.params.path) {
        return {
          error: 'Path parameter is required'
        };
      }

      // Ensure the path is safe (restrict to a specific directory for security)
      const safePath = path.join(__dirname, 'safe_files', request.params.path);
      const fileContent = await fs.readFile(safePath, 'utf-8');
      
      return {
        content: fileContent,
        metadata: {
          path: request.params.path,
          size: Buffer.byteLength(fileContent, 'utf-8')
        }
      };
    } catch (error) {
      return {
        error: \`Error reading file: \${error.message}\`
      };
    }
  }
}

module.exports = new FileResource();`}</pre>
        </div>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 5: Set Up the MCP Server</h3>
        <p className="mb-3">Create a <code className="bg-gray-100 px-1 py-0.5 rounded">server.js</code> file that initializes and runs the MCP server:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`// server.js
const express = require('express');
const cors = require('cors');
const { MCPServer } = require('@anthropic-ai/mcp-sdk');
const config = require('./config');
const fileResource = require('./fileResource');

// Create directory for safe files
const fs = require('fs');
const path = require('path');
if (!fs.existsSync(path.join(__dirname, 'safe_files'))) {
  fs.mkdirSync(path.join(__dirname, 'safe_files'));
}

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Create MCP server
const mcpServer = new MCPServer({
  name: config.SERVER_NAME,
  description: config.SERVER_DESCRIPTION,
  version: config.SERVER_VERSION
});

// Register resources
mcpServer.registerResource(fileResource);

// Mount MCP server to express app
app.use(config.BASE_PATH, mcpServer.router);

// Start server
app.listen(config.PORT, () => {
  console.log(\`MCP Server running at http://localhost:\${config.PORT}\${config.BASE_PATH}\`);
});`}</pre>
        </div>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 6: Create a Test File</h3>
        <p className="mb-3">Create a sample test file in the <code className="bg-gray-100 px-1 py-0.5 rounded">safe_files</code> directory:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`// Create a file at safe_files/hello.txt
const fs = require('fs');
const path = require('path');

fs.writeFileSync(
  path.join(__dirname, 'safe_files', 'hello.txt'),
  'Hello from my first MCP server!'
);`}</pre>
        </div>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 7: Run Your MCP Server</h3>
        <p className="mb-3">Start your MCP server:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <code>{`node server.js`}</code>
        </div>
        <p>Your MCP server should now be running and accessible at <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:3000/mcp</code>.</p>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 8: Test Your MCP Server</h3>
        <p className="mb-3">You can test your MCP server using curl or any HTTP client:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`curl -X POST http://localhost:3000/mcp/resource/file \
  -H "Content-Type: application/json" \
  -d '{"params": {"path": "hello.txt"}}'`}</pre>
        </div>
        <p className="mb-3">You should receive a response containing the content of your hello.txt file:</p>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`{
  "content": "Hello from my first MCP server!",
  "metadata": {
    "path": "hello.txt",
    "size": 31
  }
}`}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Publishing Your MCP to MCPHub</h2>

        <p className="mb-4">
          Once you've created your MCP server, you can publish it to MCPHub so others can discover and use it.
          Follow these steps to publish your MCP:
        </p>

        <h3 className="text-xl font-medium mb-3">Step 1: Create an Account on MCPHub</h3>
        <p className="mb-3">
          If you don't already have an account, sign up at <a href="/" className="text-blue-600 hover:underline">MCPHub</a>.
          Once registered, go to your profile page to obtain an API key.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 2: Prepare Your MCP Repository</h3>
        <p className="mb-3">Ensure your MCP repository includes:</p>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>A descriptive README.md with setup and usage instructions</li>
          <li>License information</li>
          <li>Example configuration and usage</li>
          <li>Any dependencies clearly documented</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 mt-6">Step 3: Publish to MCPHub</h3>
        <p className="mb-3">You can publish your MCP through the API or web interface:</p>

        <h4 className="font-medium mb-2">Via Web Interface</h4>
        <ol className="list-decimal pl-6 mb-4 space-y-1">
          <li>Log into your MCPHub account</li>
          <li>Navigate to the "Dashboard" section</li>
          <li>Click "Add New MCP"</li>
          <li>Fill out the required information about your MCP implementation</li>
          <li>Submit your MCP for publication</li>
        </ol>

        <h4 className="font-medium mb-2">Via API</h4>
        <div className="bg-gray-50 rounded-md p-4 my-3 font-mono text-sm text-neutral-700 overflow-x-auto">
          <pre>{`curl -X POST https://mcphub.example.com/api/public/v1/mcps/add \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "name": "My First MCP Server",
    "description": "A simple MCP server that provides access to local files",
    "repository_url": "https://github.com/yourusername/my-first-mcp-server",
    "documentation_url": "https://github.com/yourusername/my-first-mcp-server#readme",
    "version": "1.0.0",
    "tags": ["files", "local", "filesystem"]
  }'`}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-lg mb-4">
          We're working on more tutorials to help you make the most of the Model Context Protocol. Check back soon for:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-lg">
          <li>Building an MCP server with authentication</li>
          <li>Creating MCPs with advanced tools and resources</li>
          <li>Integrating MCPs with popular LLM frameworks</li>
          <li>Best practices for MCP security and performance</li>
        </ul>
        <p className="mt-6 text-gray-600">
          For the most current examples and best practices, always refer to the
          <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> official MCP website</a>.
        </p>
      </section>
    </div>
  );
}