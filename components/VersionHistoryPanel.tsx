import { useState, useEffect } from 'react';
import { supabase } from 'lib/supabaseClient';
import { MCPVersion } from 'types/mcp';
import { FaHistory, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryPanelProps {
    mcpId: string;
    currentVersion: string;
    isOwner: boolean;
    isAdmin: boolean;
}

export default function VersionHistoryPanel({
    mcpId,
    currentVersion,
    isOwner,
    isAdmin
}: VersionHistoryPanelProps) {
    const [versionHistory, setVersionHistory] = useState<MCPVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [newVersion, setNewVersion] = useState('');
    const [changeSummary, setChangeSummary] = useState('');
    const [changeDetails, setChangeDetails] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const canUpdate = isOwner || isAdmin;

    useEffect(() => {
        fetchVersionHistory();
    }, [mcpId]);

    async function fetchVersionHistory() {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/mcps/version-history?mcpId=${mcpId}`);

            // Check if the response was successful before attempting to parse JSON
            if (!response.ok) {
                const errorMessage = `Failed to fetch version history: ${response.status} ${response.statusText}`;
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Parse the JSON response
            const data = await response.json();

            // Make sure versionHistory is always an array, even if empty
            setVersionHistory(data.versionHistory || []);
        } catch (err) {
            console.error('Error fetching version history:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching version history');
        } finally {
            setLoading(false);
        }
    }

    async function handleVersionUpdate() {
        if (!newVersion || !changeSummary) {
            setUpdateError('Version and summary are required');
            return;
        }

        setUpdating(true);
        setUpdateError(null);

        try {
            const response = await fetch('/api/mcps/update-version', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mcpId,
                    version: newVersion,
                    changeSummary,
                    changeDetails
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update version');
            }

            // Update version history list
            setVersionHistory(data.versionHistory || []);

            // Reset form
            setShowUpdateForm(false);
            setNewVersion('');
            setChangeSummary('');
            setChangeDetails('');

            // Force a reload to update the displayed current version
            window.location.reload();
        } catch (err) {
            console.error('Error updating version:', err);
            setUpdateError(err instanceof Error ? err.message : 'An error occurred while updating version');
        } finally {
            setUpdating(false);
        }
    }

    function suggestNextVersion() {
        if (currentVersion) {
            const [major, minor, patch] = currentVersion.split('.').map(Number);
            setNewVersion(`${major}.${minor}.${patch + 1}`);
        } else {
            setNewVersion('1.0.0');
        }
    }

    function formatDate(dateString: string | undefined) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return `${formatDistanceToNow(date, { addSuffix: true })}`;
        } catch (e) {
            return 'Invalid date';
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaHistory /> Version History
                </h3>
                {canUpdate && !showUpdateForm && (
                    <button
                        onClick={() => {
                            setShowUpdateForm(true);
                            suggestNextVersion();
                        }}
                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded"
                    >
                        <FaPlus size={12} /> Update Version
                    </button>
                )}
            </div>

            {showUpdateForm && (
                <div className="p-6 border-b border-gray-100 bg-blue-50">
                    <h4 className="font-medium mb-4">Update MCP Version</h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Version: <span className="font-bold">{currentVersion}</span>
                            </label>
                            <input
                                type="text"
                                value={newVersion}
                                onChange={(e) => setNewVersion(e.target.value)}
                                placeholder="New version (e.g., 1.0.1)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                pattern="^\d+\.\d+\.\d+$"
                                title="Please use semantic versioning format (e.g., 1.0.1)"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use semantic versioning format: major.minor.patch
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Change Summary (required)
                            </label>
                            <input
                                type="text"
                                value={changeSummary}
                                onChange={(e) => setChangeSummary(e.target.value)}
                                placeholder="Brief summary of changes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Change Details (optional)
                            </label>
                            <textarea
                                value={changeDetails}
                                onChange={(e) => setChangeDetails(e.target.value)}
                                placeholder="Detailed description of changes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            ></textarea>
                        </div>

                        {updateError && (
                            <div className="text-red-600 text-sm">{updateError}</div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowUpdateForm(false)}
                                className="inline-flex items-center gap-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                disabled={updating}
                            >
                                <FaTimes size={12} /> Cancel
                            </button>
                            <button
                                onClick={handleVersionUpdate}
                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                disabled={updating}
                            >
                                {updating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave size={12} /> Save Version
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 py-4 text-center">{error}</div>
                ) : versionHistory.length === 0 ? (
                    <div className="text-gray-500 py-4 text-center">No version history available</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {versionHistory.map((version) => (
                            <div key={version.id} className="py-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-700">v{version.version}</span>
                                            <span className="text-sm text-gray-500">{formatDate(version.created_at)}</span>
                                        </div>
                                        <div className="font-medium text-gray-700 mt-1">{version.change_summary}</div>
                                        {version.change_details && (
                                            <div className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">
                                                {version.change_details}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {version.user?.email ? `by ${version.user.email}` : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}