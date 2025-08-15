"use client";

import Link from "next/link";
import { useState } from "react";
import WaitingListModal from "../components/WaitingListModal";

export default function Home() {
  const [waitingListModalOpen, setWaitingListModalOpen] = useState(false);

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            MCP Storage Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Store and manage your AI artifacts using the Model Context Protocol.
            Organize, search, and access your data with powerful tagging and
            search capabilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Secure Storage
              </h3>
              <p className="text-gray-600">
                Store your AI artifacts securely with automatic backups and
                version control. Access your data from anywhere with full
                encryption.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                MCP Integration
              </h3>
              <p className="text-gray-600">
                Built on the Model Context Protocol, enabling seamless
                integration with AI applications and tools.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Tagging & Search
              </h3>
              <p className="text-gray-600">
                Organize your artifacts with intelligent tagging and powerful
                search capabilities to find exactly what you need instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Store Artifacts
              </h3>
              <p className="text-gray-600">
                Upload and store your AI artifacts, documents, and data files
                with automatic metadata extraction and indexing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Tag & Organize
              </h3>
              <p className="text-gray-600">
                Apply tags and categories to your artifacts for easy
                organization and retrieval using our powerful tagging system.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Search & Access
              </h3>
              <p className="text-gray-600">
                Find exactly what you need with advanced search capabilities
                across content, tags, and metadata through MCP integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start storing and organizing your AI artifacts today.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
          >
            Sign in with Google
          </Link>
        </div>
      </section>

      {/* Waiting List Modal */}
      <WaitingListModal
        isOpen={waitingListModalOpen}
        onClose={() => setWaitingListModalOpen(false)}
      />
    </div>
  );
}
