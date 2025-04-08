import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

export default function SignIn() {
    const { user, signInWithGitHub, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !isLoading) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    return (
        <>
            <Head>
                <title>Login | MCPHub</title>
            </Head>
            <Flex minH="100vh" align="center" justify="center">
                <Box p={8} borderRadius="lg" boxShadow="md">
                    <Heading mb={4}>Sign in to your account</Heading>
                    <Button
                        onClick={signInWithGitHub}
                        isLoading={isLoading}
                        variant="solid"
                        size="md"
                    >
                        Sign in with GitHub
                    </Button>
                    <Text mt={4}>
                        No need to sign up separately. Simply sign in with your GitHub account.
                    </Text>
                </Box>
            </Flex>
        </>
    );
}
