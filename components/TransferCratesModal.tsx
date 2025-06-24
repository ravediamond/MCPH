"use client";

import React, { useState } from "react";
import { FaExclamationTriangle, FaCheck, FaTimes } from "react-icons/fa";

interface TransferCratesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  crateCount: number;
  isLoading: boolean;
}

const TransferCratesModal: React.FC<TransferCratesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  crateCount,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-center mb-4 text-amber-500">
          <FaExclamationTriangle size={32} />
        </div>

        <h3 className="text-xl font-bold text-center mb-2">
          Transfer Anonymous Uploads
        </h3>

        <p className="text-gray-600 mb-4 text-center">
          We found {crateCount} anonymous uploads from your device. Would you
          like to transfer them to your account?
        </p>

        <p className="text-sm text-gray-500 mb-6 text-center">
          This will make these uploads permanently accessible from your account
          and allow you to manage them.
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            <FaTimes className="mr-2" /> Ignore
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md flex items-center hover:bg-emerald-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Transferring...
              </>
            ) : (
              <>
                <FaCheck className="mr-2" /> Transfer to My Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferCratesModal;
