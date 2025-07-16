"use client";

import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import { useAuthRedirect } from "../contexts/useAuthRedirect";
import WaitingListModal from "../components/WaitingListModal";
import { useState } from "react";

export default function Home() {
  // Redirect authenticated users to their dashboard if needed
  useAuthRedirect({ whenAuthenticated: "/crates" });

  // State for waiting list modal
  const [waitingListModalOpen, setWaitingListModalOpen] = useState(false);

  return (
    <div className="bg-gradient-to-b from-white to-beige-50 min-h-screen">
      {/* Hero Section - Focused on File Upload */}
      <section className="relative isolate overflow-hidden py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold">
              Save and share anything from your AI chats
            </h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto mt-4">
              Upload with one click after you sign in—anyone can open the link,
              no account needed.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Sign in with Google
              </Link>
            </div>
          </div>

          {/* Integration logo bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-center gap-6 mb-6">
            <span className="text-sm text-gray-500">Works directly in:</span>
            <div className="flex items-center gap-4">
              <span className="font-medium text-lg">🤖 Claude</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium text-lg">💬 ChatGPT Pro+</span>
            </div>
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
              Secure storage
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
              Permanent storage
            </span>
          </div>

          {/* Simple 3-Benefit Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Never lose AI creations
              </h3>
              <p className="text-gray-600">
                Everything you create in AI chats, saved permanently and
                searchable
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Share with one link
              </h3>
              <p className="text-gray-600">
                Turn any AI creation into a shareable link. No login required
                for viewers!
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Works in Claude & ChatGPT
              </h3>
              <p className="text-gray-600">
                One command in your favorite AI tool saves everything instantly
              </p>
            </div>
          </div>

          {/* How It Works in 3 Steps */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl border border-green-100 mb-8">
            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-8">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl">🔑</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  1. Sign in with Google
                </h4>
                <p className="text-gray-600">
                  Quick setup with your Google account - no passwords to
                  remember
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl">🔌</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  2. Connect to AI tools
                </h4>
                <p className="text-gray-600">
                  Works with Claude, ChatGPT, and other AI assistants you
                  already use
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl">💫</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  3. Save & share anything
                </h4>
                <p className="text-gray-600">
                  One command saves your work and creates a shareable link
                  instantly
                </p>
              </div>
            </div>
          </div>

          {/* Access Model Explanation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-100 mb-8">
            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Simple Access Model
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Upload = Login Required
                </h4>
                <p className="text-gray-600">
                  You need a Google account to save and organize your AI
                  creations
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌐</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  View = No Login Needed
                </h4>
                <p className="text-gray-600">
                  Anyone with a public link can view shared content instantly
                </p>
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Perfect for sharing AI-generated content with clients, team
                members, or the public - they don't need accounts to access your
                shared links!
              </p>
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

      {/* Demo Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-orange-50 to-blue-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              See How Simple It Is
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three steps to save and share anything from your AI chats
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Type in Claude
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono text-gray-600">
                "save this as my-recipe"
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                MCPH generates
              </h3>
              <div className="bg-blue-50 p-3 rounded-lg text-sm font-mono text-blue-600">
                mcph.io/crate/abc123
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Share anywhere
              </h3>
              <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
                It just works! ✨
              </div>
            </div>
          </div>

          {/* Recipients Highlight */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full border border-green-200">
              <span className="text-2xl mr-3">✨</span>
              <span className="text-lg font-medium text-gray-800">
                Recipients don't need an account to view your shares
              </span>
              <span className="text-2xl ml-3">✨</span>
            </div>
          </div>
        </div>
      </section>

      {/* What People Use MCPH For */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              What people use MCPH for
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Simple, everyday uses that make your AI work actually useful
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Save AI Conversations */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📝</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Save AI Conversations
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Never lose important chats again. Save that perfect code
                solution or brilliant explanation with one click.
              </p>
            </div>

            {/* Share with One Link */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🔗</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Share with One Link
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Anyone can view, no signup needed. Send the link in email,
                Slack, or anywhere.
              </p>
            </div>

            {/* Organize Everything */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📂</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Organize Everything
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Your AI creations, sorted automatically by type. Find what you
                need instantly.
              </p>
            </div>

            {/* Switch Projects Instantly */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🔄</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Switch Projects Instantly
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                All your work, right where you left it. Jump between different
                projects without losing context.
              </p>
            </div>

            {/* Create Quick Polls */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Create Quick Polls
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Get feedback from your audience with simple, shareable forms
                that work everywhere.
              </p>
            </div>

            {/* Team Collaboration */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🤝</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  Team Collaboration
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Share with colleagues across any AI tool. Everyone stays on the
                same page.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-sm hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300"
            >
              Get Started Free →
            </Link>
            <p className="text-sm text-gray-500 mt-3">
              *Uploading requires sign-in; viewing is always free.
            </p>
          </div>
        </div>
      </section>

      {/* Save Anything from AI - Simplified */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
            Save anything from AI
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            No matter what you create with AI, we can save it and make it
            shareable
          </p>

          {/* File upload categories */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">📝</div>
              <p className="font-medium text-gray-800">Text</p>
              <p className="text-xs text-gray-500 mt-1">Any written content</p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">🖼️</div>
              <p className="font-medium text-gray-800">Images</p>
              <p className="text-xs text-gray-500 mt-1">
                Pictures, charts, diagrams
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">💻</div>
              <p className="font-medium text-gray-800">Code</p>
              <p className="text-xs text-gray-500 mt-1">
                Scripts and programming
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">📊</div>
              <p className="font-medium text-gray-800">Data</p>
              <p className="text-xs text-gray-500 mt-1">
                Spreadsheets, JSONs, CSVs
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-300">
              <div className="text-2xl mb-3">🧾</div>
              <p className="font-medium text-gray-800">Recipe</p>
              <p className="text-xs text-gray-500 mt-1">AI task instructions</p>
            </div>
          </div>

          {/* Special AI-only category */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-r from-orange-50 to-blue-50 p-5 rounded-xl text-center border-2 border-dashed border-orange-200">
              <div className="text-2xl mb-3">🎯</div>
              <p className="font-medium text-gray-800">Polls</p>
              <p className="text-xs text-gray-500 mt-1">
                Created via AI tools only
              </p>
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Ask Claude: "Create a poll about..."
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
                    Stored forever (until you delete)
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
                  href="/login"
                  className="inline-block w-full px-6 py-3 text-center font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors duration-300"
                >
                  Sign in with Google
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
                    <strong>50</strong> feedback templates
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
                  <span className="text-gray-700">Contact Us support</span>
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
              </ul>

              <div className="text-center">
                <button
                  onClick={() => setWaitingListModalOpen(true)}
                  className="inline-block w-full px-6 py-3 text-center font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors duration-300"
                >
                  Get Early Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Be an Early Adopter Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Be an Early Adopter
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the first wave of users to experience the future of AI content
            management
          </p>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-indigo-200 mb-8">
            <div className="flex items-center justify-center mb-6">
              <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-4 py-2 rounded-full">
                ⭐ Limited Time Offer
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              First 100 Users Get Pro Features Free for 3 Months
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-2">💎</div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  100MB File Size
                </h4>
                <p className="text-sm text-gray-600">
                  10x larger than free tier
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  10GB Storage
                </h4>
                <p className="text-sm text-gray-600">20x more space</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  Priority Features
                </h4>
                <p className="text-sm text-gray-600">
                  Advanced analytics & faster API
                </p>
              </div>
            </div>
            <button
              onClick={() => setWaitingListModalOpen(true)}
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              🎯 Get Early Access Now
            </button>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Pro features activate automatically when
              available
            </p>
          </div>
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
