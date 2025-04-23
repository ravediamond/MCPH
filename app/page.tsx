'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import Card from 'components/ui/Card';
import SearchBar from 'components/SearchBar';
import FeaturedMCPs from 'components/FeaturedMCPs';
import { useSupabase } from './supabase-provider';
import { useRouter } from 'next/navigation';

export default function Home() {
    const { session } = useSupabase();
    const router = useRouter();

    // No automatic redirect - allow logged-in users to view the landing page

    return (
        <div className="bg-gray-900 min-h-screen">
            {/* Refined Hero Section with Prominent Search */}
            <section className="py-16 px-4 border-b border-gray-800">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl font-semibold mb-4 text-center text-gray-100">
                        The Model Context Protocol Registry
                    </h1>
                    <p className="text-gray-300 text-center mb-10 max-w-3xl mx-auto text-lg">
                        Find, install, and publish MCP endpoints to enhance your AI systems
                    </p>

                    <div className="max-w-4xl mx-auto mb-8">
                        {/* Use the SearchBar component here */}
                        <SearchBar />
                        <div className="text-center mt-4">
                            <Link href="/browse" className="text-blue-400 hover:text-blue-300 font-medium">
                                Or browse all available MCPs →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* New User Onboarding - What is MCP? */}
            <section className="py-12 px-4 bg-gray-800">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-100">
                            New to MCP? Here's What You Need to Know
                        </h2>

                        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                            <p className="text-gray-200">
                                <strong>Model Context Protocol (MCP)</strong> enables AI systems to discover, access and use external tools and APIs.
                                Think of it as a standardized way for AI models to interact with various capabilities beyond their built-in knowledge.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors bg-gray-800/50">
                                <h3 className="font-medium text-lg mb-2 text-gray-100">For AI Developers</h3>
                                <p className="text-gray-300 text-sm">
                                    MCPs let your AI applications access external capabilities like databases, web searches, or specialized tools without custom integration code for each service.
                                </p>
                            </div>
                            <div className="border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors bg-gray-800/50">
                                <h3 className="font-medium text-lg mb-2 text-gray-100">For Service Providers</h3>
                                <p className="text-gray-300 text-sm">
                                    Create MCPs to make your APIs and services easily discoverable and usable by AI systems, expanding your reach to the AI ecosystem.
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link href="/docs" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium">
                                Learn more about MCP in our documentation
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured MCPs Sections */}
            <div className="max-w-6xl mx-auto py-12 px-4">
                <div className="grid grid-cols-1 gap-8">
                    {/* Most Starred MCPs */}
                    <FeaturedMCPs title="Most Popular MCPs" type="starred" limit={3} />

                    {/* Trending MCPs */}
                    <FeaturedMCPs title="Trending MCPs" type="trending" limit={3} />
                </div>
            </div>

            {/* How It Works - Smaller and more compact */}
            <div className="max-w-5xl mx-auto pt-8 pb-10 px-4">
                <section className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-md">
                    <h2 className="text-xl font-semibold mb-6 text-center text-gray-100">
                        How to use the MCP Registry
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="bg-blue-900 text-blue-300 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-md">
                                <span className="font-bold text-lg">1</span>
                            </div>
                            <h3 className="text-gray-100 font-medium mb-2 text-base">Find an MCP</h3>
                            <p className="text-gray-300 text-sm">
                                Search or browse the registry to find MCPs that enhance your AI application's capabilities.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-900 text-blue-300 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-md">
                                <span className="font-bold text-lg">2</span>
                            </div>
                            <h3 className="text-gray-100 font-medium mb-2 text-base">Install the MCP</h3>
                            <p className="text-gray-300 text-sm">
                                Follow the documentation to connect the MCP to your system or add it to your dependencies.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-900 text-blue-300 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-md">
                                <span className="font-bold text-lg">3</span>
                            </div>
                            <h3 className="text-gray-100 font-medium mb-2 text-base">Use in your project</h3>
                            <p className="text-gray-300 text-sm">
                                Import and use the MCP in your AI systems to extend functionality and capabilities.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                        <Button variant="primary" className="px-6 py-2 shadow-sm text-sm bg-blue-600 hover:bg-blue-700">
                            Get Started
                        </Button>
                        <Button variant="outline" className="ml-3 px-6 py-2 border-blue-500 text-blue-400 hover:bg-blue-900/50 text-sm">
                            Read Documentation
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
