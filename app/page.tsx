"use client";

import Link from "next/link";
import { FaCheck, FaCopy, FaUpload } from "react-icons/fa";
import { useAuthRedirect } from "../contexts/useAuthRedirect";
import { useAnonymousUploadTransition } from "../contexts/useAnonymousUploadTransition";
import HeroUpload from "../components/HeroUpload";

export default function Home() {
  // Redirect authenticated users to their dashboard if needed
  useAuthRedirect({ whenAuthenticated: "/home" });

  // Handle migration of anonymous uploads when a user logs in
  useAnonymousUploadTransition();

  return (
    <div className="bg-gradient-to-b from-white to-beige-50 min-h-screen">
      {/* Hero Section - Focused on File Upload */}
      <section className="relative isolate overflow-hidden py-10 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-800 mb-3">
              One link for humans & AI agents
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mt-4">
              Share AI outputs instantly. No sign-up needed.
            </p>
          </div>

          {/* File Upload Hero Component */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-6 relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <HeroUpload />
          </div>

          {/* Benefits Tag Line */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-6">
            <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs md:text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" /> Free
            </span>
            <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs md:text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" /> 30-day
              auto-expiry
            </span>
            <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs md:text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" /> Up to 10 MB
            </span>
            <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs md:text-sm text-gray-700">
              <FaCheck className="text-green-500 mr-1.5 text-xs" />{" "}
              Password-optional
            </span>
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

      {/* 3-Step Explainer Section */}
      <section className="py-10 md:py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 md:mb-10 text-center text-gray-800">
            How It Works: 3 Simple Steps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <FaUpload className="text-lg md:text-xl" />
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-base md:text-lg">
                Upload
              </h3>
              <p className="text-gray-600 text-center text-sm md:text-base">
                Drag & drop. Get a link. Done.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <FaCopy className="text-lg md:text-xl" />
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-base md:text-lg">
                Get Link
              </h3>
              <p className="text-gray-600 text-center text-sm md:text-base">
                Instantly receive a shareable link that works anywhere.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
              <div className="bg-orange-100 text-orange-600 rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <span className="text-lg md:text-xl">🔗</span>
              </div>
              <h3 className="font-medium mb-2 md:mb-3 text-center text-gray-800 text-base md:text-lg">
                Share
              </h3>
              <p className="text-gray-600 text-center text-sm md:text-base">
                Share with anyone - no login required to view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Flow Diagram Section */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
            Connect AI with Humans Seamlessly
          </h2>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 py-6">
            {/* ChatGPT/Agent Node */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm w-full md:w-64 text-center">
              <div className="bg-green-100 text-green-600 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600">
                Creates content for sharing
              </p>
            </div>

            {/* Arrow from AI to MCPH */}
            <div className="hidden md:block text-gray-400 transform rotate-0">
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
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>

            {/* Mobile down arrow */}
            <div className="block md:hidden text-gray-400 my-2">
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
                <path d="M12 5v14"></path>
                <path d="M19 12l-7 7-7-7"></path>
              </svg>
            </div>

            {/* MCPH Node */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm w-full md:w-64 text-center relative z-10">
              <div className="bg-orange-100 text-orange-600 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
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
              </div>
              <h3 className="font-medium text-gray-800 mb-2">MCPH</h3>
              <p className="text-sm text-gray-600">Generates shareable link</p>
            </div>

            {/* Arrow from MCPH to Viewer */}
            <div className="hidden md:block text-gray-400">
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
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>

            {/* Mobile down arrow */}
            <div className="block md:hidden text-gray-400 my-2">
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
                <path d="M12 5v14"></path>
                <path d="M19 12l-7 7-7-7"></path>
              </svg>
            </div>

            {/* Viewer Node */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm w-full md:w-64 text-center">
              <div className="bg-blue-100 text-blue-600 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Human Viewers</h3>
              <p className="text-sm text-gray-600">
                Access content without login
              </p>
            </div>

            {/* Connecting Lines (decorative) */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 hidden md:block z-0"></div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 max-w-xl mx-auto">
              Share AI-generated content with a single link that works for both
              humans and AI agents. No authentication required for viewing.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="py-10 md:py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-center text-gray-800">
            For Developers
          </h2>
          <div className="bg-gray-900 text-white p-3 md:p-5 rounded-xl font-mono text-xs md:text-sm overflow-x-auto shadow-lg mb-4">
            <code>curl -F file=@report.md https://mcph.io/upload</code>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/docs"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
            >
              <span>View full API documentation</span>
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

      {/* Social Proof Section */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
            Trusted by AI Developers & Teams
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {/* Logos - these are placeholders, replace with actual client/partner logos */}
            <div className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <svg
                className="h-8 w-auto"
                viewBox="0 0 120 30"
                fill="currentColor"
              >
                <rect
                  x="10"
                  y="8"
                  width="100"
                  height="15"
                  rx="4"
                  fill="#4B5563"
                />
                <text
                  x="60"
                  y="19"
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                >
                  AI STARTUP
                </text>
              </svg>
            </div>

            <div className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <svg
                className="h-7 w-auto"
                viewBox="0 0 120 30"
                fill="currentColor"
              >
                <circle cx="20" cy="15" r="10" fill="#4B5563" />
                <rect
                  x="35"
                  y="8"
                  width="75"
                  height="15"
                  rx="2"
                  fill="#4B5563"
                />
                <text
                  x="73"
                  y="19"
                  fontSize="9"
                  fill="white"
                  textAnchor="middle"
                >
                  RESEARCH LAB
                </text>
              </svg>
            </div>

            <div className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <svg
                className="h-8 w-auto"
                viewBox="0 0 120 30"
                fill="currentColor"
              >
                <path d="M10,15 L30,5 L50,15 L30,25 Z" fill="#4B5563" />
                <rect
                  x="55"
                  y="8"
                  width="55"
                  height="15"
                  rx="3"
                  fill="#4B5563"
                />
                <text
                  x="83"
                  y="19"
                  fontSize="8"
                  fill="white"
                  textAnchor="middle"
                >
                  TECH COMPANY
                </text>
              </svg>
            </div>

            <div className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <svg
                className="h-6 w-auto"
                viewBox="0 0 120 30"
                fill="currentColor"
              >
                <rect
                  x="10"
                  y="5"
                  width="100"
                  height="20"
                  rx="10"
                  fill="#4B5563"
                />
                <text
                  x="60"
                  y="19"
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                >
                  ENTERPRISE CO
                </text>
              </svg>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="italic text-gray-600 text-center">
              "MCPH has transformed how our AI services share information with
              users. The streamlined process and instant sharing have
              significantly improved our user experience."
            </p>
            <div className="mt-4 text-center">
              <p className="font-medium text-gray-800">Alex Chen</p>
              <p className="text-sm text-gray-500">
                AI Product Manager at TechCorp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section - Simplified */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800">
            What Can You Share?
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-orange-500 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                  <path d="M9 17h6" />
                  <path d="M9 13h6" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">Markdown</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-orange-500 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">Code</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-orange-500 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">Images</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-orange-500 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">JSON</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-orange-500 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">Binary Files</p>
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                New!
              </span>
              <p className="text-xs text-gray-500 mt-1">
                PDFs, images, and more
              </p>
            </div>
          </div>
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
                  <span className="text-gray-600">30-day link expiry</span>
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
                  <span className="text-gray-600">Password protection</span>
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
                POPULAR
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Pro</h3>
                <p className="text-3xl font-bold text-gray-800 mt-4">
                  $9<span className="text-lg font-normal">/mo</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">Billed annually</p>
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
                    <strong>1-year</strong> link expiry
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
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-block w-full px-6 py-3 text-center font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors duration-300"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 border border-orange-200 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Ready to streamline your AI content sharing?
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Upload now (no login) or create an account for more features.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-orange-500 rounded-lg shadow hover:bg-orange-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              Upload (no login)
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

      {/* Footer Info */}
      <section className="py-8 px-4 border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-gray-600">Drag & drop. Get a link. Done.</p>
          </div>
          <div className="border-t border-gray-200 pt-6 mt-2">
            <div className="flex flex-wrap justify-center gap-8">
              <Link
                href="/docs"
                className="text-gray-500 hover:text-orange-600 text-sm"
              >
                Documentation
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-orange-600 text-sm"
              >
                Status
              </Link>
              <Link
                href="https://github.com/yourgithub/mcph"
                className="text-gray-500 hover:text-orange-600 text-sm"
              >
                GitHub
              </Link>
              <Link
                href="/privacy"
                className="text-gray-500 hover:text-orange-600 text-sm"
              >
                Privacy
              </Link>
            </div>
            <p className="text-gray-400 text-xs text-center mt-6">
              © {new Date().getFullYear()} MCPH. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
