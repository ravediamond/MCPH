'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import {
    MagnifyingGlassIcon,
    TagIcon,
    ChevronDownIcon,
    Squares2X2Icon,
    Bars3Icon
} from '@heroicons/react/24/outline';
import Button from 'components/ui/Button';

export default function BrowsePage() {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [activeFilter, setActiveFilter] = useState<string>("All");

    // Mock categories - replace with your actual categories
    const categories = ["All", "Technology", "Science", "Business", "Health", "Education"];

    // Mock data - replace with your actual data fetching logic
    const items = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        title: `Item ${i + 1}`,
        category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1],
        image: `https://source.unsplash.com/random/300x200?sig=${i}`,
        description: "A brief description of this item and what it contains.",
    }));

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                        Browse Content
                    </h1>
                    <p className="text-neutral-600">
                        Discover and explore the latest content in our hub
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search for content..."
                            className="w-full pl-12 pr-4 py-5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm"
                        />
                        <MagnifyingGlassIcon className="absolute left-4 top-5 h-6 w-6 text-neutral-400" />
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-neutral-200">
                            <TagIcon className="h-5 w-5 text-neutral-500" />
                            <span className="text-sm text-neutral-500">Filter</span>
                            <ChevronDownIcon className="h-5 w-5 text-neutral-500" />
                        </div>

                        <div className="flex items-center border border-neutral-200 rounded-lg">
                            <button
                                onClick={() => setView("grid")}
                                className={`p-2 rounded-l-lg ${view === "grid" ? "bg-blue-500 text-white" : "text-neutral-500"
                                    }`}
                            >
                                <Squares2X2Icon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className={`p-2 rounded-r-lg ${view === "list" ? "bg-blue-500 text-white" : "text-neutral-500"
                                    }`}
                            >
                                <Bars3Icon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveFilter(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === category
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Content Grid / List */}
                <div className={view === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    : "flex flex-col gap-4"}>
                    {items.filter(item => activeFilter === "All" || item.category === activeFilter)
                        .map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <div className={view === "list" ? "w-1/3" : "w-full"}>
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <span className="text-xs font-semibold text-blue-500">
                                        {item.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-neutral-800 mt-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-neutral-600 text-sm mt-2">
                                        {item.description}
                                    </p>
                                    <div className="mt-4">
                                        <Button variant="primary" size="sm">View Details →</Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex justify-center">
                    <nav className="inline-flex rounded-md shadow">
                        <a
                            href="#"
                            className="px-3 py-2 rounded-l-md border border-neutral-200 bg-white text-neutral-700 hover:bg-blue-50"
                        >
                            Previous
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 border-t border-b border-neutral-200 bg-blue-500 text-white"
                        >
                            1
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 border-t border-b border-neutral-200 bg-white text-neutral-700 hover:bg-blue-50"
                        >
                            2
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 border-t border-b border-neutral-200 bg-white text-neutral-700 hover:bg-blue-50"
                        >
                            3
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 rounded-r-md border border-neutral-200 bg-white text-neutral-700 hover:bg-blue-50"
                        >
                            Next
                        </a>
                    </nav>
                </div>
            </div>
        </div>
    );
}
