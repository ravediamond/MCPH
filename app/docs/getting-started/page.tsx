'use client';

import Link from 'next/link';

export default function GettingStartedPage() {
    return (
        <div className="bg-white min-h-screen p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Getting Started with MCP</h1>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">What is Model Context Protocol?</h2>
                <p className="mb-4 text-lg">
                    The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide
                    context to Large Language Models (LLMs). It works like a universal connector for AI applications,
                    letting you easily integrate AI models with various data sources and tools.
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                    <li>Pre-built integrations your LLM can directly plug into</li>
                    <li>Flexibility to switch between different LLM providers</li>
                    <li>Secure your data by keeping it within your infrastructure</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Getting Started with MCPHub</h2>
                <p className="mb-4 text-lg">
                    MCPHub helps you discover and use MCP implementations in just a few steps:
                </p>

                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-xl mb-2">1. Find and Choose an MCP</h3>
                        <p className="mb-2">
                            Browse our catalog to find MCPs that suit your needs.
                        </p>
                        <Link
                            href="/browse"
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                        >
                            Browse MCPs
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-xl mb-2">2. Integrate with Your Application</h3>
                        <p className="mb-2">
                            Follow the integration instructions for your chosen MCP.
                        </p>
                        <div className="bg-white rounded-md p-3 my-2 font-mono text-xs text-neutral-700 overflow-x-auto">
                            <code>{`// Example configuration
{
  "mcp_endpoints": [
    {
      "name": "example-service",
      "url": "https://api.example.com/mcp",
      "auth_type": "bearer" 
    }
  ]
}`}</code>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/docs/tutorials"
                        className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <h3 className="font-medium text-xl mb-1">Tutorials</h3>
                        <p className="text-gray-600">Step-by-step implementation guides</p>
                    </Link>
                    <Link
                        href="/docs/api"
                        className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <h3 className="font-medium text-xl mb-1">API Reference</h3>
                        <p className="text-gray-600">Documentation on API endpoints</p>
                    </Link>
                </div>
            </section>
        </div>
    );
}