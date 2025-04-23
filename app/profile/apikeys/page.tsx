'use client';

import { useState, useEffect } from 'react';
import { supabase } from 'lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ApiKey } from 'types/apiKey';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaKey, FaTrash, FaCopy, FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';
import Button from 'components/ui/Button';

export default function UserApiKeysManagement() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newApiKey, setNewApiKey] = useState<{ name: string; description: string; expires_at: string | null }>({
        name: '',
        description: '',
        expires_at: null
    });
    const [createdKey, setCreatedKey] = useState<{ id: string; key: string } | null>(null);
    const [showKey, setShowKey] = useState(false);

    const router = useRouter();

    // Load API keys when component mounts
    useEffect(() => {
        async function checkAuthAndLoadKeys() {
            try {
                // Check if user is authenticated
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/');
                    return;
                }

                // Check if user is admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                setIsAdmin(profile?.is_admin === true);

                // Load API keys
                await loadApiKeys();
            } catch (error) {
                console.error('Error checking access:', error);
                toast.error('Error loading API keys');
            } finally {
                setLoading(false);
            }
        }

        checkAuthAndLoadKeys();
    }, [router]);

    const loadApiKeys = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/keys');

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setApiKeys(data.apiKeys || []);
        } catch (error) {
            console.error('Failed to load API keys:', error);
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
                    expires_at: newApiKey.expires_at || undefined
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
                expires_at: null
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
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <div className="bg-white border border-neutral-100 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">API Keys</h1>
                            <div className="flex space-x-4">
                                <Button
                                    onClick={() => router.push('/profile')}
                                    variant="outline"
                                    className="px-4 py-2"
                                >
                                    Back to Profile
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 mb-6 border border-neutral-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">Your API Keys</h2>
                                {isAdmin ? (
                                    <Button
                                        onClick={() => setShowNewKeyModal(true)}
                                        variant="primary"
                                        className="flex items-center"
                                    >
                                        <FaPlus className="mr-2" />
                                        Create New Key
                                    </Button>
                                ) : (
                                    <p className="text-red-600">Only admins can create API keys.</p>
                                )}
                            </div>

                            {apiKeys.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaKey className="mx-auto text-4xl text-gray-400 mb-3" />
                                    <p className="text-gray-600 mb-6">You don't have any API keys yet.</p>
                                    {isAdmin && (
                                        <Button
                                            onClick={() => setShowNewKeyModal(true)}
                                            variant="primary"
                                            className="px-6 py-2"
                                        >
                                            Create your first API key
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {apiKeys.map((key) => (
                                                <tr key={key.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3">
                                                                {getInitials(key.name)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="text-sm font-medium text-gray-900">{key.name}</div>
                                                                {key.description && <div className="text-xs text-gray-500">{key.description}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(key.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(key.expires_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {key.is_active ? 'Active' : 'Revoked'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteKey(key.id)}
                                                            className="text-red-600 hover:text-red-900 mr-3"
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

                        <div className="bg-white rounded-lg p-6 border border-neutral-100">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">About API Keys</h2>
                            <div className="prose max-w-none">
                                <p>API keys allow you to access the MCPH API programmatically. These keys can be used to:</p>
                                <ul className="list-disc list-inside ml-4 mt-2">
                                    <li>Search for MCPs</li>
                                    <li>Fetch MCP data</li>
                                    <li>Integrate MCPs with external tools and services</li>
                                    <li>Build applications that interact with the MCP ecosystem</li>
                                </ul>
                                <p className="mt-4"><strong>Security Notice:</strong> Keep your API keys secure. Each key provides access to the API with your privileges. Revoke a key immediately if you believe it has been compromised.</p>
                                <p className="mt-4">Need help using the API? Check out our <Link href="/docs" className="text-blue-600 hover:text-blue-800">API documentation</Link>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for creating new API key */}
            {showNewKeyModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {createdKey ? "API Key Created" : "Create New API Key"}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>

                            {createdKey ? (
                                <div>
                                    <div className="mb-4">
                                        <p className="text-yellow-600 font-semibold mb-2">
                                            Make sure to copy your API key now. You won't be able to see it again!
                                        </p>
                                        <div className="flex">
                                            <div className="flex-grow p-2 bg-gray-100 rounded-l-md border border-gray-300 truncate font-mono">
                                                {showKey ? createdKey.key : '•'.repeat(Math.min(20, createdKey.key.length))}
                                            </div>
                                            <button
                                                onClick={() => setShowKey(!showKey)}
                                                className="px-3 bg-gray-200 hover:bg-gray-300"
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
                                        <Button
                                            onClick={closeModal}
                                            variant="primary"
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateKey}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                                            Key Name <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800"
                                            placeholder="e.g., Personal API Key"
                                            value={newApiKey.name}
                                            onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="description">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            id="description"
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800"
                                            placeholder="What will this API key be used for?"
                                            value={newApiKey.description}
                                            onChange={(e) => setNewApiKey({ ...newApiKey, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="expires">
                                            Expiration (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            id="expires"
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800"
                                            value={newApiKey.expires_at || ''}
                                            onChange={(e) => setNewApiKey({ ...newApiKey, expires_at: e.target.value || null })}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Leave blank for a non-expiring API key
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                        >
                                            Create API Key
                                        </Button>
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