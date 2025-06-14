"use client";

import Link from "next/link";
import Carousel from "../components/Carousel";
import { useAuthRedirect } from "../contexts/useAuthRedirect";

export default function Home() {
  useAuthRedirect({ whenAuthenticated: "/home" });

  return (
    <div className="bg-beige-200 min-h-screen">
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3 text-gray-800">
            Share AI-Generated Content With Anyone
          </h1>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            MCPH is a simple way to store and share content created by AI
            systems. Connect ChatGPT or Claude directly to MCPH and instantly
            generate shareable links for code, markdown, images, and more.
          </p>

          <Carousel />

          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition duration-300 border border-blue-700 mr-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
            Sign In to Upload
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-blue-600 bg-white rounded-lg shadow hover:bg-gray-50 transition duration-300 border border-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Documentation
          </Link>
        </div>
      </section>

      {/* Core Features - Clear Value Proposition */}
      <section className="py-8 px-4 bg-beige-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-medium mb-6 text-center text-gray-800">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <div className="text-blue-600 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 text-gray-800">
                Direct AI Integration
              </h3>
              <p className="text-gray-600 text-sm">
                Connect ChatGPT, Claude, and other AI tools directly to MCPH
                using the Model Context Protocol (MCP). Generate and share
                content without manual uploads.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <div className="text-blue-600 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 text-gray-800">
                Multiple Content Types
              </h3>
              <p className="text-gray-600 text-sm">
                Share code snippets, markdown documents, images, JSON files, and
                binary files. Each content type has an optimized viewing
                experience.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <div className="text-blue-600 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 text-gray-800">Secure Sharing</h3>
              <p className="text-gray-600 text-sm">
                Password-protect sensitive content with a simple password
                option. All links can be shared with anyone - no account needed
                to view shared content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Clear Step-by-Step */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-medium mb-8 text-center text-gray-800">
            How It Works: 3 Simple Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-medium">1</span>
              </div>
              <h3 className="font-medium mb-2 text-gray-800">Create Account</h3>
              <p className="text-gray-600 text-sm">
                Sign up for a free account and generate your API key. This key
                allows AI tools to connect to your MCPH account.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-medium">2</span>
              </div>
              <h3 className="font-medium mb-2 text-gray-800">
                Connect Your AI
              </h3>
              <p className="text-gray-600 text-sm">
                Add MCPH to ChatGPT, Claude, or other MCP-compatible tools using{" "}
                <code>mcp-remote</code>. Takes less than 30 seconds to set up.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-medium">3</span>
              </div>
              <h3 className="font-medium mb-2 text-gray-800">Share Content</h3>
              <p className="text-gray-600 text-sm">
                Ask your AI to create and share content via MCPH. Get back a
                shareable link you can send to anyone - no login required to
                view.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/docs/local-usage"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <span>View detailed setup instructions</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-8 px-4 bg-beige-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-medium mb-6 text-center text-gray-800">
            What Can You Share?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <div className="text-blue-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">Markdown</p>
            </div>

            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <div className="text-blue-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">Code</p>
            </div>

            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <div className="text-blue-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">Images</p>
            </div>

            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <div className="text-blue-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">JSON</p>
            </div>

            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <div className="text-blue-600 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">Binary Files</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto bg-blue-50 rounded-lg p-8 border border-blue-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Ready to streamline your AI content sharing?
          </h2>
          <p className="text-gray-600 mb-6">
            Create a free account today and start sharing AI-generated content
            with anyone, anywhere.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition duration-300"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-6 px-4 border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            MCPH: Seamless content sharing between AI tools and humans.
          </p>
          <div className="flex justify-center space-x-6">
            <Link
              href="/docs"
              className="text-gray-500 hover:text-blue-600 text-sm"
            >
              Documentation
            </Link>
            <Link
              href="/about"
              className="text-gray-500 hover:text-blue-600 text-sm"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-gray-500 hover:text-blue-600 text-sm"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-blue-600 text-sm"
            >
              Privacy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
