'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import Card from 'components/ui/Card';
import { MagnifyingGlassIcon, ArrowRightIcon, ArrowDownTrayIcon, UserCircleIcon, TagIcon } from '@heroicons/react/24/outline';

export default function Home() {
    return (
        <div className="bg-white min-h-screen">
            {/* Refined Hero Section with Prominent Search */}
            <section className="py-16 px-4 border-b border-neutral-100">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl font-semibold mb-4 text-center text-neutral-800">
                        The Model Context Protocol Registry
                    </h1>
                    <p className="text-neutral-600 text-center mb-10 max-w-3xl mx-auto text-lg">
                        Find, install, and publish MCP endpoints to enhance your AI systems
                    </p>

                    <div className="max-w-4xl mx-auto mb-8">
                        <div className="flex flex-col">
                            <div className="relative flex-grow mb-4">
                                <input
                                    type="text"
                                    placeholder="Search for MCP endpoints..."
                                    className="w-full pl-12 pr-4 py-5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm"
                                />
                                <MagnifyingGlassIcon className="absolute left-4 top-5 h-6 w-6 text-neutral-400" />
                            </div>
                            <Button variant="primary" size="lg" className="py-3 text-lg shadow-sm">
                                Search
                            </Button>
                        </div>
                        <p className="text-neutral-500 text-center mt-4">
                            or <Link href="/browse" className="text-blue-600 hover:text-blue-800 hover:underline">browse all MCPs</Link> • <Link href="/submit" className="text-blue-600 hover:text-blue-800 hover:underline">publish your MCP</Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works - Smaller and more compact */}
            <div className="max-w-5xl mx-auto pt-8 pb-10 px-4">
                <section className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 text-center text-neutral-800">How to use the MCP Registry</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="bg-blue-50 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <span className="font-bold text-lg">1</span>
                            </div>
                            <h3 className="text-neutral-800 font-medium mb-2 text-base">Find an MCP</h3>
                            <p className="text-neutral-600 text-sm">Search or browse the registry to find MCPs that enhance your AI application's capabilities.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-50 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <span className="font-bold text-lg">2</span>
                            </div>
                            <h3 className="text-neutral-800 font-medium mb-2 text-base">Install the MCP</h3>
                            <p className="text-neutral-600 text-sm">Follow the documentation to connect the MCP to your system or add it to your dependencies.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-50 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <span className="font-bold text-lg">3</span>
                            </div>
                            <h3 className="text-neutral-800 font-medium mb-2 text-base">Use in your project</h3>
                            <p className="text-neutral-600 text-sm">Import and use the MCP in your AI systems to extend functionality and capabilities.</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
                        <Button variant="primary" className="px-6 py-2 shadow-sm text-sm">Get Started</Button>
                        <Button variant="outline" className="ml-3 px-6 py-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-sm">Read Documentation</Button>
                    </div>
                </section>
            </div>
        </div>
    );
}