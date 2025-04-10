'use client';

import { useState } from 'react';

export default function SearchBar() {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        // Implement your search functionality here
        console.log(`Search for: ${query}`);
    };

    return (
        <div className="relative mb-8">
            <input
                className="w-full pr-16 py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Search features..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                    className="h-7 w-7 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    aria-label="Search database"
                    onClick={handleSearch}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
