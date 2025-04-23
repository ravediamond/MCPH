// This component has been simplified since version functionality is no longer used
import React from 'react';
import { FaHistory } from 'react-icons/fa';

interface VersionHistoryPanelProps {
    mcpId: string;
    currentVersion?: string;
    isOwner: boolean;
    isAdmin: boolean;
}

export default function VersionHistoryPanel({
    mcpId,
    currentVersion,
    isOwner,
    isAdmin
}: VersionHistoryPanelProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaHistory /> Version History
                </h3>
            </div>

            <div className="p-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-blue-700">
                        Version history functionality has been deprecated.
                        MCPs are now maintained without explicit version tracking.
                    </p>
                </div>

                {currentVersion && (
                    <div className="mt-4 text-gray-500">
                        Legacy version: {currentVersion}
                    </div>
                )}
            </div>
        </div>
    );
}