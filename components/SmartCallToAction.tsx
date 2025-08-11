"use client";

import React from "react";
import Link from "next/link";
import { FaUpload, FaCopy, FaEye, FaHeart, FaStar } from "react-icons/fa";
// Note: Auth import removed for editKey system

interface SmartCallToActionProps {
  crateId: string;
  crateTitle: string;
  viewCount?: number;
  isOwner?: boolean;
  isPublic?: boolean;
  onDuplicate?: () => void;
}

export default function SmartCallToAction({
  crateId,
  crateTitle,
  viewCount = 0,
  isOwner = false,
  isPublic = false,
  onDuplicate,
}: SmartCallToActionProps) {
  // Note: Auth removed for editKey system
  const user = null;

  if (!isPublic) return null;

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <FaCopy className="text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">Like this?</h3>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
            Duplicate it to your workspace{" "}
            {user ? "and start customizing" : "(sign in)"}. Make it your own
            with just one click.
          </p>

          {/* Primary Duplicate Button */}
          {user ? (
            <button
              onClick={onDuplicate}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mx-auto"
            >
              <FaCopy className="text-lg" />
              <span>Duplicate this crate</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  // Note: Auth removed for editKey system
                  // await signInWithGoogle();
                  // After successful login, automatically trigger duplicate
                  setTimeout(() => onDuplicate?.(), 1000);
                } catch (error) {
                  console.error("Error signing in:", error);
                }
              }}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mx-auto"
            >
              <FaCopy className="text-lg" />
              <span>Duplicate this crate</span>
            </button>
          )}

          {/* Secondary action for creating new */}
          <div className="mt-4">
            <Link
              href="/upload"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Or start from scratch →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
