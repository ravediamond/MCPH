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
                        About MCPs
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                        Learn the basics of Model Context Protocol (MCP) and how to use the MCPs you discover on our hub.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://modelcontextprotocol.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md transition-colors font-medium"
                        >
                            Official MCP Website
                        </a>
                        <a
                            href="https://github.com/modelcontextprotocol"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 px-5 py-2 rounded-md transition-colors font-medium"
                        >
                            GitHub Repository
                        </a>
                    </div>
                </div>
            </section>

            {/* What is MCP Section */}
            <section className="py-10 px-4 bg-blue-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-6 text-center">What is Model Context Protocol?</h2>

                    <div className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm">
                        <p className="text-neutral-700 mb-4">
                            MCP is a specification that enables AI systems to communicate with external tools and APIs in a standardized way.
                            It defines how AI models can discover capabilities, send requests, and receive structured responses.
                        </p>
                        <p className="text-neutral-700 mb-6">
                            With MCP, AI applications can access specialized services like database interactions, web searches, or domain-specific tools
                            without needing custom integration for each one.
                        </p>

                        <div className="flex justify-center">
                            <img
                                src="https://raw.githubusercontent.com/modelcontextprotocol/.github/main/profile/mcp-explanation.png"
                                alt="MCP Flow Diagram"
                                className="max-w-full h-auto rounded-lg shadow-sm border border-neutral-200"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Official Resources */}
            <section className="py-10 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-6 text-center">Official Resources</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm"
                        >
                            <h3 className="text-xl font-medium text-neutral-800 mb-3">SDK Libraries</h3>
                            <div className="space-y-4">
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
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm"
                        >
                            <h3 className="text-xl font-medium text-neutral-800 mb-3">Documentation</h3>
                            <div className="space-y-4">
                                <a
                                    href="https://docs.modelcontextprotocol.io/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start p-3 border border-neutral-200 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
                                        <span className="text-lg font-medium">📚</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800">Official Documentation</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Comprehensive guides, API references, and tutorials
                                        </p>
                                    </div>
                                </a>
                                <a
                                    href="https://github.com/modelcontextprotocol/spec"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start p-3 border border-neutral-200 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">
                                        <span className="text-lg font-medium">📝</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-800">Specification</h4>
                                        <p className="text-neutral-600 text-sm">
                                            Technical details and implementation guidelines
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How to Use MCPs */}
            <section className="py-10 px-4 bg-blue-50 mb-10">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-6 text-center">How to Use MCPs</h2>

                    <div className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm">
                        <div className="space-y-6">
                            <div className="flex">
                                <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                    <span className="font-bold text-sm">1</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-800 mb-1">Find a Compatible MCP</h4>
                                    <p className="text-neutral-600">
                                        Browse our hub to discover MCPs that provide the capabilities you need for your AI application.
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                    <span className="font-bold text-sm">2</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-800 mb-1">Configure Your Environment</h4>
                                    <p className="text-neutral-600">
                                        Install the appropriate MCP SDK for your programming language and configure it with the MCP's endpoint.
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                    <span className="font-bold text-sm">3</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-800 mb-1">Integrate and Use</h4>
                                    <p className="text-neutral-600">
                                        Connect your AI model to the MCP to extend its capabilities with the external tools and services.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
                            <Link href="/browse" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                                Start browsing MCPs
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
