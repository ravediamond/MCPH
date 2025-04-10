'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'lib/supabaseClient';
import {
    Box,
    Button,
    Heading,
    Text,
    VStack,
    Flex,
    Spinner,
    SimpleGrid,
} from '@chakra-ui/react';
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
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    return (
        <Box p={8}>
            <VStack spacing={10} align="center">
                {/* Welcome / Header Section */}
                <Heading as="h1" size="2xl" mb={2}>
                    Dashboard
                </Heading>
                {session && session.user ? (
                    <Text fontSize="lg">
                        Welcome back, <strong>{session.user.email}</strong>!
                    </Text>
                ) : (
                    <Text fontSize="lg">No user session found.</Text>
                )}

                {/* Button to Create a New MCP */}
                <Button colorScheme="blue" onClick={() => setShowAddModal(true)}>
                    Create New MCP
                </Button>

                {/* Button to Explore MCPs */}
                <Button onClick={() => router.push('/')} colorScheme="purple">
                    Explore MCPs
                </Button>

                {/* Logout Button */}
                <Flex justify="center" mt={8} gap={4}>
                    <Button onClick={() => router.push('/profile')} colorScheme="teal">
                        My Profile
                    </Button>
                    <Button onClick={handleLogout} colorScheme="red">
                        Logout
                    </Button>
                </Flex>

                {/* Display Added MCPs as Cards */}
                <Box width="100%" mt={10}>
                    <Heading as="h2" size="lg" mb={4}>
                        My MCPs
                    </Heading>
                    {mcps.length > 0 ? (
                        <SimpleGrid columns={[1, 2, 3]} spacing={6}>
                            {mcps.map((mcp) => (
                                <Box
                                    key={mcp.id}
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    overflow="hidden"
                                    p={4}
                                    shadow="md"
                                    _hover={{ shadow: 'lg', cursor: 'pointer' }}
                                    onClick={() => router.push(`/mcp/${mcp.id}`)}
                                >
                                    <MCPCard
                                        mcp={mcp}
                                        onClick={() => router.push(`/mcp/${mcp.id}`)}
                                        editable={true}
                                        onDelete={() => {
                                            // Filter out the deleted MCP from the state
                                            setMcps(mcps.filter(m => m.id !== mcp.id));
                                        }}
                                    />
                                </Box>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Text>No MCPs added yet.</Text>
                    )}
                </Box>
            </VStack>

            {/* Add/Edit MCP Modal */}
            {session && showAddModal && (
                <AddEditMCPModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        // Optionally refresh or update state after creating a new MCP.
                        // Since we're monitoring "showAddModal", closing the modal triggers a fetch.
                    }}
                />
            )}
        </Box>
    );
}
