'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
    initialQuery?: string;
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({
    initialQuery = '',
    onSearch,
    placeholder = 'Search features...',
    className = ''
}: SearchBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery || searchParams?.get('q') || '');

    // Update query if searchParams changes (e.g., when user navigates)
    useEffect(() => {
        const queryParam = searchParams?.get('q');
        if (queryParam !== null && queryParam !== query) {
            setQuery(queryParam || '');
        }
    }, [searchParams]);

    const handleSearch = () => {
        if (!query.trim()) return;

        if (onSearch) {
            // If a custom search handler is provided, use it
            onSearch(query);
        } else {
            // Default behavior: redirect to browse page
            router.push(`/browse?q=${encodeURIComponent(query)}`);
        }
    };

    // New handler for keydown events on the input field
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();  // Prevents form submission if the input is inside a form
            handleSearch();
        }
    };

    return (
        <div className={`relative ${className || 'mb-8'}`}>
            <input
                className="w-full pr-16 py-2 px-4 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 transition-colors"
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                    className="h-8 w-8 flex items-center justify-center bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-300 transition-colors"
                    aria-label="Search"
                    onClick={handleSearch}
                >
                    <FiSearch className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
