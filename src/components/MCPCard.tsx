import { Box, Heading, Text, Tag, HStack, LinkBox, LinkOverlay } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { MCP } from '../lib/supabase';

type MCPCardProps = {
    mcp: MCP;
};

const MCPCard = ({ mcp }: MCPCardProps) => {
    return (
        <LinkBox
            as="article"
            w={{ base: "100%", sm: "45%", md: "30%" }}
            bg="white"
            p={5}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
            _hover={{ shadow: 'md', borderColor: 'brand.200' }}
            transition="all 0.2s"
        >
            <Heading size="md" mb={2} noOfLines={1}>
                <NextLink href={`/mcp/${mcp.id}`} passHref>
                    <LinkOverlay>{mcp.name}</LinkOverlay>
                </NextLink>
            </Heading>

            <Text fontSize="sm" color="gray.500" mb={2}>
                v{mcp.version} • by {mcp.author}
            </Text>

            <Text noOfLines={3} mb={4}>
                {mcp.description}
            </Text>

            <HStack wrap="wrap" spacing={2}>
                {mcp.tags && mcp.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag} size="sm" colorScheme="brand" variant="subtle">
                        {tag}
                    </Tag>
                ))}
                {mcp.tags && mcp.tags.length > 3 && (
                    <Text fontSize="xs" color="gray.500">+{mcp.tags.length - 3} more</Text>
                )}
            </HStack>
        </LinkBox>
    );
};

export default MCPCard;
