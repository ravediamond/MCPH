import React, { useState } from "react";
import { FaDatabase, FaPhone, FaShare } from "react-icons/fa";

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

interface UsagePillsProps {
  userQuota: QuotaInfo | null;
  userStorage: StorageInfo | null;
  userSharedCrates: SharedCratesInfo | null;
  userFeedbackTemplates: FeedbackTemplatesInfo | null;
  quotaLoading: boolean;
  formatFileSize: (bytes: number) => string;
}

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userQuota: QuotaInfo | null;
  userStorage: StorageInfo | null;
  userSharedCrates: SharedCratesInfo | null;
  userFeedbackTemplates: FeedbackTemplatesInfo | null;
  formatFileSize: (bytes: number) => string;
}

const UsageModal: React.FC<UsageModalProps> = ({
  isOpen,
  onClose,
  userQuota,
  userStorage,
  userSharedCrates,
  userFeedbackTemplates,
  formatFileSize,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Usage Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* API Calls */}
          {userQuota && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>API Calls</span>
                <span>{userQuota.remaining}/1000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${((1000 - userQuota.remaining) / 1000) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Storage */}
          {userStorage && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage</span>
                <span>
                  {formatFileSize(userStorage.used)}/
                  {formatFileSize(userStorage.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(userStorage.used / userStorage.limit) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((userStorage.used / userStorage.limit) * 100).toFixed(1)}%
                used
              </div>
            </div>
          )}

          {/* Shared Crates */}
          {userSharedCrates && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Shared Crates</span>
                <span>
                  {userSharedCrates.count}/{userSharedCrates.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${(userSharedCrates.count / userSharedCrates.limit) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(
                  (userSharedCrates.count / userSharedCrates.limit) *
                  100
                ).toFixed(1)}
                % used
              </div>
            </div>
          )}

          {/* Feedback Templates */}
          {userFeedbackTemplates && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Feedback Templates</span>
                <span>
                  {userFeedbackTemplates.count}/{userFeedbackTemplates.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{
                    width: `${(userFeedbackTemplates.count / userFeedbackTemplates.limit) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(
                  (userFeedbackTemplates.count / userFeedbackTemplates.limit) *
                  100
                ).toFixed(1)}
                % used
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const UsagePills: React.FC<UsagePillsProps> = ({
  userQuota,
  userStorage,
  userSharedCrates,
  userFeedbackTemplates,
  quotaLoading,
  formatFileSize,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (quotaLoading) {
    return (
      <div className="flex space-x-2 mb-4">
        <div className="bg-gray-200 rounded-full px-3 py-1 text-sm animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  const getStoragePercentage = () => {
    if (!userStorage) return 0;
    return (userStorage.used / userStorage.limit) * 100;
  };

  const getSharedPercentage = () => {
    if (!userSharedCrates) return 0;
    return (userSharedCrates.count / userSharedCrates.limit) * 100;
  };

  const getAPIPercentage = () => {
    if (!userQuota) return 0;
    return ((1000 - userQuota.remaining) / 1000) * 100;
  };

  const isHighUsage = (percentage: number) => percentage > 80;

  return (
    <>
      <div className="flex space-x-2 mb-4">
        {/* Storage Pill */}
        {userStorage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isHighUsage(getStoragePercentage())
                ? "bg-red-100 text-red-800 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaDatabase className="inline mr-1" />
            Storage {getStoragePercentage().toFixed(1)}%
          </button>
        )}

        {/* API Calls Pill */}
        {userQuota && (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isHighUsage(getAPIPercentage())
                ? "bg-red-100 text-red-800 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaPhone className="inline mr-1" />
            API Calls {userQuota.remaining}/1000
          </button>
        )}

        {/* Shared Crates Pill */}
        {userSharedCrates && (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isHighUsage(getSharedPercentage())
                ? "bg-red-100 text-red-800 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaShare className="inline mr-1" />
            Shared {userSharedCrates.count}/{userSharedCrates.limit}
          </button>
        )}
      </div>

      <UsageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userQuota={userQuota}
        userStorage={userStorage}
        userSharedCrates={userSharedCrates}
        userFeedbackTemplates={userFeedbackTemplates}
        formatFileSize={formatFileSize}
      />
    </>
  );
};

export default UsagePills;
