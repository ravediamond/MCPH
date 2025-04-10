import React, { useState, useRef } from 'react';
import { FiExternalLink, FiEdit, FiTrash2 } from 'react-icons/fi';
import { supabase } from 'lib/supabaseClient';

interface MCPCardProps {
    mcp: any;
    onClick: () => void;
    editable?: boolean;
    onDelete?: () => void;
}

export default function MCPCard({ mcp, onClick, editable, onDelete }: MCPCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const cancelRef = useRef(null);

    // Handle click on the card without triggering for delete button
    const handleCardClick = (e: React.MouseEvent) => {
        // Only trigger the onClick if the click wasn't on the delete button area
        if (!(e.target as HTMLElement).closest('.delete-action')) {
            onClick();
        }
    };

    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

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
        <div
            className="border rounded-md p-4 w-full cursor-pointer hover:shadow-md relative"
            onClick={handleCardClick}
        >
            <h3 className="font-bold text-lg mb-2">
                {mcp.name || 'Untitled MCP'}
            </h3>

            {/* Version badge */}
            {mcp.version && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2">
                    v{mcp.version}
                </span>
            )}

            <p className="text-sm text-gray-600 mb-3">
                {mcp.description || 'No description provided'}
            </p>

            {/* Tags display */}
            {mcp.tags && mcp.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {mcp.tags.map((tag: string, index: number) => (
                        <span
                            key={index}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Deployment URL indicator */}
            {mcp.deployment_url && (
                <p className="text-xs text-blue-500 mt-2 flex items-center">
                    <FiExternalLink className="mr-1" />
                    Deployment available
                </p>
            )}

            {editable && (
                <div className="flex justify-end mt-2 delete-action">
                    <button
                        aria-label="Edit MCP"
                        className="p-1 text-gray-500 hover:text-gray-700 mr-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            // You can implement edit functionality here
                            console.log('Edit MCP');
                        }}
                    >
                        <FiEdit />
                    </button>
                    <button
                        aria-label="Delete MCP"
                        className="p-1 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen();
                        }}
                    >
                        <FiTrash2 />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-4">Delete MCP</h2>

                        <div className="mb-6">
                            Are you sure you want to delete "{mcp.name}"? This action cannot be undone.
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                ref={cancelRef}
                                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
