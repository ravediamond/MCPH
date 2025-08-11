import React from "react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearchKeyDown,
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative w-full max-w-2xl">
        <input
          type="text"
          placeholder="Search by title, tag…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="py-4 px-5 pl-12 border-2 border-gray-300 rounded-xl w-full shadow-lg focus:outline-none focus:ring-3 focus:ring-primary-300 focus:border-primary-400 transition-all duration-200 text-lg bg-white"
        />
        <FaSearch className="absolute left-4 top-5 text-gray-500 text-lg" />
      </div>
    </div>
  );
};

export default SearchBar;
