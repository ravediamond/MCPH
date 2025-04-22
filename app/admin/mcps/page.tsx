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
            const { data, error } = await supabase
                .from('mcps')
                .select('*, profiles:user_id(email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMcps(data as unknown as MCP[] || []);
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

    // Open file selector
    const handleImportClick = () => {
        setImportResults(null);
        setJsonPreview('');
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

            // Send to API endpoint
            const response = await fetch('/api/mcps/admin/batch-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mcps: mcpsData }),
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Last Refreshed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMCPs.map((mcp) => (
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
                        ))}
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
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-3xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Batch Import MCPs</h2>

                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                Upload a JSON file containing an array of MCPs to import. Each MCP should have the following structure:
                            </p>
                            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md text-xs overflow-auto max-h-48">
                                {`[
  {
    "name": "MCP Name", // required
    "description": "MCP Description",
    "repository_url": "https://github.com/username/repo", // required
    "owner_username": "username", // optional, will be parsed from repository_url if not provided
    "repository_name": "repo", // optional, will be parsed from repository_url if not provided
    "version": "1.0.0", // required
    "author": "Author Name", // required
    "tags": ["domain:category", "deployment:type", "provider:Community", "custom-tag"],
    "claimed": false, // optional
    "is_mcph_owned": false, // optional
    "deployment_url": "https://deployment-url.com" // optional
  },
  // More MCPs...
]`}
                            </pre>
                        </div>

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
                        </div>

                        {jsonPreview && (
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Preview:</h3>
                                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md text-xs overflow-auto max-h-48">
                                    <pre>{jsonPreview}</pre>
                                </div>
                            </div>
                        )}

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