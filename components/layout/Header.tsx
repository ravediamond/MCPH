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
  FaCommentDots,
  FaMicrosoft,
  FaGithub,
} from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge } from "@/components/rbac";
import { Permission } from "@/lib/types/rbac";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user,
    isAdmin,
    role,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithGithub,
    signOut: firebaseSignOut,
    hasPermission,
  } = useAuth();
  const pathname = usePathname();

  const getHomeLink = () => (user ? "/crates" : "/");

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

  const handleMicrosoftSignIn = async () => {
    try {
      console.log("Header: Attempting Microsoft Sign-In...");
      await signInWithMicrosoft();
      console.log("Header: Microsoft Sign-In successful trigger");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Header: Error signing in with Microsoft: ", error);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      console.log("Header: Attempting GitHub Sign-In...");
      await signInWithGithub();
      console.log("Header: GitHub Sign-In successful trigger");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Header: Error signing in with GitHub: ", error);
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
            {/* Only show Home and Upload when authenticated */}
            {user && (
              <>
                <Link
                  href={getHomeLink()}
                  className={`text-gray-700 hover:text-gray-900 font-medium flex items-center ${isHomePage ? "text-gray-900 border-b-2 border-primary-500" : ""}`}
                >
                  <FaHome className="mr-1 h-4 w-4" /> Crates
                </Link>
              </>
            )}
            {/* Always show Documentation and FAQ */}
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
            {/* Auth Buttons Desktop */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Link
                    href={
                      hasPermission(Permission.ADMIN_SYSTEM_READ)
                        ? "/admin/dashboard"
                        : "/crates"
                    }
                    className="flex items-center text-gray-700 hover:text-gray-900"
                  >
                    <FaUserCircle className="mr-2 h-5 w-5" />
                    <span>
                      {user.displayName
                        ? user.displayName.split(" ")[0]
                        : "Account"}
                    </span>
                  </Link>
                  <RoleBadge role={role} className="ml-2" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGoogleSignIn}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <FaGoogle className="mr-2 h-4 w-4" />
                  Google
                </button>
                <button
                  onClick={handleMicrosoftSignIn}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 flex items-center"
                >
                  <FaMicrosoft className="mr-2 h-4 w-4" />
                  Microsoft
                </button>
                <button
                  onClick={handleGithubSignIn}
                  className="px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 flex items-center"
                >
                  <FaGithub className="mr-2 h-4 w-4" />
                  GitHub
                </button>
              </div>
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
              {/* Only show Home and Upload when authenticated */}
              {user && (
                <>
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
                    href="/feedback/manage"
                    className={`text-gray-700 hover:text-gray-900 px-4 py-2 flex items-center ${pathname.startsWith("/feedback") ? "bg-gray-100 text-gray-900" : ""}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaCommentDots className="mr-2 h-4 w-4" /> Feedback
                  </Link>
                </>
              )}
              {/* Always show Documentation and FAQ */}
              <Link
                href="/docs"
                className={`text-gray-700 hover:text-gray-900 px-4 py-2 ${isActive("/docs") ? "bg-gray-100 text-gray-900" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                API Docs
              </Link>
              <Link
                href="/faq"
                className={`text-gray-700 hover:text-gray-900 px-4 py-2 ${isActive("/faq") ? "bg-gray-100 text-gray-900" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              {/* Auth Buttons Mobile Menu */}
              <div className="px-4 py-2">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between py-1">
                      <Link
                        href={
                          hasPermission(Permission.ADMIN_SYSTEM_READ)
                            ? "/admin/dashboard"
                            : "/crates"
                        }
                        className="flex items-center text-gray-700 hover:text-gray-900"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FaUserCircle className="mr-2 h-5 w-5" />
                        <span>
                          {user.displayName
                            ? user.displayName.split(" ")[0]
                            : "Account"}
                        </span>
                      </Link>
                      <RoleBadge role={role} />
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                      <FaGoogle className="mr-2 h-4 w-4" />
                      Login with Google
                    </button>
                    <button
                      onClick={handleMicrosoftSignIn}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 flex items-center justify-center"
                    >
                      <FaMicrosoft className="mr-2 h-4 w-4" />
                      Login with Microsoft
                    </button>
                    <button
                      onClick={handleGithubSignIn}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 flex items-center justify-center"
                    >
                      <FaGithub className="mr-2 h-4 w-4" />
                      Login with GitHub
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
