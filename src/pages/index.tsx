import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    VStack,
    SimpleGrid,
    Icon,
    useColorModeValue,
    HStack,
    Spacer,
    Divider,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiCode, FiPackage, FiUserPlus } from 'react-icons/fi';
import { GetServerSideProps } from 'next';
import { supabase } from '../lib/supabase';
import type { MCP } from '../lib/supabase';
import MCPCard from '../components/MCPCard';

type HomeProps = {
    featuredMCPs: MCP[];
};

export default function Home({ featuredMCPs }: HomeProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const textColor = useColorModeValue('gray.700', 'gray.200');
    const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
    const bgColor = useColorModeValue('white', 'gray.800');
    const sectionBg = useColorModeValue('gray.50', 'gray.700');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const InfoBlock = ({ icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
        <Box p={5} borderRadius="md" bg={sectionBg}>
            <HStack spacing={4} align="flex-start">
                <Icon as={icon} boxSize={6} color="blue.500" mt={1} />
                <Box>
                    <Heading as="h3" size="sm" mb={2}>{title}</Heading>
                    <Text color={subtleTextColor} fontSize="sm">{description}</Text>
                </Box>
            </HStack>
        </Box>
    );

    return (
        <Container maxW="container.xl" px={[4, 6]} bg={bgColor}>
            {/* Header with Login */}
            <Flex py={4} align="center">
                <Text fontWeight="bold" color="blue.500">MCPHub</Text>
                <Spacer />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/login')}
                    colorScheme="blue"
                >
                    Login
                </Button>
            </Flex>
            <Divider mb={8} />

            {/* Minimal Hero Section */}
            <VStack spacing={6} align="center" mb={10} textAlign="center">
                <Heading as="h1" size="xl" fontWeight="600" color={textColor}>
                    Model Context Protocols Registry
                </Heading>
                <Text fontSize="lg" maxW="650px" color={subtleTextColor} lineHeight="1.7">
                    The central registry for MCPs - enabling AI systems to
                    seamlessly integrate external tools, APIs, and services
                </Text>
            </VStack>

            {/* Search Section */}
            <Box w="full" maxW="600px" mx="auto" mb={12}>
                <form onSubmit={handleSearch}>
                    <InputGroup size="lg">
                        <Input
                            placeholder="Search for MCPs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            bg={bgColor}
                            borderRadius="md"
                            borderColor="gray.200"
                        />
                        <InputRightElement width="4rem">
                            <Button
                                size="sm"
                                colorScheme="blue"
                                type="submit"
                                mr={2}
                                borderRadius="md"
                            >
                                <SearchIcon />
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </form>
            </Box>

            {/* About Section */}
            <VStack spacing={6} mb={12} align="stretch" maxW="container.lg" mx="auto">
                <Heading as="h2" size="md" fontWeight="600" color={textColor}>
                    What is MCPHub?
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                    <InfoBlock
                        icon={FiCode}
                        title="Standardized Protocol Registry"
                        description="MCPHub is like PyPI for Model Context Protocols - a central place to discover and share protocols that define how AI systems can interact with external tools and services."
                    />
                    <InfoBlock
                        icon={FiPackage}
                        title="Publish Your Own MCPs"
                        description="Create and share your own Model Context Protocols with the community. Help expand the ecosystem of tools available to AI systems."
                    />
                    <InfoBlock
                        icon={FiUserPlus}
                        title="Getting Started"
                        description="Login to publish your MCPs. Browse the existing collection to discover protocols that can enhance your AI applications."
                    />
                </SimpleGrid>
            </VStack>

            {/* Featured MCPs */}
            <Box w="full" mb={12} maxW="container.lg" mx="auto">
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading as="h2" size="md" fontWeight="600" color={textColor}>
                        Featured MCPs
                    </Heading>
                    <Button variant="ghost" colorScheme="blue" size="sm" onClick={() => router.push('/browse')}>
                        View all
                    </Button>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {featuredMCPs.slice(0, 4).map((mcp) => (
                        <MCPCard key={mcp.id} mcp={mcp} />
                    ))}
                </SimpleGrid>
            </Box>

            {/* Call to Action */}
            <Box
                textAlign="center"
                py={8}
                px={6}
                borderRadius="lg"
                bg={sectionBg}
                mb={12}
                maxW="container.lg"
                mx="auto"
            >
                <VStack spacing={4}>
                    <Heading as="h2" size="md" fontWeight="600" color={textColor}>
                        Ready to contribute?
                    </Heading>
                    <Text fontSize="md" color={subtleTextColor}>
                        Share your Model Context Protocols with the community
                    </Text>
                    <HStack spacing={4}>
                        <Button
                            colorScheme="blue"
                            onClick={() => router.push('/login')}
                        >
                            Login to Publish
                        </Button>
                        <Button
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => router.push('/docs')}
                        >
                            Learn More
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Container>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    const { data: featuredMCPs, error } = await supabase
        .from('mcps')
        .select('*')
        .limit(6);

    if (error) {
        console.error('Error fetching featured MCPs:', error);
        return { props: { featuredMCPs: [] } };
    }

    return {
        props: {
            featuredMCPs: featuredMCPs || [],
        },
    };
};
