import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-blue-50 py-6">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-neutral-600 text-sm">
                            MCP Registry — A platform for Model Context Protocol endpoints.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <Link href="/docs" className="text-neutral-600 hover:text-blue-600 transition-colors">
                            Documentation
                        </Link>
                        <Link href="https://github.com/your-org/mcp-hub" className="text-neutral-600 hover:text-blue-600 transition-colors">
                            GitHub
                        </Link>
                        <Link href="/privacy" className="text-neutral-600 hover:text-blue-600 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="text-neutral-600 hover:text-blue-600 transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-50 flex justify-center">
                    <p className="text-neutral-500 text-xs">&copy; {new Date().getFullYear()} MCP Registry</p>
                </div>
            </div>
        </footer>
    );
}
