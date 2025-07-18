import React from "react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdvancedSearch: boolean;
  setIsAdvancedSearch: (isAdvanced: boolean) => void;
  advancedSearchFields: {
    fileName: string;
    tags: string;
    project: string;
    type: string;
    status: string;
    priority: string;
    context: string;
  };
  setAdvancedSearchFields: (fields: any) => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAdvancedSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  isAdvancedSearch,
  setIsAdvancedSearch,
  advancedSearchFields,
  setAdvancedSearchFields,
  handleSearchKeyDown,
  handleAdvancedSearch,
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative w-full max-w-2xl">
        {!isAdvancedSearch ? (
          <>
            <input
              type="text"
              placeholder="Search by title, tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="py-4 px-5 pl-12 border-2 border-gray-300 rounded-xl w-full shadow-lg focus:outline-none focus:ring-3 focus:ring-primary-300 focus:border-primary-400 transition-all duration-200 text-lg bg-white"
            />
            <FaSearch className="absolute left-4 top-5 text-gray-500 text-lg" />
          </>
        ) : (
          <div className="bg-white border-2 border-gray-300 rounded-xl w-full shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Search by title"
                  value={advancedSearchFields.fileName}
                  onChange={(e) =>
                    setAdvancedSearchFields({
                      ...advancedSearchFields,
                      fileName: e.target.value,
                    })
                  }
                  className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Any tag"
                  value={advancedSearchFields.tags}
                  onChange={(e) =>
                    setAdvancedSearchFields({
                      ...advancedSearchFields,
                      tags: e.target.value,
                    })
                  }
                  className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <input
                  type="text"
                  placeholder="project:name"
                  value={advancedSearchFields.project}
                  onChange={(e) =>
                    setAdvancedSearchFields({
                      ...advancedSearchFields,
                      project: e.target.value,
                    })
                  }
                  className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  placeholder="type:name"
                  value={advancedSearchFields.type}
                  onChange={(e) =>
                    setAdvancedSearchFields({
                      ...advancedSearchFields,
                      type: e.target.value,
                    })
                  }
                  className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <input
                  type="text"
                  placeholder="status:name"
                  value={advancedSearchFields.status}
                  onChange={(e) =>
                    setAdvancedSearchFields({
                      ...advancedSearchFields,
                      status: e.target.value,
                    })
                  }
                  className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="text"
                  placeholder="priority:level"
                  value={advancedSearchFields.priority}
                  onChange={(e) =>
                    setAdvancedSearchFields({
                      ...advancedSearchFields,
                      priority: e.target.value,
                    })
                  }
                  className="py-2 px-3 border border-gray-200 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleAdvancedSearch}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              >
                🔍 Search
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
          className="absolute right-4 top-4 text-gray-500 hover:text-primary-600 transition-colors duration-200 bg-white rounded-lg p-1 shadow-sm hover:shadow-md"
          title={isAdvancedSearch ? "Simple search" : "Filter / sort"}
        >
          {isAdvancedSearch ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
