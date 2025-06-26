"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated (after auth state is loaded)
    if (!loading && !user) {
      router.push(`/login?next=/upload`);
    }
  }, [user, loading, router]);

  // Show loading state or redirect if not authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Don't render the upload page for unauthenticated users
  if (!user) return null;

  return (
    <div className="bg-beige-200 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center text-gray-600 hover:text-primary-500 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Advanced Upload
          </h1>
          <p className="text-gray-600">
            Multi-file batch uploads with metadata, tagging, and custom
            expiration.
          </p>
        </div>

        {/* Upload container with subtle design */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-200">
          <div className="flex flex-col gap-8">
            <div className="flex-1">
              <FileUpload
                onUploadSuccess={(data) => {
                  console.log("Crate uploaded successfully:", data.id);
                }}
                onUploadError={(error) => {
                  console.error("Upload error:", error);
                }}
              />

              {/* Features description */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Upload Features
                </h2>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-orange-500 font-bold mr-2">•</span>
                      <span>Single file upload up to 10MB per file</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 font-bold mr-2">•</span>
                      <span>Add title and description to your files</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 font-bold mr-2">•</span>
                      <span>Auto-delete after 30 days (guest users)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 font-bold mr-2">•</span>
                      <span>Stored until you delete them (logged-in users)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 font-bold mr-2">•</span>
                      <span>
                        Manage your uploaded files from your dashboard
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Crate type information */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  About Crate Types
                </h2>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                  <li>
                    <b>Markdown:</b> .md crates, rendered as formatted text with
                    headings, lists, and code blocks.
                  </li>
                  <li>
                    <b>Code:</b> Code files with syntax highlighting for
                    multiple languages.
                  </li>
                  <li>
                    <b>JSON:</b> .json crates, shown as formatted code or parsed
                    data.
                  </li>
                  <li>
                    <b>Image:</b> Common image formats (PNG, JPG, GIF, SVG),
                    displayed as images.
                  </li>
                  <li>
                    <b>Binary Files:</b> Any binary crate that cannot be
                    streamed as text (e.g., ZIP, PDF, DOCX, EXE). These are not
                    previewed and must be downloaded to view.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Extra information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need a quick single-file upload?{" "}
            <Link href="/" className="text-primary-500 hover:text-primary-600">
              Use the home page dropzone
            </Link>{" "}
            for simplified uploads without additional options.
          </p>
        </div>
      </div>
    </div>
  );
}
