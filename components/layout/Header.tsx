"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaUpload,
  FaHome,
} from "react-icons/fa";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user,
    isAdmin,
    signInWithGoogle,
    signOut: firebaseSignOut,
  } = useAuth();
  const pathname = usePathname();

  const getHomeLink = () => (user ? "/home" : "/");

  const handleGoogleSignIn = async () => {
    try {
      console.log("Header: Attempting Google Sign-In...");
      await signInWithGoogle(); // Use signInWithGoogle from context
      console.log("Header: Google Sign-In successful trigger");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Header: Error signing in with Google: ", error);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("Header: Attempting Sign-Out...");
      await firebaseSignOut(); // Use signOut from context
      console.log("Header: Sign-Out successful trigger.");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Header: Error signing out: ", error);
    }
  };

  const isActive = (path: string) => pathname === path;
  // Also check if we're on the home page (either / or /home)
  const isHomePage = pathname === "/" || pathname === "/home";

  return (
    <header className="bg-stone-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - always go to root path */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 px-2 py-1">
              <Image src="/icon.png" alt="Logo" width={180} height={180} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Home link is dynamic based on login state */}
            <Link
              href={getHomeLink()}
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
            {/* Auth Buttons Desktop */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={isAdmin ? "/admin/dashboard" : "/home"}
                  className="flex items-center text-gray-700 hover:text-gray-900"
                >
                  <FaUserCircle className="mr-2 h-5 w-5" />
                  <span>
                    {isAdmin
                      ? "Admin"
                      : user.displayName
                        ? user.displayName.split(" ")[0]
                        : "Account"}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Login with Google
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            {/* Auth Buttons Mobile (before menu icon for better UX when logged in) */}
            {!isMenuOpen && user && (
              <button
                onClick={handleSignOut}
                className="mr-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-900"
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
              {/* Home link is dynamic based on login state */}
              <Link
                href={getHomeLink()}
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
                API Docs
              </Link>
              {/* Auth Buttons Mobile Menu */}
              <div className="px-4 py-2">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={isAdmin ? "/admin/dashboard" : "/home"}
                      className="flex items-center text-gray-700 hover:text-gray-900 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUserCircle className="mr-2 h-5 w-5" />
                      <span>
                        {isAdmin
                          ? "Admin"
                          : user.displayName
                            ? user.displayName.split(" ")[0]
                            : "Account"}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Login with Google
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
