"use client";

import React from "react";
import FileUpload from "@/components/FileUpload";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (data: any) => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadModalProps) {
  if (!isOpen) return null;

  const handleUploadSuccess = (data: any) => {
    console.log("Crate uploaded successfully:", data.id);
    if (onUploadSuccess) {
      onUploadSuccess(data);
    }
    // Close modal after successful upload
    onClose();
  };

  const handleUploadError = (error: any) => {
    console.error("Upload error:", error);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Upload Crate
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">
              Multi-file batch uploads with metadata, tagging, and custom
              settings.
            </p>
          </div>

          {/* Upload component */}
          <div className="mb-6">
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Features description */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="font-semibold text-gray-800 mb-3">
              Upload Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
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
                <span>Tag files for better organization and filtering</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">•</span>
                <span>Private by default, with option to make public</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">•</span>
                <span>Stored indefinitely (until you delete)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">•</span>
                <span>Secure file sharing with direct links</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
