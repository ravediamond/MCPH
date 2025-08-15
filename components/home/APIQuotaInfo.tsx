import React from "react";
import { FaKey } from "react-icons/fa";
import Link from "next/link";

interface QuotaInfo {
  remaining: number;
}

interface APIQuotaInfoProps {
  userQuota: QuotaInfo | null;
  quotaLoading: boolean;
}

const APIQuotaInfo: React.FC<APIQuotaInfoProps> = ({
  userQuota,
  quotaLoading,
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2 flex items-center">
        <FaKey className="mr-2" />
        API Usage Quota
      </h2>
      {quotaLoading ? (
        <div className="text-gray-500 text-sm">Loading quota...</div>
      ) : userQuota ? (
        <div className="text-sm text-gray-700">
          MCP calls this month:{" "}
          <span
            className={
              userQuota.remaining === 0
                ? "text-red-600 font-semibold"
                : "font-semibold"
            }
          >
            {1000 - userQuota.remaining}
          </span>
          <span className="ml-2 text-gray-400">/ 1000</span>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No quota information found.</div>
      )}

      {/* Create API Key Button */}
      <div className="mt-4">
        <Link
          href="/api-keys"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow border border-blue-700"
        >
          <FaKey className="mr-2" /> Manage API Keys
        </Link>
      </div>
    </div>
  );
};

export default APIQuotaInfo;
