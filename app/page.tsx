'use client';

import { Box, Container, Heading, Text, VStack, Flex } from '@chakra-ui/react';
import SearchBar from '../components/SearchBar';
import FeatureList from '../components/FeatureList';
import LoginModal from '../components/LoginModal';

export default function Home() {
    return (
        <Container maxW="container.xl" py={16}>
            <VStack spacing={12} align="stretch">
                {/* Hero Section */}
                <Box textAlign="center" py={10}>
                    <Heading as="h1" size="2xl" mb={4}>
                        MCP Registry
                    </Heading>
                    <Text fontSize="lg" color="gray.600" maxW="container.md" mx="auto">
                        MCP Registry is a project aimed at creating the equivalent of PyPI
                        for the Model Context Protocol (MCP). Instead of hosting packages, this
                        project references MCP deployment URLs to enable agent systems,
                        such as ChatGPT, to leverage APIs and tools using a commenting protocol.
                    </Text>
                </Box>

                {/* Search Bar */}
                <Box>
                    <SearchBar />
                </Box>

                {/* Features List */}
                <Box textAlign="center">
                    <Heading as="h2" size="lg" mb={6}>
                        Key Features
                    </Heading>
                    <FeatureList />
                </Box>

                {/* Action Section with Login Modal */}
                <Flex justify="center">
                    <LoginModal />
                </Flex>
            </VStack>
        </Container>
    );
}
