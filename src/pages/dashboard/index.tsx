import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <ProtectedRoute>
            <Head>
                <title>Dashboard | MCPHub</title>
            </Head>
            <Flex minH="100vh" bg="gray.100" p={8}>
                <Box maxW="7xl" mx="auto" w="100%">
                    <Box bg="white" boxShadow="md" borderRadius="lg" p={6}>
                        <Flex justify="space-between" align="center" mb={6}>
                            <Heading as="h1" size="lg">
                                Dashboard
                            </Heading>
                            <Button onClick={signOut} colorScheme="red">
                                Sign Out
                            </Button>
                        </Flex>
                        <Box borderTop="1px" borderColor="gray.200" pt={4}>
                            <Text fontWeight="medium">
                                Welcome, {user?.user_metadata?.name || user?.email || 'User'}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mt={2}>
                                You're signed in with GitHub
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </Flex>
        </ProtectedRoute>
    );
}
