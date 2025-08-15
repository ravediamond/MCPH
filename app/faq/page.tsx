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
    id: "what-is-mcp-feedback-hub",
    question: "What is MCP Feedback Hub?",
    answer:
      "MCP Feedback Hub is a platform for creating and managing feedback templates using the Model Context Protocol. It allows you to design custom feedback forms, collect responses, and analyze user feedback through a simple interface that integrates with AI tools.",
  },
  {
    id: "getting-started",
    question: "How do I get started?",
    answer:
      "Simply sign in with your Google account, create your first feedback template by defining custom fields and validation rules, then share the template to start collecting responses. The platform includes built-in analytics to help you understand the feedback you receive.",
  },
  {
    id: "template-limits",
    question: "How many feedback templates can I create?",
    answer:
      "Free accounts can create up to 5 feedback templates. Each template can have unlimited custom fields and can collect unlimited responses. Templates are stored permanently and can be shared publicly or kept private.",
  },
  {
    id: "field-types",
    question: "What types of fields can I add to templates?",
    answer:
      "You can add various field types including text inputs, number inputs, boolean (yes/no), single select dropdown, multi-select checkboxes, and rating scales. Each field supports custom validation rules, required/optional settings, and help text.",
  },
  {
    id: "mcp-tools",
    question: "What MCP tools are available?",
    answer:
      "The platform provides three main MCP tools: feedback_template_create (create new templates), feedback_submit (submit responses to templates), and feedback_responses_get (retrieve and analyze responses). These tools integrate seamlessly with AI applications.",
  },
  {
    id: "response-analytics",
    question: "How can I analyze feedback responses?",
    answer:
      "The platform includes built-in analytics to view all responses to your templates. You can see response rates, analyze patterns in feedback, and export data for further analysis. All responses are stored securely and can be accessed at any time.",
  },
  {
    id: "sharing-templates",
    question: "How do I share my feedback templates?",
    answer:
      "Templates can be shared publicly or kept private. Public templates generate a shareable link that anyone can access to submit feedback. Private templates are only accessible to you and can be used for internal feedback collection.",
  },
  {
    id: "security",
    question: "How secure is my feedback data?",
    answer:
      "All feedback data is stored securely using enterprise-grade encryption. Templates and responses are transmitted over HTTPS, and access is controlled through authentication. You maintain full control over your templates and collected feedback.",
  },
  {
    id: "ai-integration",
    question: "Which AI tools work with MCP Feedback Hub?",
    answer:
      "The platform is built on the Model Context Protocol and works with any MCP-compatible AI assistant. This includes Claude and other AI tools that support MCP. Integration allows you to create and manage templates directly through natural language conversations.",
  },
  {
    id: "api-access",
    question: "Is there API access available?",
    answer:
      "Yes, the platform provides MCP-based API access for creating templates, submitting responses, and retrieving analytics. API keys can be generated from your account settings, and there are rate limits to ensure fair usage across all users.",
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
            Everything you need to know about MCP Feedback Hub
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
                href="/feedback/create"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Send Feedback
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
