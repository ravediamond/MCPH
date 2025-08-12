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
    id: "platform-overview",
    question: "What is the Enterprise AI Artifact Management Platform?",
    answer:
      "Our platform provides secure storage, management, and collaboration capabilities for AI-generated artifacts within enterprise environments. It enables teams to organize, share, and maintain compliance for all AI-created content with enterprise-grade security and audit controls.",
  },
  {
    id: "security-compliance",
    question: "What security and compliance features are included?",
    answer:
      "The platform includes AES-256 encryption, role-based access controls, comprehensive audit logging, SSO/SAML integration, and compliance reporting. All data is stored in enterprise-grade cloud infrastructure with proper backup and disaster recovery procedures.",
  },
  {
    id: "team-collaboration",
    question: "How does team collaboration work?",
    answer:
      "Team members can securely share artifacts within the organization using role-based permissions. Content can be shared via secure links with access controls, password protection, and expiration policies as defined by your enterprise security policies.",
  },
  {
    id: "supported-content-types",
    question: "What types of AI artifacts can be stored?",
    answer:
      "The platform supports all AI-generated content types including text documents, code files, data analysis results, reports, images, charts, structured data (JSON, CSV), and other file formats up to your organization's configured size limits.",
  },
  {
    id: "access-controls",
    question: "How are access permissions managed?",
    answer:
      "Access is managed through role-based permissions integrated with your organization's identity provider. Administrators can define user roles, team access levels, and content sharing policies that align with your enterprise security requirements.",
  },
  {
    id: "api-integration",
    question: "How does the platform integrate with existing AI tools?",
    answer:
      "The platform provides enterprise APIs and supports Model Context Protocol (MCP) for seamless integration with AI tools like Claude and ChatGPT. Integration is configured through your organization's API management system with proper authentication and rate limiting.",
  },
  {
    id: "data-retention",
    question: "What are the data retention and lifecycle policies?",
    answer:
      "Data retention is configurable according to your organization's policies. Content can be set to expire automatically, archived to cold storage, or maintained indefinitely. All retention actions are logged for compliance auditing.",
  },
  {
    id: "audit-logging",
    question: "What audit and monitoring capabilities are available?",
    answer:
      "Comprehensive audit logs track all user actions, content access, sharing activities, and system events. Logs can be exported to your SIEM system and include detailed timestamps, user identification, and action descriptions for compliance reporting.",
  },
];

export default function FAQPage() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="py-8 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb navigation */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 hover:shadow-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="inline-flex items-center px-3 py-2 text-slate-600 bg-slate-100 rounded-lg font-medium">
                FAQ
              </span>
            </div>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Common questions about our Enterprise AI Artifact Management
                Platform
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 pr-4">
                      {item.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {expandedItem === item.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedItem === item.id && (
                  <div className="px-6 pb-4 border-t border-slate-100">
                    <p className="text-slate-700 leading-relaxed pt-4">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-slate-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Need Additional Support?
              </h2>
              <p className="text-slate-600 mb-4">
                Contact our enterprise support team for implementation
                assistance, custom configuration, or technical questions.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 transition-colors duration-200"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
