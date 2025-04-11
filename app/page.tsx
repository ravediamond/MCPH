'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import Card from 'components/ui/Card';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
    // Sample MCP data
    const featuredMCPs = [
        {
            id: 1,
            name: 'Weather API',
            description: 'Get real-time weather information for any location',
            author: 'OpenWeatherMap',
            tags: ['weather', 'api', 'geolocation'],
            downloads: 12345,
        },
        {
            id: 2,
            name: 'Calculator Tool',
            description: 'Perform complex mathematical calculations',
            author: 'MathTools Inc',
            tags: ['math', 'calculator', 'numerical'],
            downloads: 8763,
        },
        {
            id: 3,
            name: 'Image Generator',
            description: 'Create images from text descriptions',
            author: 'AI Visuals',
            tags: ['ai', 'images', 'generation'],
            downloads: 10932,
        },
    ];

    return (
        <div className="space-y-12 py-4">
            {/* Hero Section */}
            <section className="text-center py-16 px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    <span className="text-primary-600">MCP</span> Registry
                </h1>
                <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
                    Discover and connect to Model Context Protocol endpoints to extend your AI's capabilities.
                </p>

                <div className="max-w-2xl mx-auto relative">
                    <div className="flex">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search MCP endpoints..."
                                className="w-full pl-10 pr-4 py-3 rounded-l-md border-y border-l border-neutral-300 focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                            />
                            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                        </div>
                        <Button variant="primary" size="lg" className="rounded-l-none">
                            Search
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-4">
                    <Button variant="outline">Browse All MCPs</Button>
                    <Button variant="primary">Submit MCP</Button>
                </div>
            </section>

            {/* Featured MCPs */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Featured MCPs</h2>
                    <Link href="/browse" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                        View all <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredMCPs.map((mcp) => (
                        <Card key={mcp.id} hoverable>
                            <Card.Body>
                                <h3 className="text-lg font-semibold mb-2">{mcp.name}</h3>
                                <p className="text-neutral-600 text-sm mb-3">{mcp.description}</p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {mcp.tags.map((tag) => (
                                        <span key={tag} className="bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-500">By {mcp.author}</span>
                                    <span className="text-xs text-neutral-500">{mcp.downloads.toLocaleString()} downloads</span>
                                </div>
                            </Card.Body>
                            <Card.Footer className="flex justify-end">
                                <Link href={`/mcp/${mcp.id}`}>
                                    <Button variant="primary" size="sm">View Details</Button>
                                </Link>
                            </Card.Footer>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-white rounded-lg shadow-soft p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">How MCP Registry Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="bg-primary-100 text-primary-600 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="font-bold text-lg">1</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Register Your MCP</h3>
                        <p className="text-neutral-600">Create an account and submit your Model Context Protocol endpoint</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-primary-100 text-primary-600 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="font-bold text-lg">2</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Share Documentation</h3>
                        <p className="text-neutral-600">Add details about how your MCP works and its capabilities</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-primary-100 text-primary-600 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="font-bold text-lg">3</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Enhance AI Systems</h3>
                        <p className="text-neutral-600">Let AI agents discover and use your tools to enhance their capabilities</p>
                    </div>
                </div>
            </section>
        </div>
    );
}