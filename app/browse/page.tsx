'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    MagnifyingGlassIcon,
    TagIcon,
    ChevronDownIcon,
    Squares2X2Icon,
    Bars3Icon,
} from "@heroicons/react/24/outline";
import Button from "components/ui/Button";

export default function BrowsePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize searchQuery with the value from URL if present.
    const initialQuery = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [activeFilter, setActiveFilter] = useState<string>("All");

    // State to store real items fetched from the API.
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // For categories, if you have real ones they can be fetched as well,
    // but here we keep the dummy array for demonstration.
    const categories = [
        "All",
        "Technology",
        "Science",
        "Business",
        "Health",
        "Education",
    ];

    // Function to fetch items from the API.
    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            // Our API will return all items if no search query is provided.
            const url = searchQuery.trim()
                ? `/api/search?q=${encodeURIComponent(searchQuery)}`
                : `/api/search`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results) {
                setItems(data.results);
            } else {
                setError("No results found.");
            }
        } catch (err) {
            setError("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on initial render and when searchQuery changes.
    useEffect(() => {
        fetchItems();
    }, [searchQuery]);

    // Handler to redirect (or update state) with the search query.
    const handleSearch = () => {
        // Update the URL.
        if (!searchQuery.trim()) {
            router.push("/browse");
        } else {
            router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
        }
        // Fetch new items (the useEffect above will do this)
        // or you can call fetchItems() directly here.
    };

    // Optional: Trigger search on Enter key.
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    // Local filtering by category if needed.
    // (This happens on top of the fetched data.)
    const filteredItems = items.filter((item) => {
        const matchesCategory =
            activeFilter === "All" || item.tags?.includes(activeFilter);
        const matchesSearch =
            !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-12 pr-4 py-5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm"
                        />
                        <MagnifyingGlassIcon
                            className="absolute left-4 top-5 h-6 w-6 text-neutral-400 cursor-pointer"
                            onClick={handleSearch}
                        />
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-neutral-200 cursor-pointer">
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

                {/* Display loading or error states */}
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}

                {/* Content Grid / List */}
                <div
                    className={
                        view === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                            : "flex flex-col gap-4"
                    }
                >
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
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
                                        alt={item.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <span className="text-xs font-semibold text-blue-500">
                                        {item.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-neutral-800 mt-1">
                                        {item.name}
                                    </h3>
                                    <p className="text-neutral-600 text-sm mt-2">
                                        {item.description}
                                    </p>
                                    <div className="mt-4">
                                        <Button variant="primary" size="sm">
                                            View Details →
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        !loading && <p className="text-center w-full">No results found.</p>
                    )}
                </div>

                {/* Pagination (if applicable) */}
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
