import { GetServerSideProps } from 'next';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import {
    Box,
    Button,
    Container,
    Divider,
    Flex,
    Heading,
    Link,
    Tag,
    Text,
    VStack,
    HStack,
    useToast,
    Badge,
} from '@chakra-ui/react';
import { ExternalLinkIcon, EditIcon } from '@chakra-ui/icons';
import { supabase } from '../../lib/supabase';
import type { MCP } from '../../lib/supabase';

type MCPDetailProps = {
    mcp: MCP | null;
};

export default function MCPDetail({ mcp }: MCPDetailProps) {
    const user = useUser();
    const router = useRouter();
    const toast = useToast();

    if (!mcp) {
        return (
            <Container maxW="container.lg" py={10}>
                <VStack spacing={4} textAlign="center">
                    <Heading>MCP Not Found</Heading>
                    <Text>The MCP you're looking for doesn't exist or has been removed.</Text>
                    <Button as={NextLink} href="/browse" colorScheme="brand">
                        Browse MCPs
                    </Button>
                </VStack>
            </Container>
        );
    }

    const isOwner = user && user.id === mcp.user_id;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Container maxW="container.lg" py={8}>
            <VStack spacing={6} align="stretch">
                <Flex justify="space-between" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={2}>
                        <Heading as="h1" size="xl">
                            {mcp.name}
                        </Heading>
                        <HStack>
                            <Badge colorScheme="blue">v{mcp.version}</Badge>
                            <Text color="gray.600">By {mcp.author}</Text>
                        </HStack>
                    </VStack>

                    {isOwner && (
                        <Button
                            as={NextLink}
                            href={`/mcp/edit/${mcp.id}`}
                            leftIcon={<EditIcon />}
                            colorScheme="brand"
                            variant="outline"
                        >
                            Edit MCP
                        </Button>
                    )}
                </Flex>

                <Divider />

                <Box bg="white" p={6} borderRadius="md" shadow="sm">
                    <Heading as="h2" size="md" mb={4}>
                        Description
                    </Heading>
                    <Text whiteSpace="pre-line">{mcp.description}</Text>
                </Box>

                <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                    <Box bg="white" p={6} borderRadius="md" shadow="sm" flex={1}>
                        <Heading as="h2" size="md" mb={4}>
                            MCP Details
                        </Heading>
                        <VStack align="stretch" spacing={3}>
                            <Box>
                                <Text fontWeight="bold">Deployment URL</Text>
                                <Link href={mcp.deployment_url} color="brand.500" isExternal>
                                    {mcp.deployment_url} <ExternalLinkIcon mx="2px" />
                                </Link>
                            </Box>

                            {mcp.documentation_url && (
                                <Box>
                                    <Text fontWeight="bold">Documentation</Text>
                                    <Link href={mcp.documentation_url} color="brand.500" isExternal>
                                        View Documentation <ExternalLinkIcon mx="2px" />
                                    </Link>
                                </Box>
                            )}

                            <Box>
                                <Text fontWeight="bold">Published on</Text>
                                <Text>{formatDate(mcp.created_at)}</Text>
                            </Box>
                        </VStack>
                    </Box>

                    <Box bg="white" p={6} borderRadius="md" shadow="sm" flex={1}>
                        <Heading as="h2" size="md" mb={4}>
                            Tags
                        </Heading>
                        <Flex wrap="wrap" gap={2}>
                            {mcp.tags && mcp.tags.map((tag) => (
                                <Tag key={tag} size="md" colorScheme="brand" borderRadius="full">
                                    {tag}
                                </Tag>
                            ))}
                            {(!mcp.tags || mcp.tags.length === 0) && (
                                <Text color="gray.500">No tags available</Text>
                            )}
                        </Flex>
                    </Box>
                </Flex>

                <Box bg="white" p={6} borderRadius="md" shadow="sm">
                    <Heading as="h2" size="md" mb={4}>
                        How to Use This MCP
                    </Heading>
                    <Text mb={4}>
                        To use this MCP in your AI agent or application, reference the Deployment URL in your MCP-compatible client.
                    </Text>
                    <Box bg="gray.50" p={4} borderRadius="md" fontFamily="mono">
                        <Text>// Example code to integrate with this MCP</Text>
                        <Text>const mcpUrl = "{mcp.deployment_url}";</Text>
                        <Text>// Connect to the MCP endpoint in your application</Text>
                    </Box>
                </Box>
            </VStack>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const { id } = params || {};

    if (!id || typeof id !== 'string') {
        return { props: { mcp: null } };
    }

    const { data, error } = await supabase
        .from('mcps')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Error fetching MCP:', error);
        return { props: { mcp: null } };
    }

    return {
        props: {
            mcp: data,
        },
    };
};
