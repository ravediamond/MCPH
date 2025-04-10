import React, { useState } from 'react';
import {
    Box,
    Heading,
    Text,
    Flex,
    Tag,
    HStack,
    Badge,
    Icon,
    IconButton,
    useDisclosure,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon, DeleteIcon } from '@chakra-ui/icons';
import { supabase } from 'lib/supabaseClient';

interface MCPCardProps {
    mcp: any;
    onClick: () => void;
    editable?: boolean;
    onDelete?: () => void;
}

export default function MCPCard({ mcp, onClick, editable, onDelete }: MCPCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef(null);

    // Handle click on the card without triggering for delete button
    const handleCardClick = (e: React.MouseEvent) => {
        // Only trigger the onClick if the click wasn't on the delete button area
        if (!(e.target as HTMLElement).closest('.delete-action')) {
            onClick();
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('mcps')
                .delete()
                .eq('id', mcp.id);

            if (error) {
                console.error('Error deleting MCP:', error);
                alert('Failed to delete MCP. Please try again.');
            } else {
                // Call the onDelete callback to update the UI
                if (onDelete) onDelete();
            }
        } catch (error) {
            console.error('Error during deletion:', error);
        } finally {
            setIsDeleting(false);
            onClose();
        }
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="md"
            p={4}
            w="100%"
            cursor="pointer"
            _hover={{ shadow: 'md' }}
            onClick={handleCardClick}
            position="relative"
        >
            <Heading as="h3" size="md" mb={2}>
                {mcp.name || 'Untitled MCP'}
            </Heading>

            {/* Version badge */}
            {mcp.version && (
                <Badge colorScheme="green" mb={2}>v{mcp.version}</Badge>
            )}

            <Text fontSize="sm" color="gray.600" mb={3}>
                {mcp.description || 'No description provided'}
            </Text>

            {/* Tags display */}
            {mcp.tags && mcp.tags.length > 0 && (
                <HStack spacing={2} mt={2} mb={2} flexWrap="wrap">
                    {mcp.tags.map((tag: string, index: number) => (
                        <Tag
                            key={index}
                            size="sm"
                            colorScheme="blue"
                            borderRadius="full"
                            mt={1}
                        >
                            {tag}
                        </Tag>
                    ))}
                </HStack>
            )}

            {/* Deployment URL indicator */}
            {mcp.deployment_url && (
                <Text fontSize="xs" color="blue.500" mt={2}>
                    <Icon as={ExternalLinkIcon} mr={1} />
                    Deployment available
                </Text>
            )}

            {editable && (
                <Flex justify="flex-end" mt={2} className="delete-action">
                    <IconButton
                        aria-label="Edit MCP"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        mr={2}
                        onClick={(e) => {
                            e.stopPropagation();
                            // You can implement edit functionality here
                            console.log('Edit MCP');
                        }}
                    />
                    <IconButton
                        aria-label="Delete MCP"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen();
                        }}
                    />
                </Flex>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete MCP
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to delete "{mcp.name}"? This action cannot be undone.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleDeleteConfirm}
                                ml={3}
                                isLoading={isDeleting}
                                loadingText="Deleting"
                            >
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}
