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
    id: "chatgpt-pro-requirement",
    question: "Do I need ChatGPT Pro to use MCPH with ChatGPT?",
    answer:
      "Yes, MCPH custom connectors require ChatGPT Pro or higher plans (Pro, Team, Enterprise, or Edu workspaces). This is because custom connectors that follow the Model Context Protocol (MCP) are only available for ChatGPT Pro and higher tiers. Claude users can access MCPH without any subscription requirements.",
  },
  {
    id: "what-is-mcph",
    question: "What is MCPH?",
    answer:
      "MCPH (Model Context Protocol Hub) is an AI artifact storage and sharing platform that lets you save and share anything from your AI chats with permanent links. One click in Claude or ChatGPT Pro+ creates a shareable link that works everywhere.",
  },
  {
    id: "how-sharing-works",
    question: "How does sharing work?",
    answer:
      "When you make a crate public, we generate a permanent link that anyone can access without needing to sign up or log in. You can share this link via email, social media, or any other platform. The recipient just clicks the link to view your content.",
  },
  {
    id: "free-account-limits",
    question: "What are the limits for free accounts?",
    answer:
      "Free accounts include: up to 10MB file size, 500MB total storage, 10 shared crates maximum, 5 feedback templates maximum, permanent storage (no expiration), password protection for sensitive content, AES-256 encryption, and secure HTTPS access.",
  },
  {
    id: "supported-file-types",
    question: "What types of content can I save?",
    answer:
      "MCPH supports a complete AI workflow ecosystem: Text (any written content), Images (pictures, charts, diagrams), Code (scripts and programming), Data (spreadsheets, JSONs, CSVs), Recipe (AI task instructions), and Polls (created via AI tools only).",
  },
  {
    id: "content-security",
    question: "How secure is my content?",
    answer:
      "All content is encrypted using AES-256 encryption and transmitted over HTTPS. You can add password protection to sensitive content for an extra layer of security. We use Google Cloud Storage for reliable, enterprise-grade file storage.",
  },
  {
    id: "mcp-setup",
    question: "How do I set up MCP with my AI tool?",
    answer:
      "First, create a free account at mcph.io and generate an API key. Then configure your AI tool to use our MCP endpoint: https://api.mcph.io/mcp with your API key. The specific setup steps vary by tool, but most have a dedicated section for MCP server configuration.",
  },
  {
    id: "content-expiration",
    question: "Do my files expire?",
    answer:
      "Content uploaded by authenticated users is stored permanently and never expires (until you delete it). However, download links generated for sharing expire after 24 hours for security reasons. The actual content remains accessible through the public sharing link.",
  },
];

export default function FAQPage() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-8 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb navigation */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 hover:shadow-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="inline-flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium">
                FAQ
              </span>
            </div>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Everything you need to know about MCPH
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {item.question}
                    </h3>
                    {expandedItem === item.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedItem === item.id && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Still have questions?
              </h3>
              <p className="text-blue-800 mb-4">
                Can't find what you're looking for? We're here to help!
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Documentation
                </Link>
                <Link
                  href="/feedback/create"
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}