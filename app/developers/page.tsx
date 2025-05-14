'use client';

import React from 'react';
import Link from 'next/link';
import { FaCode, FaBook, FaQuestionCircle, FaServer, FaTools, FaExternalLinkAlt } from 'react-icons/fa';

export default function DevelopersPage() {
    return (
        <div className="bg-beige-200 min-h-screen py-12">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Developer Resources</h1>
                    <p className="text-gray-600 text-lg">Everything you need to integrate with MCPH's file sharing service</p>
                </div>

                {/* Main grid layout for developer resources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* API Documentation Card */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transform transition-transform hover:shadow-md hover:-translate-y-1">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <FaCode className="h-6 w-6 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800 ml-4">API Reference</h2>
                            </div>
                            <p className="text-gray-600">
                                Complete API documentation for uploading, downloading, and managing files through our REST endpoints.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                            <Link href="/docs" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                                View API Documentation <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* MCP Integration Card */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transform transition-transform hover:shadow-md hover:-translate-y-1">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <FaServer className="h-6 w-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800 ml-4">MCP Integration</h2>
                            </div>
                            <p className="text-gray-600">
                                Learn how to use MCPH with Model Context Protocol for AI integrations and LLM file management.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                            <Link href="/docs/local-usage" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                                MCP Usage Guide <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* FAQ Card */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transform transition-transform hover:shadow-md hover:-translate-y-1">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <FaQuestionCircle className="h-6 w-6 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800 ml-4">FAQ</h2>
                            </div>
                            <p className="text-gray-600">
                                Frequently asked questions about MCPH's services, usage limits, file handling, and more.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                            <Link href="/docs/faq" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                                View FAQ <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* SDKs & Libraries Card */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transform transition-transform hover:shadow-md hover:-translate-y-1">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaTools className="h-6 w-6 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800 ml-4">Tools & Examples</h2>
                            </div>
                            <p className="text-gray-600">
                                Client libraries, code samples, and example integrations in JavaScript, Python, and more.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3">
                            <Link href="/developers/examples" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                                View Examples <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Links Section */}
                <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/docs#rest-api"
                            className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors group"
                        >
                            <h4 className="font-medium text-gray-800 flex items-center">
                                REST API
                                <FaExternalLinkAlt className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-sm text-gray-600">Upload and download files with REST</p>
                        </Link>

                        <Link
                            href="/docs#sse-api"
                            className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors group"
                        >
                            <h4 className="font-medium text-gray-800 flex items-center">
                                SSE API
                                <FaExternalLinkAlt className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-sm text-gray-600">AI integrations with Server-Sent Events</p>
                        </Link>

                        <Link
                            href="/docs#rate-limits"
                            className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors group"
                        >
                            <h4 className="font-medium text-gray-800 flex items-center">
                                Rate Limits
                                <FaExternalLinkAlt className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-sm text-gray-600">Usage limits and quotas</p>
                        </Link>
                    </div>
                </div>

                {/* Get Started Banner */}
                <div className="mt-12 bg-blue-600 text-white rounded-lg p-8 shadow text-center">
                    <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
                    <p className="mb-6 max-w-2xl mx-auto">
                        Integrate MCPH's file sharing capabilities into your own applications with just a few lines of code.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
                        <Link
                            href="/docs"
                            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium shadow hover:bg-gray-100"
                        >
                            Read the Docs
                        </Link>
                        <Link
                            href="/upload"
                            className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium shadow hover:bg-blue-800"
                        >
                            Try It Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}