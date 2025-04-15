'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { MCP } from 'types/mcp';

// Define interfaces for error logs and stale README items
interface ErrorLog {
    id: string;
    created_at: string;
    type: string;
    message: string;
}

// Extend MCP type for stale READMEs with required properties
interface StaleMCP extends Pick<MCP, 'id' | 'name' | 'repository_url' | 'last_refreshed'> { }

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mcpCount, setMcpCount] = useState(0);
    const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
    const [staleReadmes, setStaleReadmes] = useState<StaleMCP[]>([]);
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

                // Load admin dashboard data
                await loadDashboardData();
            } catch (error) {
                console.error('Error checking admin access:', error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminAccess();
    }, [router]);

    async function loadDashboardData() {
        try {
            // Get total MCP count
            const { count: mcpTotal } = await supabase
                .from('mcps')
                .select('*', { count: 'exact', head: true });

            setMcpCount(mcpTotal || 0);

            // Get MCPs with stale READMEs (not refreshed in the last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: stale } = await supabase
                .from('mcps')
                .select('id, name, repository_url, last_refreshed')
                .lt('last_refreshed', sevenDaysAgo.toISOString())
                .order('last_refreshed', { ascending: true });

            setStaleReadmes(stale || []);

            // Get recent error logs (assuming you have an error_logs table)
            const { data: errors } = await supabase
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            setRecentErrors(errors || []);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Handler for refreshing README
    const handleRefreshReadme = async (mcpId: string) => {
        try {
            const response = await fetch(`/api/mcps/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mcpId }),
            });

            if (response.ok) {
                // Refresh the dashboard data
                await loadDashboardData();
                alert('README refreshed successfully!');
            } else {
                const errorData = await response.json();
                alert(`Error refreshing README: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error refreshing README:', error);
            alert('Failed to refresh README. See console for details.');
        }
    };

    // Handler for overriding MCP ownership
    const handleOverrideOwnership = async (mcpId: string, userId: string) => {
        try {
            const response = await fetch(`/api/mcps/admin/override-claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mcpId, userId }),
            });

            if (response.ok) {
                alert('Ownership override successful!');
                await loadDashboardData();
            } else {
                const errorData = await response.json();
                alert(`Error overriding ownership: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error overriding ownership:', error);
            alert('Failed to override ownership. See console for details.');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading admin dashboard...</div>;
    }

    if (!isAdmin) {
        return null; // Router will redirect, this prevents flash of forbidden content
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">MCP Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg shadow-md border border-blue-100 dark:border-gray-600">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">MCP Entries</h2>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{mcpCount}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Total MCP entries in the system</p>
                </div>

                <div className="bg-purple-50 dark:bg-gray-700 p-6 rounded-lg shadow-md border border-purple-100 dark:border-gray-600">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Stale READMEs</h2>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{staleReadmes.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">READMEs not refreshed in the last 7 days</p>
                </div>

                <div className="bg-green-50 dark:bg-gray-700 p-6 rounded-lg shadow-md border border-green-100 dark:border-gray-600">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Recent Errors</h2>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">{recentErrors.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">API errors in the last 24 hours</p>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Stale READMEs</h2>
                {staleReadmes.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Repository</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Last Refreshed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {staleReadmes.map((mcp) => (
                                    <tr key={mcp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{mcp.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a href={mcp.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                {mcp.repository_url}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                            {mcp.last_refreshed ? new Date(mcp.last_refreshed).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => mcp.id && handleRefreshReadme(mcp.id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm"
                                            >
                                                Refresh README
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-800 dark:text-gray-200">No stale READMEs found. All READMEs are up-to-date!</p>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Recent Error Logs</h2>
                {recentErrors.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Error Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Message</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {recentErrors.map((error) => (
                                    <tr key={error.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                            {new Date(error.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{error.type}</td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{error.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-800 dark:text-gray-200">No recent errors found. Everything is running smoothly!</p>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">MCP Management</h2>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
                    <p className="mb-4 text-gray-800 dark:text-gray-200">Use this section to manage and override MCP ownership claims.</p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => router.push('/admin/mcps')}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md shadow-sm"
                        >
                            Manage MCPs
                        </button>
                        <button
                            onClick={() => router.push('/admin/users')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm"
                        >
                            Manage Users
                        </button>
                        <button
                            onClick={() => router.push('/admin/tags')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm"
                        >
                            Manage Tags
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}