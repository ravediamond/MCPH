'use client';

export default function ApiReferencePage() {
    return (
        <div className="bg-white min-h-screen p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">API Reference</h1>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
                <p className="mb-4 text-lg">
                    MCPHub provides a RESTful API that allows you to search for and add MCP implementations programmatically.
                    To use the API, you'll need an API key from your <a href="/profile/apikeys" className="text-blue-600 hover:text-blue-800">profile page</a>.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
                <p className="mb-4 text-lg">
                    Include your API key in the <code className="bg-gray-100 px-1 py-0.5 rounded">X-API-Key</code> header:
                </p>
                <div className="bg-gray-50 rounded-md p-4 my-2 font-mono text-sm text-neutral-700 overflow-x-auto">
                    <code>X-API-Key: your_api_key_here</code>
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Core Endpoints</h2>

                {/* Search MCPs */}
                <div className="mb-8 border-b pb-6">
                    <h3 className="text-xl font-semibold mb-2">Search MCPs</h3>
                    <p className="mb-2"><code className="bg-green-100 px-2 py-1 rounded font-bold">GET</code> <code className="bg-gray-100 px-2 py-1 rounded">/api/public/v1/mcps/search</code></p>
                    <p className="mb-4">Search for MCPs based on various parameters.</p>

                    <h4 className="font-medium mb-2">Example Request</h4>
                    <div className="bg-gray-50 rounded-md p-4 my-2 font-mono text-sm text-neutral-700 overflow-x-auto">
                        <code>GET /api/public/v1/mcps/search?query=database&tags=postgres</code>
                    </div>
                </div>

                {/* Add MCP */}
                <div className="mb-8 border-b pb-6">
                    <h3 className="text-xl font-semibold mb-2">Add MCP</h3>
                    <p className="mb-2"><code className="bg-blue-100 px-2 py-1 rounded font-bold">POST</code> <code className="bg-gray-100 px-2 py-1 rounded">/api/public/v1/mcps/add</code></p>
                    <p className="mb-4">Add a new MCP implementation to the registry.</p>

                    <h4 className="font-medium mb-2">Example Request</h4>
                    <div className="bg-gray-50 rounded-md p-4 my-2 font-mono text-sm text-neutral-700 overflow-x-auto">
                        <pre>{`POST /api/public/v1/mcps/add
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "name": "File System MCP",
  "description": "Access local file systems through MCP",
  "repository_url": "https://github.com/example/file-system-mcp",
  "documentation_url": "https://docs.example.com/file-system-mcp",
  "version": "1.0.0",
  "tags": ["filesystem", "storage"]
}`}</pre>
                    </div>
                </div>
            </section>

            <section>
                <p className="text-lg">
                    For detailed API documentation and more endpoints, please check our
                    <a href="https://github.com/example/mcphub/wiki/api" className="text-blue-600 hover:text-blue-800"> GitHub repository</a>.
                </p>
            </section>
        </div>
    );
}