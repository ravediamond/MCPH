"use client";

import React from "react";
import { FaEye, FaTimes } from "react-icons/fa";
import Card from "../ui/Card";
import { CrateCategory } from "../../shared/types/crate";

interface CrateContentPreviewProps {
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  crateInfo: any;
  contentLoading: boolean;
  crateId: string;
  formatCategoryForDisplay: (category: CrateCategory) => string;
  renderPreview: () => React.ReactNode;
}

export default function CrateContentPreview({
  showPreview,
  setShowPreview,
  crateInfo,
  contentLoading,
  crateId,
  formatCategoryForDisplay,
  renderPreview,
}: CrateContentPreviewProps) {
  if (!showPreview) return null;

  return (
    <Card className="mb-6 shadow-lg border border-gray-200">
      <Card.Header className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
        <div className="flex items-center">
          <FaEye className="mr-2 text-blue-600" size={18} />
          <h2 className="text-lg font-semibold text-gray-800">
            Content Preview • {formatCategoryForDisplay(crateInfo.category)}
          </h2>
        </div>
        <button
          onClick={() => setShowPreview(false)}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          title="Close preview"
        >
          <FaTimes size={16} />
        </button>
      </Card.Header>

      <Card.Body className="p-6">
        {contentLoading ? (
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-600">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading content...
            </div>
          </div>
        ) : crateInfo.category === CrateCategory.IMAGE ? (
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
            <img
              src={`/api/crates/${crateId}/content`}
              alt={crateInfo.title}
              className="max-w-full max-h-96 object-contain rounded shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/icon.png";
                target.style.height = "80px";
                target.style.width = "80px";
              }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {renderPreview()}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
