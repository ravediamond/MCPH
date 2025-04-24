'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
    id: string;
    username: string;
    avatar_url: string | null;
    is_admin: boolean;
    created_at: string;
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

                // Return early if user ID is not available
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
          username, 
          avatar_url, 
          is_admin, 
          created_at
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data) {
                setUsers([]);
                return;
            }

            // Get MCP counts for each user
            const usersWithCounts = await Promise.all(
                data.map(async (userProfile) => {
                    const { count } = await supabase
                        .from('mcps')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userProfile.id);

                    return {
                        ...userProfile,
                        mcp_count: count || 0
                    } as User;
                })
            );

            setUsers(usersWithCounts);
        } catch (error) {
            console.error('Error loading users:', error);
            // Set empty array on error to prevent UI errors
            setUsers([]);
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

            alert(`Admin privileges ${newAdminStatus ? 'granted to' : 'revoked from'} ${selectedUser.username}`);
            setIsModalOpen(false);
            await loadUsers(); // Refresh the users list
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('Failed to update admin status. See console for details.');
        }
    }

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
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
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search users by username..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Avatar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">MCPs</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                    {user.avatar_url ? <Image src={user.avatar_url} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full" /> : <span className="italic text-gray-500 dark:text-gray-400">No avatar</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">{user.mcp_count}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_admin
                                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100'
                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                                        {user.is_admin ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => openUserModal(user)}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
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
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Manage User</h2>
                        <div className="mb-6 text-gray-700 dark:text-gray-300">
                            <p className="mb-2"><span className="font-semibold">Username:</span> {selectedUser.username}</p>
                            <p className="mb-2 flex items-center"><span className="font-semibold mr-2">Avatar:</span> {selectedUser.avatar_url ? <Image src={selectedUser.avatar_url} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full" /> : <span className="italic text-gray-500 dark:text-gray-400">No avatar</span>}</p>
                            <p className="mb-2"><span className="font-semibold">MCPs:</span> {selectedUser.mcp_count}</p>
                            <p className="mb-2"><span className="font-semibold">Created:</span> {new Date(selectedUser.created_at).toLocaleString()}</p>
                            <p className="mb-2">
                                <span className="font-semibold">Admin Status:</span>{' '}
                                <span className={selectedUser.is_admin ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                                    {selectedUser.is_admin ? 'Administrator' : 'Regular User'}
                                </span>
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleToggleAdmin}
                                className={`${selectedUser.is_admin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-md shadow-sm`}
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