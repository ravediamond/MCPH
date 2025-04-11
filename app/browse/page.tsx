"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, Grid, List } from "lucide-react";

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        Browse Content
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Discover and explore the latest content in our hub
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search content..."
                            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700">
                            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Filter</span>
                            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>

                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                            <button
                                onClick={() => setView("grid")}
                                className={`p-2 ${view === "grid"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-500 dark:text-gray-400"
                                    } rounded-l-lg`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className={`p-2 ${view === "list"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-500 dark:text-gray-400"
                                    } rounded-r-lg`}
                            >
                                <List size={18} />
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
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                <div className={`${view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}`}>
                    {items
                        .filter((item) => activeFilter === "All" || item.category === activeFilter)
                        .map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 ${view === "list" ? "flex" : ""
                                    }`}
                            >
                                <div className={`${view === "list" ? "w-1/3" : "w-full"}`}>
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <div className={`p-4 ${view === "list" ? "w-2/3" : ""}`}>
                                    <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                                        {item.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                                        {item.description}
                                    </p>
                                    <div className="mt-4">
                                        <button className="text-blue-500 dark:text-blue-400 text-sm font-medium hover:underline">
                                            View Details →
                                        </button>
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
                            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        >
                            Previous
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 border-t border-b border-gray-300 dark:border-gray-700 bg-blue-500 text-white"
                        >
                            1
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 border-t border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            2
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 border-t border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            3
                        </a>
                        <a
                            href="#"
                            className="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            Next
                        </a>
                    </nav>
                </div>
            </div>
        </div>
    );
}
