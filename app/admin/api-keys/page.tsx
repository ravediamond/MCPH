"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { FaCopy, FaCheck } from "react-icons/fa";

interface ApiKeyMeta {
    id: string;
    createdAt: string;
    lastUsedAt?: string;
    name?: string;
}

export default function ApiKeysPage() {
    const { user } = useAuth();
    const [apiKeys, setApiKeys] = useState<ApiKeyMeta[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keyName, setKeyName] = useState("");
    const [copied, setCopied] = useState(false);

    async function fetchKeys() {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/user/${user.uid}/api-keys`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setApiKeys(data);
        } catch (e) {
            setError("Failed to load API keys");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchKeys();
        // eslint-disable-next-line
    }, [user]);

    async function handleCreate() {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/user/${user.uid}/api-keys`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: keyName }),
            });
            const data = await res.json();
            if (data.apiKey) {
                setNewKey(data.apiKey);
                fetchKeys();
                setKeyName("");
            } else {
                setError("Failed to create API key");
            }
        } catch (e) {
            setError("Failed to create API key");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            await fetch(`/api/user/${user.uid}/api-keys`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ keyId: id }),
            });
            fetchKeys();
        } catch (e) {
            setError("Failed to delete API key");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">API Keys</h1>
            <p className="mb-6 text-gray-600">Create and manage your API keys. Each key grants the same permissions as your user account.</p>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="mb-6">
                <label className="block mb-1 font-medium">Key name (optional):</label>
                <input
                    className="border px-2 py-1 rounded w-full mb-2"
                    value={keyName}
                    onChange={e => setKeyName(e.target.value)}
                    disabled={loading}
                />
                <Button
                    onClick={handleCreate}
                    disabled={loading || !user}
                    className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-base font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-colors border border-blue-600"
                >
                    Create API Key
                </Button>
            </div>
            {newKey && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                    <div className="mb-2 font-semibold">Your new API key:</div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono break-all text-green-700">{newKey}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(newKey);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                            }}
                            className="ml-2 p-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700"
                            title="Copy to clipboard"
                        >
                            {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
                        </button>
                    </div>
                    <div className="text-xs text-gray-600">Copy and save this key now. You won't be able to see it again.</div>
                    <Button onClick={() => setNewKey(null)} className="mt-2">Dismiss</Button>
                </div>
            )}
            <h2 className="text-lg font-semibold mb-2">Your API Keys</h2>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <table className="w-full border text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Created</th>
                            <th className="p-2 text-left">Last Used</th>
                            <th className="p-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {apiKeys.map(key => (
                            <tr key={key.id}>
                                <td className="p-2">{key.name || <span className="text-gray-400">(no name)</span>}</td>
                                <td className="p-2">{new Date(key.createdAt).toLocaleString()}</td>
                                <td className="p-2">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : <span className="text-gray-400">Never</span>}</td>
                                <td className="p-2">
                                    <Button onClick={() => handleDelete(key.id)} disabled={loading} variant="danger">
                                        Revoke
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {apiKeys.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-2 text-center text-gray-400">No API keys</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
