"use client";

import Link from "next/link";
import { FaCheck, FaCopy, FaUpload } from "react-icons/fa";
import { useAuthRedirect } from "../contexts/useAuthRedirect";
import { useAnonymousUploadTransition } from "../contexts/useAnonymousUploadTransition";
import HeroUpload from "../components/HeroUpload";
import WaitingListModal from "../components/WaitingListModal";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function Home() {
  // Redirect authenticated users to their dashboard if needed
  useAuthRedirect({ whenAuthenticated: "/crates" });

  // Handle migration of anonymous uploads when a user logs in
  useAnonymousUploadTransition();

  // State for waiting list modal
  const [waitingListModalOpen, setWaitingListModalOpen] = useState(false);

  return (
    <div className="bg-gradient-to-b from-white to-beige-50 min-h-screen">
      {/* Hero Section - Focused on File Upload */}
      <section className="relative isolate overflow-hidden py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold">
              AI Artifact Storage & Sharing System
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Crates = packaged AI artifacts you can open anywhere
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Test it without creating an account.
            </p>
            <p className="text-xl text-gray-600 max-w-xl mx-auto mt-4">
              Complete AI workflow ecosystem—organize what to do, how to do it,
              what tools to use, and where to get data.
            </p>
            <p className="text-base text-gray-500 max-w-xl mx-auto mt-2">
              From recipes and code to data sources and
              visualizations—everything AI needs in one place.
            </p>
            <div className="mt-6">
              <Link
                href="/upload"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Get started →
              </Link>
            </div>
          </div>

          {/* File Upload Hero Component */}
          <div className="w-full bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-6 relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <HeroUpload />
          </div>

          {/* Integration logo bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-center gap-4 mb-6">
            <span className="text-sm text-gray-500">Works with:</span>
            <span className="font-medium">Claude</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">ChatGPT</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">VS Code</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">GitHub Copilot</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">Cursor</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">Windsurf</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">LangGraph</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium">Perplexity</span>
          </div>

          {/* Security Badge Row */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-center gap-3 mb-6 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-green-50 text-green-700 border border-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
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
              AES-256
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              HTTPS
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              7-day guest expiry
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Permanent for members
            </span>
          </div>

          {/* Ecosystem Highlights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              🗂️ Complete AI Workflow Ecosystem
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">📝</div>
                <div className="font-medium text-gray-700">Recipes</div>
                <div className="text-gray-500">What to do</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">📚</div>
                <div className="font-medium text-gray-700">Knowledge</div>
                <div className="text-gray-500">How to do it</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🛠️</div>
                <div className="font-medium text-gray-700">Tools</div>
                <div className="text-gray-500">What to use</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">📊</div>
                <div className="font-medium text-gray-700">Data</div>
                <div className="text-gray-500">Where to find it</div>
              </div>
            </div>
          </div>

          {/* Benefits Tag Line - simplified */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-4">
            <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" /> Free
            </span>
            <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" /> Secure
            </span>
            <span className="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" /> Only MCP
              setup required
            </span>
          </div>

          {/* Open Source Badge */}
          <div className="mt-6 text-center">
            <a
              href="https://github.com/ravediamond/MCPH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-300 shadow-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Open Source on GitHub
            </a>
            <p className="text-xs text-gray-500 mt-2">
              Self-hostable • Community-driven • MIT License
            </p>
          </div>
        </div>

        {/* Subtle corner decoration */}
        <div className="absolute -bottom-10 -left-10 lg:block hidden opacity-10 pointer-events-none">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="150" r="10" fill="#FF7A32" />
            <circle cx="90" cy="130" r="15" fill="#FF7A32" />
            <circle cx="140" cy="160" r="8" fill="#FF7A32" />
            <circle cx="160" cy="120" r="12" fill="#FF7A32" />
            <path d="M50 150 L90 130" stroke="#FF7A32" strokeWidth="2" />
            <path d="M90 130 L140 160" stroke="#FF7A32" strokeWidth="2" />
            <path d="M140 160 L160 120" stroke="#FF7A32" strokeWidth="2" />
          </svg>
        </div>
      </section>

      {/* Workflow Steps Section */}
      <section className="py-10 md:py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-10 text-center text-gray-800">
            Complete Workflow in 6 Steps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <FaUpload className="text-lg md:text-xl" />
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-lg md:text-xl">
                Upload
              </h3>
              <p className="text-gray-600 text-center text-base md:text-lg">
                Instantly store AI artifacts with no account required.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Interface
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  MCP
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-lg md:text-xl">
                Search
              </h3>
              <p className="text-gray-600 text-center text-base md:text-lg">
                Find your content with powerful semantic search.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Interface
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  MCP
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-lg md:text-xl">
                Retrieve
              </h3>
              <p className="text-gray-600 text-center text-base md:text-lg">
                Access your artifacts instantly when needed.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Interface
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  MCP
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <span className="text-lg md:text-xl">🔗</span>
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-lg md:text-xl">
                Share
              </h3>
              <p className="text-gray-600 text-center text-base md:text-lg">
                Share with humans and AI - no login required.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Interface
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  MCP
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-lg md:text-xl">
                Collect Feedback
              </h3>
              <p className="text-gray-600 text-center text-base md:text-lg">
                Create custom feedback forms to gather user insights.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Interface
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  MCP
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 5.943 7.523 3 12 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 18.057 2.458 12z"
                  />
                </svg>
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-lg md:text-xl">
                Discover
              </h3>
              <p className="text-gray-600 text-center text-base md:text-lg">
                Explore community crates in the public gallery.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Interface
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  MCP
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
            Why devs choose MCPH
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Persistent Artifact Storage */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <path d="M17 14v6"></path>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Persistent Artifact Storage
              </h4>
              <p className="text-sm text-gray-600">
                Every artifact, safe and searchable.
              </p>
            </div>

            {/* 2. Seamless Share Links */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Seamless Share Links
              </h4>
              <p className="text-sm text-gray-600">
                One short link opens for humans and AI tools—no copy-paste pain.
              </p>
            </div>

            {/* 3. Native MCP Integration */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    <path d="M9 14l2 2 4-4"></path>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Native MCP Integration
              </h4>
              <p className="text-sm text-gray-600">
                Fully integrated with compatible AI tools and usable directly by
                them.
              </p>
            </div>

            {/* 4. Context Engineering Hub */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Context Engineering Hub
              </h4>
              <p className="text-sm text-gray-600">
                Serve each Agent everything it needs to complete its tasks.
              </p>
            </div>

            {/* 5. Multi-Agent Relay */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="8"
                      rx="2"
                      ry="2"
                    ></rect>
                    <rect
                      x="2"
                      y="14"
                      width="20"
                      height="8"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Multi-Agent Relay
              </h4>
              <p className="text-sm text-gray-600">
                All AI tools—Claude, ChatGPT, Gemini—can write and access the
                same artifacts.
              </p>
            </div>

            {/* 6. Feedback Collection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Feedback Collection
              </h4>
              <p className="text-sm text-gray-600">
                Create custom feedback forms and collect user responses with
                powerful form builder.
              </p>
            </div>

            {/* 7. Public Gallery */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Public Gallery
              </h4>
              <p className="text-sm text-gray-600">
                Discover amazing community crates in a beautiful, categorized
                gallery with creator attribution.
              </p>
            </div>

            {/* 8. Social Sharing */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 16.08c-1.24 0-2.25-.99-2.25-2.25s1.01-2.25 2.25-2.25 2.25 1.01 2.25 2.25-1.01 2.25-2.25 2.25z" />
                    <path d="M6 6.83c-1.24 0-2.25.99-2.25 2.25S4.76 11.33 6 11.33s2.25-.99 2.25-2.25S7.24 6.83 6 6.83z" />
                    <path d="M6 17.17c-1.24 0-2.25.99-2.25 2.25S4.76 21.67 6 21.67s2.25-.99 2.25-2.25-.99-2.25-2.25-2.25z" />
                    <path d="M8.25 9.08l7.5 4.84" />
                    <path d="M8.25 17.17l7.5-4.84" />
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Smart Social Sharing
              </h4>
              <p className="text-sm text-gray-600">
                Share across Twitter, Reddit, LinkedIn, Discord with intelligent
                markdown formatting for each platform.
              </p>
            </div>

            {/* 9. Inline Editing */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="flex items-center mb-4">
                <span
                  className="bg-orange-100 text-[#FF7A00] p-2 rounded-lg"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Inline Editing
              </h4>
              <p className="text-sm text-gray-600">
                Edit crate metadata directly from the page with real-time tag
                management and permission controls.
              </p>
            </div>
          </div>

          {/* Repeated CTA Button */}
          <div className="mt-10 text-center">
            <Link
              href="/upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Get started →
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-orange-50 to-blue-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              🚀 6 Power Use Cases for MCPH
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Transform how you work with AI. From persistent memory to
              multi-agent collaboration, discover what's possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Use Case 1: Persistent AI Memory */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🧠</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Persistent AI Memory System
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Transform AI into a learning partner that remembers everything
                across sessions. Build a searchable knowledge base that grows
                smarter over time.
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Example:</strong> Store your coding standards once,
                every AI session can reference them: "Apply our auth patterns to
                this new component"
              </div>
              <div className="text-xs text-orange-600 font-medium">
                "Context Engineering Hub" ↗
              </div>
            </div>

            {/* Use Case 2: Living Documentation */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📚</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Living Documentation
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Documentation that evolves with your code. When you change
                features, AI updates all related docs automatically.
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Example:</strong> Change database schema → AI updates
                ERD diagrams, migration guides, and API docs in connected
                crates.
              </div>
              <div className="text-xs text-orange-600 font-medium">
                "Seamless Share Links" ↗
              </div>
            </div>

            {/* Use Case 3: Multi-Agent Pipeline */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🤝</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Multi-Agent Pipeline
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Different AI specialists working together on your project, each
                handling what they do best.
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Example:</strong> Claude designs → ChatGPT codes →
                Gemini tests. All coordinated through shared crates.
              </div>
              <div className="text-xs text-orange-600 font-medium">
                "Multi-Agent Relay" ↗
              </div>
            </div>

            {/* Use Case 4: Project Context Switching */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🎯</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Instant Context Switching
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Switch between projects instantly with full context. Each
                project has its own "brain" that any AI can load.
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Example:</strong> "Switch to e-commerce project" → AI
                knows Next.js, Stripe APIs, and your custom auth flow.
              </div>
              <div className="text-xs text-orange-600 font-medium">
                "Persistent Artifact Storage" ↗
              </div>
            </div>

            {/* Use Case 5: Dynamic Feedback */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Smart Feedback Collection
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Build smart surveys that adapt based on responses, with AI
                analyzing feedback in real-time.
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Example:</strong> Create bug report forms that AI
                monitors and suggests fixes for similar issues.
              </div>
              <div className="text-xs text-orange-600 font-medium">
                "Feedback Collection" ↗
              </div>
            </div>

            {/* Use Case 6: Knowledge Graph */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🕸️</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Knowledge Graph Builder
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Connect ideas, research, and insights into a searchable
                knowledge network that reveals hidden patterns.
              </p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Example:</strong> Research competitors → store findings
                → AI reveals market gaps you hadn't noticed.
              </div>
              <div className="text-xs text-orange-600 font-medium">
                "Native MCP Integration" ↗
              </div>
            </div>
          </div>

          {/* Call to Action for Use Cases */}
          <div className="text-center mt-12">
            <Link
              href="/upload"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-sm hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300"
            >
              Start Building Your AI Workflow →
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              Free account • No credit card required • 30-second setup
            </p>
          </div>
        </div>
      </section>

      {/* Content Types Section - Simplified */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
            Complete AI Workflow Ecosystem
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Organize your AI workflow across 9 strategic categories designed to
            create a comprehensive ecosystem
          </p>

          {/* First row - 3 blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">🖼️</div>
              <p className="font-medium text-gray-800">Image</p>
              <p className="text-xs text-gray-500 mt-1">Visual content</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">📊</div>
              <p className="font-medium text-gray-800">Data</p>
              <p className="text-xs text-gray-500 mt-1">CSVs, PDFs, datasets</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">🔗</div>
              <p className="font-medium text-gray-800">Data Source</p>
              <p className="text-xs text-gray-500 mt-1">
                APIs, databases, feeds
              </p>
            </div>
          </div>

          {/* Second row - 3 blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">📈</div>
              <p className="font-medium text-gray-800">Visualization</p>
              <p className="text-xs text-gray-500 mt-1">Charts, graphs</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">📝</div>
              <p className="font-medium text-gray-800">Recipe</p>
              <p className="text-xs text-gray-500 mt-1">
                AI agent instructions
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">📚</div>
              <p className="font-medium text-gray-800">Knowledge</p>
              <p className="text-xs text-gray-500 mt-1">
                Documentation, guides
              </p>
            </div>
          </div>

          {/* Third row - 3 blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">🛠️</div>
              <p className="font-medium text-gray-800">Tools</p>
              <p className="text-xs text-gray-500 mt-1">
                MCP servers, APIs, services
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">💻</div>
              <p className="font-medium text-gray-800">Code</p>
              <p className="text-xs text-gray-500 mt-1">
                Code snippets/examples
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">❓</div>
              <p className="font-medium text-gray-800">Others</p>
              <p className="text-xs text-gray-500 mt-1">Everything else</p>
            </div>
          </div>

          {/* Ecosystem explanation */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 max-w-3xl mx-auto">
              This ecosystem enables users to find:{" "}
              <span className="font-medium text-gray-800">what to do</span>{" "}
              (Recipes),
              <span className="font-medium text-gray-800">
                how to do it
              </span>{" "}
              (Code, Knowledge),
              <span className="font-medium text-gray-800">
                what tools to use
              </span>{" "}
              (Tools),
              <span className="font-medium text-gray-800">
                where to get data
              </span>{" "}
              (Data Source), and
              <span className="font-medium text-gray-800">
                actual data
              </span>{" "}
              (Data).
            </p>
          </div>
        </div>
      </section>

      {/* Guest vs Logged-in Users Comparison (Accordion) */}
      <section className="py-8 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <details className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 group">
            <summary className="list-none flex justify-between items-center cursor-pointer font-medium text-gray-700">
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2 text-orange-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
                Guest vs Logged-in Features
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 transform group-open:rotate-180 transition-transform"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </summary>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 font-medium">Feature</th>
                    <th className="p-2 font-medium">Guest Users</th>
                    <th className="p-2 font-medium">Logged-in Users</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="p-2">File Uploads</td>
                    <td className="p-2 text-green-600">✓ (10MB max)</td>
                    <td className="p-2 text-green-600">✓ (10MB max)</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-2">Download Links</td>
                    <td className="p-2">24-hour expiry</td>
                    <td className="p-2">24-hour expiry</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-2">Storage Duration</td>
                    <td className="p-2">7-day auto-delete</td>
                    <td className="p-2 text-green-600">
                      Permanent (until deleted)
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-2">File Management</td>
                    <td className="p-2 text-red-600">✗</td>
                    <td className="p-2 text-green-600">✓</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-2">Semantic Search</td>
                    <td className="p-2 text-red-600">✗</td>
                    <td className="p-2 text-green-600">✓</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="p-2">API Access</td>
                    <td className="p-2 text-red-600">✗</td>
                    <td className="p-2 text-green-600">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
            Simple Pricing Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Free</h3>
                <p className="text-3xl font-bold text-gray-800 mt-4">$0</p>
                <p className="text-sm text-gray-500 mt-1">Forever</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">Up to 10MB file size</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">500MB total storage</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">10 shared crates max</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">
                    5 feedback templates max
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Securely stored until you delete them (logged in users)
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">
                    7-day expiry for guest uploads
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-600">Basic file formats</span>
                </li>
              </ul>

              <div className="text-center">
                <Link
                  href="/upload"
                  className="inline-block w-full px-6 py-3 text-center font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors duration-300"
                >
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 shadow-md border border-orange-200 relative hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                COMING SOON
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Pro</h3>
                <p className="text-3xl font-bold text-gray-800 mt-4">
                  Coming Soon
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Be the first to know
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>100MB</strong> file size limit
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>10GB</strong> total storage
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>100</strong> shared crates
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>30-day</strong> link expiry
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Custom expiry dates</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Full-content search</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Faster MCP calls</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    <strong>50</strong> feedback templates
                  </span>
                </li>
              </ul>

              <div className="text-center">
                <button
                  onClick={() => setWaitingListModalOpen(true)}
                  className="inline-block w-full px-6 py-3 text-center font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors duration-300"
                >
                  Join Waiting List
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waiting List Modal */}
      <WaitingListModal
        isOpen={waitingListModalOpen}
        onClose={() => setWaitingListModalOpen(false)}
      />

      {/* Call to Action */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 border border-orange-200 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-800">
            Ready to store your AI artifacts in crates?
          </h2>
          <p className="text-gray-700 mb-8 text-xl">
            Upload now with no account required, or sign up for permanent
            storage.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-orange-500 rounded-lg shadow hover:bg-orange-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              Start Uploading Now
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-orange-600 bg-white rounded-lg shadow hover:bg-gray-50 transition-all duration-300 border border-orange-300 hover:-translate-y-1 hover:shadow-md"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
