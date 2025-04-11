import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-neutral-200 py-8">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-4">About MCP Registry</h3>
                        <p className="text-sm text-neutral-600">
                            A registry for Model Context Protocol (MCP) endpoints, helping AI systems discover and use external tools and APIs.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/docs" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/guides" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    Guides
                                </Link>
                            </li>
                            <li>
                                <Link href="/api" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    API
                                </Link>
                            </li>
                            <li>
                                <Link href="https://github.com/your-org/mcp-hub" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    GitHub
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Get Involved</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/contribute" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    How to Contribute
                                </Link>
                            </li>
                            <li>
                                <Link href="/submit" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    Submit an MCP
                                </Link>
                            </li>
                            <li>
                                <Link href="/community" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                                    Community
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-200 text-sm text-neutral-500 flex flex-col md:flex-row justify-between items-center">
                    <p>&copy; {new Date().getFullYear()} MCP Registry. All rights reserved.</p>
                    <div className="mt-4 md:mt-0 flex space-x-6">
                        <Link href="/privacy" className="hover:text-primary-600 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-primary-600 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
