'use client';

import { useState, useEffect } from 'react';
import { createClientSupabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ApiKey } from 'types/apiKey';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaKey, FaTrash, FaCopy, FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';
import { useSupabase } from '../../supabase-provider';

export default function ApiKeysManagement() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newApiKey, setNewApiKey] = useState<{ name: string; description: string; expires_at: string | null; isAdminKey: boolean }>({
        name: '',
        description: '',
        expires_at: null,
        isAdminKey: false
    });
    const [createdKey, setCreatedKey] = useState<{ id: string; key: string } | null>(null);
    const [showKey, setShowKey] = useState(false);

    const router = useRouter();
    const { session } = useSupabase();
    // Create a client-side Supabase instance that handles auth properly
    const clientSupabase = createClientSupabase();

    // Check admin access and load API keys
    useEffect(() => {
        async function checkAdminAccessAndLoadKeys() {
            try {
                console.log('[Client] Checking authentication. Session exists:', !!session);

                if (!session) {
                    console.log('[Client] No session found, redirecting to login');
                    toast.error('Please login to access this page');
                    router.push('/');
                    return;
                }

                // Check if user has admin role
                const { data, error: profileError } = await clientSupabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id as string)
                    .single();

                if (profileError) {
                    console.error('[Client] Error fetching profile:', profileError);
                    toast.error('Failed to check user permissions');
                    return;
                }

                // Safely check if user is admin
                const isAdmin = data && 'is_admin' in data ? !!data.is_admin : false;
                setIsAdmin(isAdmin);

                if (!isAdmin) {
                    console.log('[Client] User is not an admin, redirecting');
                    toast.error('Admin access required');
                    router.push('/dashboard');
                    return;
                }

                // Load API keys
                await loadApiKeys();
            } catch (error) {
                console.error('[Client] Error checking access:', error);
                toast.error('Error loading API keys');
            } finally {
                setLoading(false);
            }
        }

        checkAdminAccessAndLoadKeys();
    }, [router, session]);

    const loadApiKeys = async () => {
        try {
            console.log('[Client] Starting to load API keys');
            setLoading(true);

            console.log('[Client] Fetching from /api/keys with credentials');
            const response = await fetch('/api/keys', {
                credentials: 'include', // Important - include cookies in the request
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('[Client] API response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(e => ({ error: 'Could not parse error response' }));
                console.error('[Client] API error response:', errorData);
                throw new Error(`Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('[Client] API keys loaded successfully. Count:', data.apiKeys?.length || 0);
            setApiKeys(data.apiKeys || []);
        } catch (error) {
            console.error('[Client] Failed to load API keys:', error);
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newApiKey.name.trim()) {
            toast.error('API key name is required');
            return;
        }

        try {
            const response = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newApiKey.name,
                    description: newApiKey.description || undefined,
                    expires_at: newApiKey.expires_at || undefined,
                    isAdminKey: newApiKey.isAdminKey
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create API key');
            }

            // Store the newly created key (will only be shown once)
            setCreatedKey({
                id: data.apiKey.id,
                key: data.plainTextKey
            });

            // Reset the form
            setNewApiKey({
                name: '',
                description: '',
                expires_at: null,
                isAdminKey: false
            });

            // Reload the API keys list
            await loadApiKeys();

            toast.success('API key created successfully');
        } catch (error) {
            console.error('Error creating API key:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create API key');
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/keys?id=${keyId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to revoke API key');
            }

            // Reload the API keys list
            await loadApiKeys();
            toast.success('API key revoked successfully');
        } catch (error) {
            console.error('Error revoking API key:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to revoke API key');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('API key copied to clipboard');
        }).catch((error) => {
            console.error('Failed to copy: ', error);
            toast.error('Failed to copy API key');
        });
    };

    const closeModal = () => {
        setShowNewKeyModal(false);
        // Only reset created key if modal is fully closed
        setTimeout(() => {
            if (!showNewKeyModal) {
                setCreatedKey(null);
                setShowKey(false);
            }
        }, 300);
    };

    // Format the expiration date for display
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get name initials for the avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">API Keys Management</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-md transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your API Keys</h2>
                        <button
                            onClick={() => setShowNewKeyModal(true)}
                            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            <FaPlus className="mr-2" />
                            Create New Key
                        </button>
                    </div>

                    {apiKeys.length === 0 ? (
                        <div className="text-center py-12">
                            <FaKey className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                            <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have any API keys yet.</p>
                            <button
                                onClick={() => setShowNewKeyModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
                            >
                                Create your first API key
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expires</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Used</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {apiKeys.map((key) => (
                                        <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center mr-3">
                                                        {getInitials(key.name)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{key.name}</div>
                                                        {key.description && <div className="text-xs text-gray-500 dark:text-gray-400">{key.description}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(key.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(key.expires_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${key.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                    {key.is_active ? 'Active' : 'Revoked'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-3"
                                                    title="Revoke API Key"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">About API Keys</h2>
                    <div className="prose dark:prose-invert max-w-none">
                        <p>API keys allow third-party applications to access the MCPH API on your behalf. These keys can be used to:</p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li>Fetch MCP data programmatically</li>
                            <li>Integrate with external tools and services</li>
                            <li>Build custom applications that interact with MCPs</li>
                        </ul>
                        <p className="mt-4"><strong>Security Notice:</strong> Keep your API keys secret. Each key provides access to the API with your privileges. Revoke a key immediately if you believe it has been compromised.</p>
                        <p className="mt-4">Need help using the API? Check out our <Link href="/docs" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">API documentation</Link>.</p>
                    </div>
                </div>
            </div>

            {/* Modal for creating new API key */}
            {showNewKeyModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                    {createdKey ? "API Key Created" : "Create New API Key"}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    &times;
                                </button>
                            </div>

                            {createdKey ? (
                                <div>
                                    <div className="mb-4">
                                        <p className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">
                                            Make sure to copy your API key now. You won't be able to see it again!
                                        </p>
                                        <div className="flex">
                                            <div className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 rounded-l-md border border-gray-300 dark:border-gray-600 truncate font-mono">
                                                {showKey ? createdKey.key : '•'.repeat(Math.min(20, createdKey.key.length))}
                                            </div>
                                            <button
                                                onClick={() => setShowKey(!showKey)}
                                                className="px-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                                                title={showKey ? "Hide API Key" : "Show API Key"}
                                            >
                                                {showKey ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(createdKey.key)}
                                                className="px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-r-md"
                                                title="Copy API Key"
                                            >
                                                <FaCopy />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-6">
                                        <button
                                            onClick={closeModal}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateKey}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">
                                            Key Name <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                            placeholder="e.g., Development API Key"
                                            value={newApiKey.name}
                                            onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="description">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            id="description"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                            placeholder="What will this API key be used for?"
                                            value={newApiKey.description}
                                            onChange={(e) => setNewApiKey({ ...newApiKey, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="expires">
                                            Expiration (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            id="expires"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                            value={newApiKey.expires_at || ''}
                                            onChange={(e) => setNewApiKey({ ...newApiKey, expires_at: e.target.value || null })}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Leave blank for a non-expiring API key (not recommended for production)
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="admin-key"
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                checked={newApiKey.isAdminKey}
                                                onChange={(e) => setNewApiKey({ ...newApiKey, isAdminKey: e.target.checked })}
                                            />
                                            <label htmlFor="admin-key" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Create as Admin API Key
                                            </label>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Admin API keys have full access to all API endpoints including administrative functions
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                                        >
                                            Create API Key
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}