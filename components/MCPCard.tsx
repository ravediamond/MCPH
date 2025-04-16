import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { FaGithub, FaStar, FaEye } from 'react-icons/fa';

interface MCPCardProps {
  mcp: any;
  onClick: () => void;
  editable?: boolean;
  onDelete?: (id: string) => void;
}

export default function MCPCard({
  mcp,
  onClick,
  editable,
  onDelete,
}: MCPCardProps) {
  // Prevent triggering card click when clicking on action buttons.
  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.action-button')) {
      onClick();
    }
  };

  // Process tags to separate them by type
  const processTags = () => {
    if (!mcp.tags || !Array.isArray(mcp.tags) || mcp.tags.length === 0) {
      return {
        domainTags: [],
        deploymentTags: [],
        providerTags: [],
        customTags: [],
      };
    }

    return {
      domainTags: mcp.tags.filter((tag: string) => tag.startsWith('domain:')).map((tag: string) => tag.replace('domain:', '')),
      deploymentTags: mcp.tags.filter((tag: string) => tag.startsWith('deployment:')).map((tag: string) => tag.replace('deployment:', '')),
      providerTags: mcp.tags.filter((tag: string) => tag.startsWith('provider:')).map((tag: string) => tag.replace('provider:', '')),
      customTags: mcp.tags.filter((tag: string) => !tag.startsWith('domain:') && !tag.startsWith('deployment:') && !tag.startsWith('provider:')),
    };
  };

  // Use the processTags function to get categorized tags.
  const { domainTags, deploymentTags, providerTags, customTags } = processTags();

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-200 overflow-hidden cursor-pointer relative group border border-gray-200"
      onClick={handleCardClick}
    >
      {/* Card Content */}
      <div className="p-5">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors duration-200">
          {mcp.name}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{mcp.description}</p>

        {/* Tags */}
        <div className="mb-4 space-y-2">
          {/* Domain Tags */}
          {domainTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {domainTags.map((tag: string, index: number) => (
                <span
                  key={`domain-${index}`}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Deployment Tags */}
          {deploymentTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {deploymentTags.map((tag: string, index: number) => (
                <span
                  key={`deployment-${index}`}
                  className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Provider Tags */}
          {providerTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {providerTags.map((tag: string, index: number) => (
                <span
                  key={`provider-${index}`}
                  className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Custom Tags */}
          {customTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {customTags.map((tag: string, index: number) => (
                <span
                  key={`custom-${index}`}
                  className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Repository Info */}
        {mcp.repository_url && (
          <a
            href={mcp.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary-500 transition-colors mb-3 flex items-center gap-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <FaGithub /> {mcp.owner_username}/{mcp.repository_name}{' '}
            <FiExternalLink size={14} />
          </a>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-sm">
          {mcp.avg_rating !== undefined && mcp.avg_rating !== null && (
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-400" size={16} />
              <span className="text-gray-600">
                {mcp.avg_rating.toFixed(1)}
              </span>
            </div>
          )}

          {mcp.stars !== undefined && (
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-400" size={16} />
              <span className="text-gray-600">
                {mcp.stars} {mcp.stars === 1 ? 'star' : 'stars'}
              </span>
            </div>
          )}

          {mcp.view_count !== undefined && (
            <div className="flex items-center gap-1">
              <FaEye className="text-gray-400" size={16} />
              <span className="text-gray-600">
                {mcp.view_count} {mcp.view_count === 1 ? 'view' : 'views'}
              </span>
            </div>
          )}
        </div>

        {/* Editable Action Buttons */}
        {editable && (
          <div className="absolute top-2 right-2 flex gap-2 action-button">
            <button
              aria-label="Edit MCP"
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                // If edit functionality is needed later, implement it here.
                console.log('Edit MCP');
              }}
            >
              {/* You can add an edit icon here if desired */}
            </button>
            {onDelete && (
              <button
                aria-label="Delete MCP"
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(mcp.id);
                }}
              >
                {/* You can add a delete icon here if desired */}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}