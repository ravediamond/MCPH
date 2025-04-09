'use client';

import { Box, Container, Heading, Text, VStack, Flex, Stack, Divider } from '@chakra-ui/react';
import SearchBar from 'components/SearchBar';
import FeatureList from 'components/FeatureList';
import LoginModal from 'components/LoginModal';

export default function Home() {
    return (
        <Container maxW="container.lg" py={16}>
            <VStack spacing={12} align="stretch">
                {/* Hero Section */}
                <Box textAlign="center" py={10}>
                    <Heading as="h1" size="3xl" mb={4}>
                        MCPH
                    </Heading>
                    <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
                        Welcome to MCPH, your one-stop hub for discovering, sharing, and exploring Model Context Protocol (MCP) tools. Whether you're a developer or an AI system, MCPH simplifies the process of integration and innovation.
                    </Text>
                </Box>

                {/* Search Section */}
                <Box textAlign="center">
                    <SearchBar />
                </Box>

                {/* Features Section */}
                <Box textAlign="center">
                    <Heading as="h2" size="xl" mb={6}>
                        Explore Our Key Features
                    </Heading>
                    <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto" mb={4}>
                        Discover a range of functionalities designed to enhance your MCP experience. Our platform ensures you can securely authenticate, seamlessly integrate GitHub repositories, and tap into a robust API for AI-powered interactions.
                    </Text>
                    <FeatureList />
                </Box>

                <Divider />

                {/* How It Works Section */}
                <Box textAlign="center" py={6}>
                    <Heading as="h2" size="xl" mb={4}>
                        How It Works
                    </Heading>
                    <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto" mb={4}>
                        Getting started with MCPH is simple and straightforward. Follow these steps to become part of our growing community:
                    </Text>
                    <Stack spacing={4} direction={{ base: 'column', md: 'row' }} justify="center">
                        <Box p={4}>
                            <Heading as="h3" size="md" mb={2}>
                                1. Sign Up & Profile Setup
                            </Heading>
                            <Text fontSize="md" color="gray.500">
                                Create your account and easily manage your profile.
                            </Text>
                        </Box>
                        <Box p={4}>
                            <Heading as="h3" size="md" mb={2}>
                                2. Submit Your MCP
                            </Heading>
                            <Text fontSize="md" color="gray.500">
                                Connect your GitHub repository to automatically import your README and documentation.
                            </Text>
                        </Box>
                        <Box p={4}>
                            <Heading as="h3" size="md" mb={2}>
                                3. Explore & Integrate
                            </Heading>
                            <Text fontSize="md" color="gray.500">
                                Search our catalog to find and integrate the right tools for your projects.
                            </Text>
                        </Box>
                    </Stack>
                </Box>

                <Divider />

                {/* Call to Action Section */}
                <Box textAlign="center">
                    <Heading as="h2" size="xl" mb={4}>
                        Ready to Get Started?
                    </Heading>
                    <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto" mb={6}>
                        Join our community today and harness the full potential of the Model Context Protocol. Dive into a platform that makes integrations seamless and innovation unstoppable.
                    </Text>
                    <Flex justify="center">
                        <LoginModal />
                    </Flex>
                </Box>
            </VStack>
        </Container>
    );
}
