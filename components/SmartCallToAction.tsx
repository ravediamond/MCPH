"use client";

import React from "react";
import Link from "next/link";
import { FaUpload, FaCopy, FaEye, FaHeart, FaStar } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  if (!isPublic) return null;

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <FaHeart className="text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Inspired by this crate?
              </h3>
            </div>

            <p className="text-gray-600 mb-4 leading-relaxed">
              This crate has been viewed{" "}
              <span className="font-semibold text-orange-600">
                {viewCount.toLocaleString()} times
              </span>
              . Join the community and create your own amazing content!
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {/* Duplicate & Edit Button */}
              {user && (
                <button
                  onClick={onDuplicate}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm"
                >
                  <FaCopy className="text-sm" />
                  <span>Duplicate & edit</span>
                </button>
              )}

              {/* Make Your Own Crate Button */}
              <Link
                href={user ? "/upload" : "/login?next=/upload"}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                <FaUpload className="text-sm" />
                <span>Create your own crate</span>
              </Link>
            </div>
          </div>

          {/* View stats badge */}
          <div className="ml-6 text-center">
            <div className="bg-white rounded-lg p-3 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-center space-x-2 text-orange-600 mb-1">
                <FaEye className="text-sm" />
                <span className="text-sm font-medium">Views</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                {viewCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
