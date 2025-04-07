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
    HStack,
    Divider,
    Badge,
    Tag,
    useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiCode, FiDatabase, FiGlobe, FiLayers, FiShield, FiZap } from 'react-icons/fi';
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

    const bgGradient = useColorModeValue(
        'linear(to-b, blue.50, white)',
        'linear(to-b, #f0f7ff, white)'
    );

    const cardBg = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
    const accentBlue = useColorModeValue('blue.500', 'blue.300');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const FeatureCard = ({ icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
        <Box
            p={6}
            borderRadius="md"
            boxShadow="sm"
            bg={cardBg}
            height="100%"
            borderWidth="1px"
            borderColor="gray.100"
            transition="all 0.15s ease-in-out"
            _hover={{
                transform: 'translateY(-3px)',
                boxShadow: 'md',
                borderColor: 'blue.100'
            }}
        >
            <Icon as={icon} boxSize={8} color={accentBlue} mb={4} />
            <Heading as="h3" size="md" mb={2} fontWeight="600">{title}</Heading>
            <Text color={subtleTextColor} fontSize="sm">{description}</Text>
        </Box>
    );

    return (
        <Container maxW="container.xl" px={[4, 6, 8]} bg="white">
            {/* Hero Section */}
            <Box
                py={16}
                px={[4, 6, 8]}
                borderRadius="lg"
                bgGradient={bgGradient}
                mt={8}
                mb={16}
                textAlign="center"
            >
                <VStack spacing={5} align="center">
                    <Heading as="h1" size="xl" fontWeight="600" color="gray.800">
                        Discover and Connect with Model Context Protocols
                    </Heading>
                    <Text fontSize="lg" maxW="700px" color={subtleTextColor} lineHeight="1.7">
                        The central registry for MCPs (Model Context Protocols) - enabling AI systems to
                        seamlessly integrate external tools, APIs, and services
                    </Text>

                    <HStack spacing={4} pt={4}>
                        <Button
                            size="md"
                            colorScheme="blue"
                            px={8}
                            borderRadius="md"
                            fontWeight="500"
                            onClick={() => router.push('/browse')}
                            _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                        >
                            Explore MCPs
                        </Button>
                        <Button
                            size="md"
                            variant="outline"
                            colorScheme="blue"
                            borderRadius="md"
                            fontWeight="500"
                            onClick={() => router.push('/docs')}
                            _hover={{ bg: 'blue.50' }}
                        >
                            Learn More
                        </Button>
                    </HStack>
                </VStack>
            </Box>

            {/* Search Section */}
            <Box w="full" maxW="750px" mx="auto" mb={14}>
                <form onSubmit={handleSearch}>
                    <InputGroup size="lg">
                        <Input
                            placeholder="Search for MCPs by name, category, or functionality..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            bg="white"
                            size="lg"
                            borderColor="gray.200"
                            borderWidth={1}
                            borderRadius="md"
                            _hover={{ borderColor: 'gray.300' }}
                            _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px rgba(66, 153, 225, 0.6)' }}
                            py={6}
                        />
                        <InputRightElement width="5rem" h="full">
                            <Button
                                size="sm"
                                colorScheme="blue"
                                type="submit"
                                mr={4}
                                borderRadius="md"
                                fontWeight="500"
                            >
                                <SearchIcon />
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </form>
            </Box>

            {/* Features Section */}
            <Box mb={16}>
                <Heading as="h2" size="lg" mb={8} textAlign="center" fontWeight="600" color={textColor}>
                    Why Use MCP Registry?
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    <FeatureCard
                        icon={FiCode}
                        title="Standardized Protocol"
                        description="Access tools through a unified protocol that simplifies integration between AI systems and external services"
                    />
                    <FeatureCard
                        icon={FiGlobe}
                        title="Discover MCPs"
                        description="Find both open source and official MCPs from various providers to extend your AI capabilities"
                    />
                    <FeatureCard
                        icon={FiZap}
                        title="Quick Integration"
                        description="Easily connect AI agents to external tools, APIs and services with minimal coding"
                    />
                    <FeatureCard
                        icon={FiLayers}
                        title="Extensive Collection"
                        description="Browse our growing library of protocols covering diverse functionality domains"
                    />
                    <FeatureCard
                        icon={FiShield}
                        title="Verified MCPs"
                        description="Identify officially supported and community-validated protocols for reliable implementation"
                    />
                    <FeatureCard
                        icon={FiDatabase}
                        title="Detailed Documentation"
                        description="Access comprehensive documentation for each MCP to ensure smooth implementation"
                    />
                </SimpleGrid>
            </Box>

            {/* Category Tabs */}
            <Box mb={14}>
                <Heading as="h2" size="md" mb={5} fontWeight="600" color={textColor}>
                    Explore MCPs by Category
                </Heading>
                <Flex wrap="wrap" gap={2} mb={8}>
                    {['All', 'Data Retrieval', 'Content Generation', 'Search', 'Analytics', 'Communication', 'Finance'].map(category => (
                        <Tag
                            key={category}
                            size="md"
                            variant={category === 'All' ? 'solid' : 'outline'}
                            colorScheme="blue"
                            borderRadius="md"
                            px={3}
                            py={1.5}
                            cursor="pointer"
                            fontWeight="normal"
                            _hover={{ bg: category === 'All' ? 'blue.600' : 'blue.50' }}
                        >
                            {category}
                        </Tag>
                    ))}
                </Flex>
            </Box>

            {/* Featured MCPs */}
            <Box w="full" mb={16}>
                <Flex justify="space-between" align="center" mb={5}>
                    <Heading as="h2" size="md" fontWeight="600" color={textColor}>
                        Featured MCPs
                    </Heading>
                    <Button variant="ghost" colorScheme="blue" size="sm" onClick={() => router.push('/browse')}>
                        View all
                    </Button>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                    {featuredMCPs.map((mcp) => (
                        <MCPCard key={mcp.id} mcp={mcp} />
                    ))}
                </SimpleGrid>
            </Box>

            {/* Call to Action */}
            <Box
                textAlign="center"
                py={10}
                px={6}
                borderRadius="lg"
                bg="blue.50"
                mb={16}
                borderWidth="1px"
                borderColor="blue.100"
            >
                <VStack spacing={4}>
                    <Heading as="h2" size="md" fontWeight="600" color={textColor}>
                        Ready to enhance your AI agent capabilities?
                    </Heading>
                    <Text fontSize="md" maxW="650px" color={subtleTextColor}>
                        Start integrating powerful tools and services into your AI systems with our collection of Model Context Protocols
                    </Text>
                    <Button size="md" colorScheme="blue" mt={2} fontWeight="500" borderRadius="md">
                        Get Started
                    </Button>
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
