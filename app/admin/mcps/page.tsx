'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { MCP } from 'types/mcp';

// Define User interface
interface User {
    id: string;
    email: string;
}

// Define import results interface
interface ImportResults {
    message: string;
    results: {
        success: number;
        failed: number;
        errors: string[];
    };
}

export default function AdminMCPs() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mcps, setMcps] = useState<MCP[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedMcp, setSelectedMcp] = useState<MCP | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importResults, setImportResults] = useState<ImportResults | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [jsonPreview, setJsonPreview] = useState<string>('');
    const [editingViews, setEditingViews] = useState<{ [key: string]: string }>({}); // State to hold view inputs
    const router = useRouter();

    useEffect(() => {
        async function checkAdminAccess() {
            try {
                // Check if user is authenticated
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/');
                    return;
                }

                // Check if user has admin role
                const { data: user } = await supabase.auth.getUser();

                if (!user.user?.id) {
                    router.push('/');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.user.id)
                    .single();

                if (!profile?.is_admin) {
                    router.push('/');
                    return;
                }

                setIsAdmin(true);

                // Load MCPs and users
                await Promise.all([loadMCPs(), loadUsers()]);
            } catch (error) {
                console.error('Error checking admin access:', error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminAccess();
    }, [router]);

    async function loadMCPs() {
        try {
            // Get all MCPs
            const { data: mcpData, error: mcpError } = await supabase
                .from('mcps')
                .select('*')
                .order('created_at', { ascending: false });

            if (mcpError) throw mcpError;

            // Get all MCPs with owner information by fetching profiles separately
            const mcpsWithOwners = await Promise.all((mcpData || []).map(async (mcp) => {
                if (mcp.user_id) {
                    const { data: userData, error: userError } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', mcp.user_id)
                        .single();

                    if (!userError && userData) {
                        return {
                            ...mcp,
                            profiles: userData
                        };
                    }
                }
                return mcp;
            }));

            setMcps(mcpsWithOwners as unknown as MCP[] || []);
        } catch (error) {
            console.error('Error loading MCPs:', error);
        }
    }

    async function loadUsers() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email')
                .order('email');

            if (error) throw error;
            setUsers(data as unknown as User[] || []);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    function openOwnershipModal(mcp: MCP) {
        setSelectedMcp(mcp);
        setSelectedUserId(mcp.user_id || '');
        setIsModalOpen(true);
    }

    async function handleOverrideOwnership() {
        if (!selectedMcp || !selectedUserId) {
            alert('Please select a user to assign ownership.');
            return;
        }

        try {
            const response = await fetch(`/api/mcps/admin/override-claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mcpId: selectedMcp.id,
                    userId: selectedUserId
                }),
            });

            if (response.ok) {
                alert(`Ownership successfully transferred.`);
                setIsModalOpen(false);
                await loadMCPs(); // Refresh the MCPs list
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error overriding ownership:', error);
            alert('Failed to override ownership. See console for details.');
        }
    }

    async function handleRefreshReadme(mcpId: string) {
        try {
            const response = await fetch(`/api/mcps/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mcpId }),
            });

            if (response.ok) {
                alert('README refreshed successfully!');
                await loadMCPs(); // Refresh the MCPs list
            } else {
                const errorData = await response.json();
                alert(`Error refreshing README: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error refreshing README:', error);
            alert('Failed to refresh README. See console for details.');
        }
    }

    async function handleUpdateViews(mcpId: string) {
        const newViews = editingViews[mcpId];
        const viewCount = parseInt(newViews, 10);

        if (isNaN(viewCount) || viewCount < 0) {
            alert('Please enter a valid non-negative number for views.');
            return;
        }

        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Your session has expired. Please log in again.');
                router.push('/'); // Redirect to login or home
                return;
            }

            const response = await fetch(`/api/mcps/admin/update-views`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` // Add the Authorization header
                },
                body: JSON.stringify({ mcpId, views: viewCount }),
            });

            if (response.ok) {
                alert('Views updated successfully!');
                // Clear the editing state for this MCP after successful update
                setEditingViews(prev => {
                    const newState = { ...prev };
                    delete newState[mcpId]; // Remove the key to revert to displaying the actual value
                    return newState;
                });
                await loadMCPs(); // Refresh the MCPs list
            } else {
                const errorData = await response.json();
                alert(`Error updating views: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating views:', error);
            alert('Failed to update views. See console for details.');
        }
    }

    // Handle input change for view counts
    const handleViewInputChange = (mcpId: string, value: string) => {
        setEditingViews(prev => ({ ...prev, [mcpId]: value }));
    };

    // Open file selector
    const handleImportClick = () => {
        setImportResults(null);
        setIsImportModalOpen(true);
    };

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                // Validate JSON
                JSON.parse(content);
                setJsonPreview(content);
            } catch (error) {
                alert('Invalid JSON file. Please check the format and try again.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    // Handle batch import
    const handleBatchImport = async () => {
        if (!jsonPreview) {
            alert('Please select a valid JSON file first.');
            return;
        }

        try {
            setIsImporting(true);
            const mcpsData = JSON.parse(jsonPreview);

            // Validate that it's an array
            if (!Array.isArray(mcpsData)) {
                alert('Invalid JSON format. Expected an array of MCPs.');
                return;
            }

            // Use supabase client directly with auth session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('Your session has expired. Please log in again.');
                router.push('/');
                return;
            }

            // Send to API endpoint with auth header
            const response = await fetch('/api/mcps/admin/batch-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ mcps: mcpsData }),
                credentials: 'include',
            });

            const result = await response.json();

            if (response.ok) {
                setImportResults(result);
                if (result.results.failed === 0) {
                    // Clear the file input if all successful
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                    setJsonPreview('');
                }

                // Refresh MCPs list
                await loadMCPs();
            } else {
                alert(`Error: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error during batch import:', error);
            alert('Failed to import MCPs. See console for details.');
        } finally {
            setIsImporting(false);
        }
    };

    // Filter MCPs based on search term
    const filteredMCPs = mcps.filter(mcp =>
        mcp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mcp.repository_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mcp.profiles?.email && mcp.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading admin dashboard...</div>;
    }

    if (!isAdmin) {
        return null; // Router will redirect, this prevents flash of forbidden content
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">MCP Management</h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleImportClick}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm"
                    >
                        Batch Import MCPs
                    </button>
                    <button
                        onClick={() => router.push('/admin')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search MCPs by name, repository URL or owner email..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Repository</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Current Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Views</th> {/* Added Views column header */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Last Refreshed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMCPs.map((mcp) => {
                            // Ensure mcp.id exists before rendering the row/using it
                            if (!mcp.id) return null;
                            const currentViews = mcp.view_count ?? 0; // Use view_count, default to 0 if null/undefined
                            const editingValue = editingViews[mcp.id];
                            const isEditing = editingValue !== undefined;
                            const displayValue = isEditing ? editingValue : String(currentViews);

                            return (
                                <tr key={mcp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{mcp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a href={mcp.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                            {mcp.repository_url}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                        {mcp.profiles?.email || <span className="text-gray-500 dark:text-gray-400 italic">Unclaimed</span>}
                                    </td>
                                    {/* Views Column */}
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={displayValue}
                                                onChange={(e) => handleViewInputChange(mcp.id!, e.target.value)} // Use mcp.id! as we checked it's not null
                                                className="w-20 p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                                                placeholder={String(currentViews)} // Show current views as placeholder
                                            />
                                            <button
                                                onClick={() => handleUpdateViews(mcp.id!)} // Use mcp.id! as we checked it's not null
                                                disabled={!isEditing || editingValue === '' || parseInt(editingValue, 10) === currentViews}
                                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                        {mcp.last_refreshed ? new Date(mcp.last_refreshed).toLocaleString() : <span className="italic text-gray-500 dark:text-gray-400">Never</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => mcp.id && handleRefreshReadme(mcp.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm mr-2 text-sm"
                                        >
                                            Refresh README
                                        </button>
                                        <button
                                            onClick={() => openOwnershipModal(mcp)}
                                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                                        >
                                            Manage Ownership
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Ownership Override Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Override MCP Ownership</h2>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">
                            <strong>MCP Name:</strong> {selectedMcp?.name}<br />
                            <strong>Repository:</strong> {selectedMcp?.repository_url}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Select User:
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                <option value="">-- Unclaimed --</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOverrideOwnership}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Import MCPs from JSON</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Select JSON file:
                            </label>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Upload a JSON file containing an array of MCPs to import
                            </p>
                        </div>

                        {importResults && (
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Import Results:</h3>
                                <div className={`p-4 rounded-md ${importResults.results.failed === 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                                    <p className="font-medium">{importResults.message}</p>
                                    {importResults.results.failed > 0 && (
                                        <div className="mt-2">
                                            <p className="font-medium">Errors:</p>
                                            <ul className="list-disc list-inside">
                                                {importResults.results.errors.map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleBatchImport}
                                disabled={!jsonPreview || isImporting}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm disabled:opacity-50"
                            >
                                {isImporting ? 'Importing...' : 'Import MCPs'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}