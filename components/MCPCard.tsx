import React, { useState, useRef } from 'react';
import { FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { FaGithub, FaStar } from 'react-icons/fa';
import { supabase } from 'lib/supabaseClient';

interface MCPCardProps {
  mcp: any;
  onClick: () => void;
  editable?: boolean;
  onDelete?: () => void;
}

export default function MCPCard({
  mcp,
  onClick,
  editable,
  onDelete,
}: MCPCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const cancelRef = useRef(null);

  // Prevent triggering card click when clicking on action buttons.
  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.action-button')) {
      onClick();
    }
  };

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  // Handle delete confirmation.
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
      className="relative bg-white border border-gray-200 rounded-xl p-6 w-full cursor-pointer transition-all hover:shadow-lg overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Top row: Name and Version */}
      <div className="flex items-start justify-between flex-wrap">
        <h3 className="font-bold text-gray-800 text-lg break-words max-w-full">
          {mcp.name || 'Untitled MCP'}
        </h3>
        {mcp.version && (
          <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mt-2 md:mt-0 ml-auto md:ml-2">
            v{mcp.version}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 mt-3 text-base break-words">
        {mcp.description || 'No description provided'}
      </p>

      {/* Tags */}
      {mcp.tags && mcp.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mcp.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded-full break-words"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Repository and Deployment Links with Author */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-4 flex-wrap">
          {mcp.repository_url && (
            <a
              href={mcp.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-base flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <FaGithub size={20} />
              <span>Repository</span>
            </a>
          )}
          {mcp.deployment_url && (
            <a
              href={mcp.deployment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-base flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <FiExternalLink size={20} />
              <span>Deployment</span>
            </a>
          )}
        </div>
        {mcp.author && (
          <p className="text-sm text-gray-500 break-all">by {mcp.author}</p>
        )}
      </div>

      {/* Additional Repository Data: Number of Stars */}
      {mcp.stars !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          <FaStar className="text-yellow-500" size={18} />
          <span className="text-sm text-gray-700">
            {mcp.stars} {mcp.stars === 1 ? 'star' : 'stars'}
          </span>
        </div>
      )}

      {/* Editable Action Buttons */}
      {editable && (
        <div className="absolute top-2 right-2 flex gap-2 action-button">
          <button
            aria-label="Edit MCP"
            className="p-1 text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              // If edit functionality is needed later, implement it here.
              console.log('Edit MCP');
            }}
          >
            {/* You can add an edit icon here if desired */}
          </button>
          <button
            aria-label="Delete MCP"
            className="p-1 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            <FiTrash2 size={20} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Delete MCP</h2>
            <p className="mb-6">
              Are you sure you want to delete "{mcp.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  isDeleting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
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