import React, { useState } from "react";
import { FaPhone } from "react-icons/fa";

interface QuotaInfo {
  remaining: number;
}

interface UsagePillsProps {
  userQuota: QuotaInfo | null;
  quotaLoading: boolean;
}

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userQuota: QuotaInfo | null;
}

const UsageModal: React.FC<UsageModalProps> = ({
  isOpen,
  onClose,
  userQuota,
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
          {/* MCP Calls */}
          {userQuota && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>MCP Calls</span>
                <span>{1000 - userQuota.remaining}/1000</span>
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

const UsagePills: React.FC<UsagePillsProps> = ({ userQuota, quotaLoading }) => {
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

  const getAPIPercentage = () => {
    if (!userQuota) return 0;
    return ((1000 - userQuota.remaining) / 1000) * 100;
  };

  const isHighUsage = (percentage: number) => percentage > 80;

  return (
    <>
      <div className="flex space-x-2 mb-4">
        {/* MCP Calls Pill */}
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
            MCP Calls {1000 - userQuota.remaining}/1000
          </button>
        )}
      </div>

      <UsageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userQuota={userQuota}
      />
    </>
  );
};

export default UsagePills;
