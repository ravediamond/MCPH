'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Box, Button, Container, Heading, Text } from '@chakra-ui/react';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Optionally check for an existing session and redirect if logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push('/');
            }
        });
    }, [router]);

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github'
        });
        if (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <Container maxW="container.sm" py={10}>
            <Heading as="h2" size="lg" mb={4}>Login</Heading>
            <Text mb={6}>Sign in with GitHub to access the MCP Hub features.</Text>
            <Button colorScheme="blue" onClick={handleLogin}>Login with GitHub</Button>
        </Container>
    );
}
