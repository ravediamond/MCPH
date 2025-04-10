'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'lib/supabaseClient';
import AddEditMCPModal from 'components/AddEditMCPModal';
import MCPCard from 'components/MCPCard';

export default function Dashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [mcps, setMcps] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Retrieve the current session
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
            } else {
                setSession(session);
            }
            setLoading(false);
        };

        getSession();

        // Subscribe to authentication changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!session) {
                    router.push('/');
                } else {
                    setSession(session);
                }
            }
        );

        // Cleanup subscription on unmount
        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, [router]);

    // Fetch MCP records for the currently logged-in user
    useEffect(() => {
        const fetchMcps = async () => {
            if (session?.user) {
                const { data, error } = await supabase
                    .from('mcps')
                    .select('*')
                    .eq('user_id', session.user.id);

                if (error) {
                    console.error('Error fetching MCPs:', error);
                } else {
                    setMcps(data);
                }
            }
        };

        fetchMcps();
    }, [session, showAddModal]); // Re-fetch when session updates or after closing the modal

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        } else {
            router.push('/');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col items-center space-y-10">
                {/* Welcome / Header Section */}
                <h1 className="text-4xl font-bold mb-2">
                    Dashboard
                </h1>
                {session && session.user ? (
                    <p className="text-lg">
                        Welcome back, <strong>{session.user.email}</strong>!
                    </p>
                ) : (
                    <p className="text-lg">No user session found.</p>
                )}

                {/* Button to Create a New MCP */}
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={() => setShowAddModal(true)}
                >
                    Create New MCP
                </button>

                {/* Button to Explore MCPs */}
                <button
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                    onClick={() => router.push('/')}
                >
                    Explore MCPs
                </button>

                {/* Logout Button */}
                <div className="flex justify-center mt-8 gap-4">
                    <button
                        className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
                        onClick={() => router.push('/profile')}
                    >
                        My Profile
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                {/* Display Added MCPs as Cards */}
                <div className="w-full mt-10">
                    <h2 className="text-2xl font-bold mb-4">
                        My MCPs
                    </h2>
                    {mcps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mcps.map((mcp) => (
                                <div
                                    key={mcp.id}
                                    className="border border-gray-200 rounded-lg overflow-hidden p-4 shadow-md hover:shadow-lg hover:cursor-pointer"
                                    onClick={() => router.push(`/mcp/${mcp.id}`)}
                                >
                                    <MCPCard
                                        mcp={mcp}
                                        onClick={() => router.push(`/mcp/${mcp.id}`)}
                                        editable={true}
                                        onDelete={() => {
                                            setMcps(mcps.filter(m => m.id !== mcp.id));
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-lg">No MCPs added yet.</p>
                    )}
                </div>
            </div>

            {/* Add/Edit MCP Modal */}
            {session && showAddModal && (
                <AddEditMCPModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        // Optionally refresh or update state after creating a new MCP.
                    }}
                />
            )}
        </div>
    );
}
