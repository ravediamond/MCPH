import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-blue-50 py-12">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div>
                        <h3 className="text-base font-semibold text-blue-800 mb-4">About MCP Registry</h3>
                        <p className="text-neutral-600 leading-relaxed">
                            A registry for Model Context Protocol (MCP) endpoints, helping AI systems discover and use external tools and APIs.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-blue-800 mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/docs" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/guides" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> Guides
                                </Link>
                            </li>
                            <li>
                                <Link href="/api" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> API
                                </Link>
                            </li>
                            <li>
                                <Link href="https://github.com/your-org/mcp-hub" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> GitHub
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-blue-800 mb-4">Get Involved</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/contribute" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> How to Contribute
                                </Link>
                            </li>
                            <li>
                                <Link href="/submit" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> Submit an MCP
                                </Link>
                            </li>
                            <li>
                                <Link href="/community" className="text-neutral-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    <span className="bg-blue-50 w-1.5 h-1.5 rounded-full inline-block"></span> Community
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-blue-50 text-neutral-500 flex flex-col md:flex-row justify-between items-center">
                    <p>&copy; {new Date().getFullYear()} MCP Registry. All rights reserved.</p>
                    <div className="mt-4 md:mt-0 flex space-x-8">
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
