'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    is_admin: boolean;
    created_at: string;
    github_username: string | null;
    mcp_count?: number;
}

export default function AdminUsers() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

                // Load users data
                await loadUsers();
            } catch (error) {
                console.error('Error checking admin access:', error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        }

        checkAdminAccess();
    }, [router]);

    async function loadUsers() {
        try {
            // Get all profiles with their MCP counts
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          id, 
          email, 
          is_admin, 
          created_at, 
          github_username
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get MCP counts for each user
            const usersWithCounts = await Promise.all(data.map(async (user) => {
                const { count } = await supabase
                    .from('mcps')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                return {
                    ...user,
                    mcp_count: count || 0
                };
            }));

            setUsers(usersWithCounts);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    function openUserModal(user: User) {
        setSelectedUser(user);
        setIsModalOpen(true);
    }

    async function handleToggleAdmin() {
        if (!selectedUser) return;

        try {
            const newAdminStatus = !selectedUser.is_admin;

            // Update the user's admin status
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: newAdminStatus })
                .eq('id', selectedUser.id);

            if (error) throw error;

            alert(`Admin privileges ${newAdminStatus ? 'granted to' : 'revoked from'} ${selectedUser.email}`);
            setIsModalOpen(false);
            await loadUsers(); // Refresh the users list
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('Failed to update admin status. See console for details.');
        }
    }

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.github_username && user.github_username.toLowerCase().includes(searchTerm.toLowerCase()))
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
                <h1 className="text-3xl font-bold">User Management</h1>
                <button
                    onClick={() => router.push('/admin')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search users by email or GitHub username..."
                    className="w-full p-2 border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GitHub Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">MCPs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.github_username || 'Not linked'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.mcp_count}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.is_admin ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => openUserModal(user)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Manage User
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Management Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Manage User</h2>
                        <p className="mb-4">
                            <strong>Email:</strong> {selectedUser.email}<br />
                            <strong>GitHub Username:</strong> {selectedUser.github_username || 'Not linked'}<br />
                            <strong>MCPs:</strong> {selectedUser.mcp_count}<br />
                            <strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleString()}<br />
                            <strong>Admin Status:</strong> {selectedUser.is_admin ? 'Administrator' : 'Regular User'}
                        </p>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleToggleAdmin}
                                className={`${selectedUser.is_admin ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded`}
                            >
                                {selectedUser.is_admin ? 'Remove Admin Privileges' : 'Grant Admin Privileges'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}