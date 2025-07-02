"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export default function TagInput({
  tags,
  onChange,
  disabled = false,
  placeholder = "Add tags...",
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (input.trim()) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(input.toLowerCase()) &&
          !tags.includes(suggestion),
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [input, suggestions, tags]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      // Remove the last tag when backspace is pressed on an empty input
      const newTags = [...tags];
      newTags.pop();
      onChange(newTags);
    }
  };

  const addTag = (tag: string) => {
    // Basic format validation
    const formattedTag = tag.trim().toLowerCase();
    if (!formattedTag) return;

    // Prefix-based format validation
    const validPrefixes = ["project:", "status:", "priority:"];
    const hasPrefix = validPrefixes.some((prefix) =>
      formattedTag.startsWith(prefix),
    );

    // Add prefix if it doesn't have one and doesn't contain a colon
    const finalTag =
      !formattedTag.includes(":") && !hasPrefix
        ? `tag:${formattedTag}`
        : formattedTag;

    if (!tags.includes(finalTag)) {
      onChange([...tags, finalTag]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap items-center gap-2 p-2 border rounded-md bg-white min-h-[42px] ${
          disabled ? "bg-gray-100" : ""
        } ${
          showSuggestions && filteredSuggestions.length > 0
            ? "border-[#ff7a32] ring-1 ring-[#ff7a32]"
            : "border-gray-300 focus-within:border-[#ff7a32] focus-within:ring-1 focus-within:ring-[#ff7a32]"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-gray-500 hover:text-gray-700"
                aria-label={`Remove tag ${tag}`}
              >
                <FaTimes size={10} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length > 0 ? "" : placeholder}
          className="flex-grow border-none outline-none p-1 text-sm placeholder:text-gray-400 disabled:bg-transparent"
          disabled={disabled}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <ul className="py-1 text-sm">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Helper text */}
      <p className="mt-1 text-xs text-gray-500">
        Examples: project:work, status:active, priority:high, tag:important
      </p>
    </div>
  );
}
