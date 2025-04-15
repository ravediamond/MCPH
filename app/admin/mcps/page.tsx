'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { MCP } from 'types/mcp';

// Define User interface
interface User {
    id: string;
    email: string;
}

export default function AdminMCPs() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mcps, setMcps] = useState<MCP[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedMcp, setSelectedMcp] = useState<MCP | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.user?.id)
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
            setMcps(data || []);
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
            setUsers(data || []);
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
                <button
                    onClick={() => router.push('/admin')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                >
                    Back to Dashboard
                </button>
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
        </div>
    );
}