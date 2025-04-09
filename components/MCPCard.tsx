import React from 'react';
import { Box, Heading, Text, Flex } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

interface MCPCardProps {
    mcp: any;
    onClick: () => void;
    editable?: boolean;
}

export default function MCPCard({ mcp, onClick, editable }: MCPCardProps) {
    return (
        <Box
            borderWidth="1px"
            borderRadius="md"
            p={4}
            w="100%"
            cursor="pointer"
            _hover={{ shadow: 'md' }}
            onClick={onClick}
        >
            <Heading as="h3" size="md" mb={2}>
                {mcp.title || 'Untitled MCP'}
            </Heading>
            <Text fontSize="sm" color="gray.600">
                {mcp.description || 'No description provided'}
            </Text>
            {editable && (
                <Flex justify="flex-end" mt={2}>
                    <EditIcon />
                </Flex>
            )}
        </Box>
    );
}
