import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-beige-100 border-t border-gray-200 py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              MCPH — Secure, simple file sharing with auto-expiration.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/docs"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              API Docs
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/feedback"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Feedback
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} MCPH
          </p>
        </div>
      </div>
    </footer>
  );
}
