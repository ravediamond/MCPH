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
        <div className="min-h-screen bg-gray-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-gray-100 to-gray-200">
            <div className="max-w-7xl mx-auto p-8">
                <div className="flex flex-col items-center space-y-8">
                    {/* Header Section */}
                    <div className="text-center space-y-4 mb-8">
                        <h1 className="text-4xl font-bold text-gray-800">
                            My Dashboard
                        </h1>
                        {session && session.user ? (
                            <p className="text-lg text-gray-600">
                                Welcome back, <span className="font-semibold">{session.user.email}</span>
                            </p>
                        ) : (
                            <p className="text-lg text-gray-600">No user session found.</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center space-x-2"
                            onClick={() => setShowAddModal(true)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Create New MCP</span>
                        </button>
                        <button
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-200"
                            onClick={() => router.push('/')}
                        >
                            Explore MCPs
                        </button>
                    </div>

                    {/* Profile and Logout Buttons */}
                    <div className="flex gap-4">
                        <button
                            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-200"
                            onClick={() => router.push('/profile')}
                        >
                            My Profile
                        </button>
                        <button
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-200"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>

                    {/* MCPs Section */}
                    <div className="w-full mt-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            My MCPs
                        </h2>
                        {mcps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {mcps.map((mcp) => (
                                    <div
                                        key={mcp.id}
                                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-200"
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
                            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                                <p className="text-lg text-gray-600">No MCPs added yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal */}
                {session && showAddModal && (
                    <AddEditMCPModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            // Optionally refresh or update state after creating a new MCP
                        }}
                    />
                )}
            </div>
        </div>
    );
}
