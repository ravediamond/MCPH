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
    Spinner,
} from '@chakra-ui/react';

export default function Dashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        // Function to get the current session
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            // If no active session, redirect to homepage or login page
            if (!session) {
                router.push('/');
            } else {
                setSession(session);
            }
            setLoading(false);
        };

        getSession();

        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!session) {
                    router.push('/');
                } else {
                    setSession(session);
                }
            }
        );

        // Cleanup the subscription on component unmount
        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, [router]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        } else {
            // Redirect to homepage after logging out
            router.push('/');
        }
    };

    // Display a loading spinner while checking authentication
    if (loading) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    return (
        <Box p={8}>
            <VStack spacing={6}>
                <Heading as="h1" size="xl">
                    Dashboard
                </Heading>
                {session && session.user ? (
                    <Text fontSize="lg">
                        Welcome, <strong>{session.user.email}</strong>!
                    </Text>
                ) : (
                    <Text fontSize="lg">No user session found.</Text>
                )}
                <Button onClick={handleLogout} colorScheme="red">
                    Logout
                </Button>
            </VStack>
        </Box>
    );
}
