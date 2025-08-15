"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Home, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "what-is-mcp-storage-hub",
    question: "What is MCP Storage Hub?",
    answer:
      "MCP Storage Hub is an AI artifact storage and organization system using the Model Context Protocol. It lets you store, tag, and search your AI-generated content with advanced semantic search capabilities. Store documents, code, images, and data with intelligent organization features.",
  },
  {
    id: "getting-started",
    question: "How do I get started?",
    answer:
      "Simply sign in with your Google account and start storing your AI artifacts. Use natural language with your AI assistant to upload content: 'Store this code as a crate with tags project:webapp and status:production'. The system automatically organizes and indexes your content for easy retrieval.",
  },
  {
    id: "storage-limits",
    question: "How much can I store?",
    answer:
      "Authenticated users get unlimited permanent storage for their artifacts. Content is organized in crates with no limits on the number of crates you can create. Anonymous uploads expire after 30 days, while authenticated user content is stored indefinitely.",
  },
  {
    id: "content-types",
    question: "What types of content can I store?",
    answer:
      "You can store any type of content including markdown, code files, images, JSON, YAML, CSV, and binary files. Content is automatically categorized into 5 types: Recipe (task instructions), Text, Images, Code, and Data for easy organization.",
  },
  {
    id: "mcp-tools",
    question: "What MCP tools are available?",
    answer:
      "The platform provides comprehensive storage tools: crates_upload (store content), crates_list (browse your crates), crates_get (retrieve content), crates_search (semantic search), crates_share (sharing controls), and crates_update (modify content). These integrate seamlessly with AI applications.",
  },
  {
    id: "search-capabilities",
    question: "How does the search system work?",
    answer:
      "The platform uses advanced semantic search with vector embeddings to understand content meaning, not just keywords. Search by tags, categories, or natural language queries. For example, 'find authentication code' will match auth-related content even without exact keyword matches.",
  },
  {
    id: "tagging-system",
    question: "How does the tagging system work?",
    answer:
      "Use hierarchical tags like 'project:webapp', 'env:production', or 'type:config' to organize content. Tags enable powerful filtering and discovery. The system supports smart tag suggestions and can find related content based on tag patterns.",
  },
  {
    id: "security",
    question: "How secure is my stored data?",
    answer:
      "All data is stored securely using enterprise-grade encryption. Content is transmitted over HTTPS and access is controlled through authentication. You maintain full control over your artifacts with granular sharing permissions and optional password protection.",
  },
  {
    id: "ai-integration",
    question: "Which AI tools work with MCP Storage Hub?",
    answer:
      "The platform is built on the Model Context Protocol and works with any MCP-compatible AI assistant including Claude, ChatGPT, and others. Integration allows you to store, organize, and retrieve content directly through natural language conversations.",
  },
  {
    id: "api-access",
    question: "Is there API access available?",
    answer:
      "Yes, the platform provides comprehensive MCP-based API access for storing, organizing, searching, and sharing content. API keys can be generated from your account settings with rate limits to ensure fair usage across all users.",
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center hover:text-gray-900">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">FAQ</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about MCP Storage Hub
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
              >
                <span className="font-medium text-gray-900 pr-4">
                  {item.question}
                </span>
                {openItems.includes(item.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {openItems.includes(item.id) && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Documentation
              </Link>
              <Link
                href="/api-keys"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Get API Key
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
