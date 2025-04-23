import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 py-6">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-gray-400 text-sm">
                            MCP Registry — A platform for Model Context Protocol endpoints.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <Link href="/docs" className="text-gray-400 hover:text-blue-400 transition-colors">
                            Documentation
                        </Link>
                        <Link href="https://github.com/ravediamond/MCPHub" className="text-gray-400 hover:text-blue-400 transition-colors">
                            GitHub
                        </Link>
                        <Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center">
                    <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} MCP Registry</p>
                </div>
            </div>
        </footer>
    );
}
