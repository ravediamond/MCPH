"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaUpload, FaHome } from "react-icons/fa";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  // Also check if we're on the home page (either / or /crates)
  const isHomePage = pathname === "/" || pathname === "/crates";

  return (
    <header className="bg-stone-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - always go to root path */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 px-2 py-1">
              <div className="flex items-center">
                <Image src="/icon.png" alt="Logo" width={180} height={180} />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`text-gray-700 hover:text-gray-900 font-medium flex items-center ${isHomePage ? "text-gray-900 border-b-2 border-primary-500" : ""}`}
            >
              <FaHome className="mr-1 h-4 w-4" /> Home
            </Link>
            <Link
              href="/upload"
              className={`text-gray-700 hover:text-gray-900 font-medium flex items-center ${isActive("/upload") ? "text-gray-900 border-b-2 border-primary-500" : ""}`}
            >
              <FaUpload className="mr-1 h-4 w-4" /> Upload
            </Link>
            <Link
              href="/docs"
              className={`text-gray-700 hover:text-gray-900 font-medium ${isActive("/docs") ? "text-gray-900 border-b-2 border-primary-500" : ""}`}
            >
              Documentation
            </Link>
            <Link
              href="/faq"
              className={`text-gray-700 hover:text-gray-900 font-medium ${isActive("/faq") ? "text-gray-900 border-b-2 border-primary-500" : ""}`}
            >
              FAQ
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-900 p-2 rounded-md"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <FaTimes className="h-5 w-5" />
              ) : (
                <FaBars className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-200 bg-stone-50 animate-fadeIn">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className={`text-gray-700 hover:text-gray-900 px-4 py-2 flex items-center ${isHomePage ? "bg-gray-100 text-gray-900" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaHome className="mr-2 h-4 w-4" /> Home
              </Link>
              <Link
                href="/upload"
                className={`text-gray-700 hover:text-gray-900 px-4 py-2 flex items-center ${isActive("/upload") ? "bg-gray-100 text-gray-900" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUpload className="mr-2 h-4 w-4" /> Upload
              </Link>
              <Link
                href="/docs"
                className={`text-gray-700 hover:text-gray-900 px-4 py-2 ${isActive("/docs") ? "bg-gray-100 text-gray-900" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Documentation
              </Link>
              <Link
                href="/faq"
                className={`text-gray-700 hover:text-gray-900 px-4 py-2 ${isActive("/faq") ? "bg-gray-100 text-gray-900" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
