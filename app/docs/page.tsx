'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import { motion } from 'framer-motion';

export default function DocsPage() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-neutral-100">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-semibold text-neutral-800 mb-4">
                        Documentation
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                        Explore our guides, API reference, tutorials, and FAQs to learn how to integrate and get the most out of our platform.
                    </p>
                    <div className="mt-4">
                        <a
                            href="https://modelcontextprotocol.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                            Visit the official Model Context Protocol website →
                        </a>
                    </div>
                </div>
            </section>

            {/* Quick Start Guide for New Users */}
            <section className="py-10 px-4 bg-blue-50 border-y border-blue-100">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-6 text-center">Quick Start Guide</h2>

                    <div className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm">
                        <div className="mb-8">
                            <h3 className="text-xl font-medium text-neutral-800 mb-3">What is Model Context Protocol (MCP)?</h3>
                            <p className="text-neutral-700 mb-4">
                                MCP is a specification that enables AI systems to communicate with external tools and APIs in a standardized way.
                                It defines how AI models can discover capabilities, send requests, and receive structured responses.
                            </p>
                            <p className="text-neutral-700">
                                With MCP, AI applications can access specialized services like database interactions, web searches, or domain-specific tools
                                without needing custom integration for each one.
                            </p>
                        </div>

                        <div className="mb-8 border-t border-neutral-100 pt-6">
                            <h3 className="text-xl font-medium text-neutral-800 mb-3">Official SDK Libraries</h3>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <a
                                    href="https://github.com/modelcontextprotocol/python-sdk"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start p-3 border border-neutral-200 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
                                        <span className="text-lg font-medium">Py</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800">Python SDK</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Official Python implementation of the MCP specification
                                        </p>
                                    </div>
                                </a>
                                <a
                                    href="https://github.com/modelcontextprotocol/typescript-sdk"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start p-3 border border-neutral-200 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
                                        <span className="text-lg font-medium">TS</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800">TypeScript SDK</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Official TypeScript implementation of the MCP specification
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="border-t border-neutral-100 pt-6">
                            <h3 className="text-xl font-medium text-neutral-800 mb-4">Integrating an MCP in 3 Simple Steps</h3>

                            <div className="space-y-6">
                                <div className="flex">
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                        <span className="font-bold text-sm">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800 mb-1">Find a Compatible MCP</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Search or browse the registry for MCPs that provide the capabilities you need.
                                            Each listing includes compatibility information and required dependencies.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex">
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                        <span className="font-bold text-sm">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800 mb-1">Add the Endpoint to Your System</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Each MCP provides configuration details - typically an endpoint URL and authentication requirements.
                                            Add these to your AI system's configuration using your framework's MCP client.
                                        </p>
                                        <div className="bg-neutral-50 rounded-md p-3 my-2 font-mono text-xs text-neutral-700 overflow-x-auto">
                                            <code>{`// Example configuration (syntax varies by framework)
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

                                <div className="flex">
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                        <span className="font-bold text-sm">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800 mb-1">Use the MCP in Your Application</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Your AI system can now discover and use the MCP's capabilities. The exact implementation
                                            depends on your framework, but typically follows this pattern:
                                        </p>
                                        <div className="bg-neutral-50 rounded-md p-3 my-2 font-mono text-xs text-neutral-700 overflow-x-auto">
                                            <code>{`// Example usage (pseudocode)
result = ai_system.process_with_tools(
  user_query,
  available_tools=["example-service"]
)`}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
                            <Link href="/docs/getting-started" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                                View detailed integration guides
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Documentation Categories */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid gap-8 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Getting Started</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Learn how to quickly set up your project and integrate our services.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/getting-started">Read More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">API Reference</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Detailed documentation on our API endpoints, parameters, and usage examples.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/api">Read More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Tutorials</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Step-by-step guides to help you implement our platform seamlessly.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/tutorials">Read More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">FAQ</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Find answers to common questions and get troubleshooting tips.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/faq">Read More</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
