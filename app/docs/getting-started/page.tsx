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
                <p className="mb-4 text-blue-600">
                    <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                        Learn more at the official MCP website
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Official MCP SDKs</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-xl mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" />
                            </svg>
                            Python SDK
                        </h3>
                        <p className="mb-3">
                            The official Python implementation of the Model Context Protocol. Use this SDK to:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-1 text-sm">
                            <li>Create MCP servers with custom resources</li>
                            <li>Connect to MCP providers from your Python applications</li>
                            <li>Integrate with popular Python LLM frameworks</li>
                        </ul>
                        <div className="text-right">
                            <a
                                href="https://github.com/modelcontextprotocol/python-sdk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                            >
                                View on GitHub
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-xl mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            TypeScript SDK
                        </h3>
                        <p className="mb-3">
                            The official TypeScript implementation of the Model Context Protocol. Use this SDK to:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-1 text-sm">
                            <li>Build MCP servers with Node.js</li>
                            <li>Create web-based MCP clients</li>
                            <li>Integrate with JavaScript LLM frameworks</li>
                        </ul>
                        <div className="text-right">
                            <a
                                href="https://github.com/modelcontextprotocol/typescript-sdk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                            >
                                View on GitHub
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
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