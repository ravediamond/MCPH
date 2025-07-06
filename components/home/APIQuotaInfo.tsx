import React from "react";
import { FaKey } from "react-icons/fa";
import Link from "next/link";

interface QuotaInfo {
  remaining: number;
}

interface StorageInfo {
  used: number;
  limit: number;
  remaining: number;
}

interface SharedCratesInfo {
  count: number;
  limit: number;
  remaining: number;
}

interface FeedbackTemplatesInfo {
  count: number;
  limit: number;
  remaining: number;
}

interface APIQuotaInfoProps {
  userQuota: QuotaInfo | null;
  userStorage: StorageInfo | null;
  userSharedCrates: SharedCratesInfo | null;
  userFeedbackTemplates: FeedbackTemplatesInfo | null;
  quotaLoading: boolean;
  formatFileSize: (bytes: number) => string;
}

const APIQuotaInfo: React.FC<APIQuotaInfoProps> = ({
  userQuota,
  userStorage,
  userSharedCrates,
  userFeedbackTemplates,
  quotaLoading,
  formatFileSize,
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
          Remaining MCP calls this month:{" "}
          <span
            className={
              userQuota.remaining === 0
                ? "text-red-600 font-semibold"
                : "font-semibold"
            }
          >
            {userQuota.remaining}
          </span>
          <span className="ml-2 text-gray-400">/ 1000</span>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No quota information found.</div>
      )}

      {userStorage && (
        <div className="text-sm text-gray-700 mt-1">
          Storage used:{" "}
          <span className="font-semibold">
            {formatFileSize(userStorage.used)}
          </span>{" "}
          /{" "}
          <span className="font-semibold">
            {formatFileSize(userStorage.limit)}
          </span>
          <span className="ml-2">
            ({((userStorage.used / userStorage.limit) * 100).toFixed(1)}% used,{" "}
            {formatFileSize(userStorage.remaining)} left)
          </span>
        </div>
      )}

      {userSharedCrates && (
        <div className="text-sm text-gray-700 mt-1">
          Shared crates:{" "}
          <span
            className={
              userSharedCrates.remaining === 0
                ? "text-red-600 font-semibold"
                : "font-semibold"
            }
          >
            {userSharedCrates.count}
          </span>{" "}
          / <span className="font-semibold">{userSharedCrates.limit}</span>
          <span className="ml-2">
            (
            {((userSharedCrates.count / userSharedCrates.limit) * 100).toFixed(
              1,
            )}
            % used, {userSharedCrates.remaining} left)
          </span>
        </div>
      )}

      {userFeedbackTemplates && (
        <div className="text-sm text-gray-700 mt-1">
          Feedback templates:{" "}
          <span
            className={
              userFeedbackTemplates.remaining === 0
                ? "text-red-600 font-semibold"
                : "font-semibold"
            }
          >
            {userFeedbackTemplates.count}
          </span>{" "}
          / <span className="font-semibold">{userFeedbackTemplates.limit}</span>
          <span className="ml-2">
            (
            {(
              (userFeedbackTemplates.count / userFeedbackTemplates.limit) *
              100
            ).toFixed(1)}
            % used, {userFeedbackTemplates.remaining} left)
          </span>
        </div>
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
