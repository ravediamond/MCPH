'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'lib/supabaseClient';
import AddEditMCPModal from 'components/AddEditMCPModal';
import MCPCard from 'components/MCPCard';
import Button from 'components/ui/Button';

export default function Dashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [mcps, setMcps] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
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

                // Check if user is admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                setIsAdmin(!!profile?.is_admin);
            }
            setLoading(false);
        };

        getSession();

        // Subscribe to authentication changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!session) {
                    router.push('/');
                } else {
                    setSession(session);

                    // Check if user is admin
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('is_admin')
                        .eq('id', session.user.id)
                        .single();

                    setIsAdmin(!!profile?.is_admin);
                }
            }
        );

        // Cleanup subscription on unmount
        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, [router]);

    // Fetch MCP records for the currently logged-in user
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

    useEffect(() => {
        fetchMcps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, showAddModal]); // Keep dependencies as is, fetchMcps changes on every render.

    const handleDeleteMCP = async (mcpId: string) => {
        // The actual deletion is handled by the MCPCard component
        // This function will be called after successful deletion to refresh the list
        await fetchMcps();
    };

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
                        <h1 className="text-4xl font-bold text-gray-800">My Dashboard</h1>
                        {session && session.user ? (
                            <p className="text-lg text-gray-600">
                                Welcome back,{' '}
                                <span className="font-semibold">{session.user.email}</span>
                            </p>
                        ) : (
                            <p className="text-lg text-gray-600">No user session found.</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center gap-4">
                        <Button
                            variant="outline"
                            className="px-6 py-3 w-full max-w-xs border-green-500 text-green-700 hover:bg-green-50"
                            onClick={() => setShowAddModal(true)}
                        >
                            <div className="flex items-center space-x-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Create New MCP</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="px-6 py-3 w-full max-w-xs border-blue-500 text-blue-700 hover:bg-blue-50"
                            onClick={() => router.push('/browse')}
                        >
                            Explore MCPs
                        </Button>

                        <Button
                            variant="outline"
                            className="px-6 py-3 w-full max-w-xs"
                            onClick={() => router.push('/profile')}
                        >
                            My Profile
                        </Button>

                        {isAdmin && (
                            <Button
                                variant="outline"
                                className="px-6 py-3 w-full max-w-xs border-purple-500 text-purple-700 hover:bg-purple-50"
                                onClick={() => router.push('/admin')}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Admin Dashboard</span>
                                </div>
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            className="px-6 py-3 w-full max-w-xs"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
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
                                            onDelete={() => handleDeleteMCP(mcp.id)}
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
                            // Refresh MCP list after creating a new MCP
                            fetchMcps();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
