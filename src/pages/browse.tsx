import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Container,
    Flex,
    Grid,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Select,
    Spinner,
    Tag,
    Text,
    VStack,
    Wrap,
    Button,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import type { MCP } from '../lib/supabase';
import MCPCard from '../components/MCPCard';

export default function Browse() {
    const router = useRouter();
    const { q: initialQuery, tag: initialTag } = router.query;

    const [searchQuery, setSearchQuery] = useState(initialQuery as string || '');
    const [selectedTag, setSelectedTag] = useState(initialTag as string || '');
    const [mcps, setMcps] = useState<MCP[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            const { data } = await supabase.from('mcps').select('tags');

            if (data) {
                const tags = data.flatMap(item => item.tags || []);
                const uniqueTags = [...new Set(tags)];
                setAllTags(uniqueTags);
            }
        };

        fetchTags();
    }, []);

    useEffect(() => {
        setSearchQuery(initialQuery as string || '');
        setSelectedTag(initialTag as string || '');
    }, [initialQuery, initialTag]);

    useEffect(() => {
        const fetchMCPs = async () => {
            setLoading(true);

            let query = supabase.from('mcps').select('*');

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            if (selectedTag) {
                query = query.contains('tags', [selectedTag]);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching MCPs:', error);
            } else {
                setMcps(data || []);
            }

            setLoading(false);
        };

        fetchMCPs();
    }, [searchQuery, selectedTag]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedTag) params.set('tag', selectedTag);

        router.push(`/browse?${params.toString()}`, undefined, { shallow: true });
    };

    return (
        <Container maxW="container.xl">
            <VStack spacing={8} align="stretch" my={8}>
                <Heading as="h1" size="xl">
                    Browse MCPs
                </Heading>

                <Box>
                    <form onSubmit={handleSearch}>
                        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
                            <InputGroup flex={1}>
                                <Input
                                    placeholder="Search MCPs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    bg="white"
                                />
                                <InputRightElement>
                                    <SearchIcon color="gray.500" />
                                </InputRightElement>
                            </InputGroup>

                            <Select
                                placeholder="Filter by tag"
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                bg="white"
                                w={{ base: 'full', md: '200px' }}
                            >
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </Select>

                            <Button type="submit" colorScheme="brand">
                                Apply Filters
                            </Button>
                        </Flex>
                    </form>
                </Box>

                {loading ? (
                    <Flex justify="center" py={10}>
                        <Spinner size="xl" color="brand.500" />
                    </Flex>
                ) : mcps.length > 0 ? (
                    <Flex wrap="wrap" gap={6}>
                        {mcps.map(mcp => (
                            <MCPCard key={mcp.id} mcp={mcp} />
                        ))}
                    </Flex>
                ) : (
                    <Box textAlign="center" py={10}>
                        <Text fontSize="lg">No MCPs found matching your search criteria.</Text>
                    </Box>
                )}
            </VStack>
        </Container>
    );
}
