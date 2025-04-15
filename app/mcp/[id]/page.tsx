'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';
import {
  FaStar,
  FaCodeBranch,
  FaExclamationCircle,
  FaEye,
  FaCode,
  FaFileAlt,
  FaCalendarAlt,
  FaGithub,
  FaExternalLinkAlt,
  FaSync,
  FaCheckCircle
} from 'react-icons/fa';
import { refreshReadmeIfNeeded } from 'services/githubService';
import { MCP } from 'types/mcp';

// Import the CSS for the dark theme
import styles from './markdown-dark.module.css';

// Import the new component
import VersionHistoryPanel from 'components/VersionHistoryPanel';

interface MCPDetailProps {
  params: { id: string };
}

export default function MCPDetail({ params }: MCPDetailProps) {
  const { id } = params;
  const [mcp, setMCP] = useState<MCP | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [readme, setReadme] = useState<string>('');
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    repo: string;
    branch: string;
  }>({
    owner: '',
    repo: '',
    branch: 'main', // Default branch; update as needed.
  });
  const [repoData, setRepoData] = useState<any>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [claimLoading, setClaimLoading] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  // Fetch the current user session
  useEffect(() => {
    async function fetchUserSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);

        // Get the user's GitHub identity if they're logged in
        if (session.user) {
          const { data: identities, error } = await supabase
            .from('identities')
            .select('identity_data')
            .eq('user_id', session.user.id)
            .eq('provider', 'github')
            .single();

          if (!error && identities) {
            const githubUsername = identities.identity_data.user_name;
            // Store the GitHub username in the user object
            setCurrentUser({
              ...session.user,
              githubUsername
            });
          }

          // Check if the user is an admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          setIsAdminUser(!!profile?.is_admin);
        }
      }
    }

    fetchUserSession();
  }, []);

  // Fetch the MCP record from Supabase.
  useEffect(() => {
    async function fetchMCP() {
      const { data, error } = await supabase
        .from('mcps')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching MCP:', error);
      } else {
        setMCP(data);

        // Refresh the README if needed.
        try {
          setRefreshing(true);
          const refreshedMcp = await refreshReadmeIfNeeded(data);
          if (refreshedMcp !== data) {
            setMCP(refreshedMcp);
          }
        } catch (refreshError) {
          console.error('Error refreshing README:', refreshError);
        } finally {
          setRefreshing(false);
        }
      }
      setLoading(false);
    }
    fetchMCP();
  }, [id]);

  // Check if the current user is the owner of this MCP's repository
  useEffect(() => {
    if (mcp && currentUser && currentUser.githubUsername) {
      setIsOwner(currentUser.githubUsername === mcp.owner_username);
    }
  }, [mcp, currentUser]);

  // Extract repository information: use dedicated fields if available,
  // otherwise parse the repository_url.
  useEffect(() => {
    if (mcp) {
      let owner = '';
      let repo = '';

      if (mcp.owner_username && mcp.repository_name) {
        owner = mcp.owner_username;
        repo = mcp.repository_name;
      } else if (mcp.repository_url) {
        const githubUrl = mcp.repository_url.replace(/\/+$/, '');
        const parts = githubUrl.split('/');
        owner = parts[parts.length - 2];
        repo = parts[parts.length - 1];
      }

      setRepoInfo({ owner, repo, branch: 'main' });
      setReadme(mcp.readme || '');
      setLastRefreshed(mcp.last_refreshed || null);
    }
  }, [mcp]);

  // Function to handle claiming an MCP
  const handleClaimMCP = async () => {
    if (!mcp || !currentUser || !isOwner) return;

    setClaimLoading(true);
    setClaimError(null);

    try {
      const response = await fetch('/api/mcps/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mcpId: mcp.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim MCP');
      }

      // Update the local state with the claimed MCP
      setMCP({
        ...mcp,
        claimed: true,
        user_id: currentUser.id
      });

    } catch (error) {
      console.error('Error claiming MCP:', error);
      setClaimError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setClaimLoading(false);
    }
  };

  // Fetch GitHub repository metadata based on repoInfo.
  useEffect(() => {
    async function fetchRepoData() {
      if (repoInfo.owner && repoInfo.repo) {
        const repoUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`;
        try {
          const response = await fetch(repoUrl);
          if (!response.ok) {
            console.error('Error fetching repository data:', response.statusText);
            return;
          }
          const data = await response.json();
          setRepoData(data);
        } catch (error) {
          console.error('Error fetching repository data:', error);
        }
      }
    }
    fetchRepoData();
  }, [repoInfo]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (!mcp || refreshing) return;

    try {
      setRefreshing(true);
      // Force a refresh by setting last_refreshed to null.
      const refreshedMcp = await refreshReadmeIfNeeded({
        ...mcp,
        last_refreshed: null
      });
      setMCP(refreshedMcp);
      setReadme(refreshedMcp.readme || '');
      setLastRefreshed(refreshedMcp.last_refreshed || null);
    } catch (error) {
      console.error('Error manually refreshing README:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Custom Markdown image renderer that resolves relative image paths
  // to absolute GitHub raw URLs.
  const renderers = {
    img: ({ node, ...props }: any) => {
      let src: string = props.src || '';
      if (!src.match(/^(https?:\/\/)/)) {
        src = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${src}`;
      }
      return <img {...props} src={src} alt={props.alt} className="max-w-full rounded-md" />;
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading MCP details...</p>
        </div>
      </div>
    );
  }

  if (!mcp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white shadow-md rounded-lg p-6 text-center max-w-md">
          <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">MCP Not Found</h2>
          <p className="text-gray-600">The requested MCP could not be found. Please check the ID and try again.</p>
        </div>
      </div>
    );
  }

  // Format the last refreshed date.
  const formatRefreshDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Determine if the current MCP is claimable by the user
  const isClaimable = isOwner && currentUser && !mcp.claimed;
  const isClaimedByCurrentUser = mcp.claimed && currentUser && mcp.user_id === currentUser.id;

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-10 px-4 shadow-md">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{mcp.name || 'MCP Detail'}</h1>
          <p className="text-lg mb-4 opacity-90 max-w-3xl">
            {mcp.description || 'No description available.'}
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <a
              href={mcp.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-800 px-4 py-2 rounded-md hover:bg-opacity-90 transition duration-200"
            >
              <FaGithub className="text-xl" /> View on GitHub <FaExternalLinkAlt className="ml-1 text-sm" />
            </a>

            {/* Claim MCP Button */}
            {isClaimable && (
              <button
                onClick={handleClaimMCP}
                disabled={claimLoading}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
              >
                {claimLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="text-lg" /> Claim this MCP
                  </>
                )}
              </button>
            )}

            {/* Claimed Status */}
            {isClaimedByCurrentUser && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-md">
                <FaCheckCircle className="text-lg" /> You've claimed this MCP
              </div>
            )}

            {mcp.claimed && !isClaimedByCurrentUser && (
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-md">
                <FaCheckCircle className="text-lg" /> Claimed by author
              </div>
            )}
          </div>

          {/* Error message */}
          {claimError && (
            <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-md">
              <p className="font-medium">Error: {claimError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 mt-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Sidebar with Repository Metrics and Version History */}
          <div className="lg:col-span-1">
            {/* Repository Info Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaGithub /> Repository Info
                </h3>
              </div>
              {repoData ? (
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-700 gap-2">
                      <FaStar className="text-yellow-500" />
                      <span>Stars</span>
                    </div>
                    <span className="font-semibold">{repoData.stargazers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-700 gap-2">
                      <FaCodeBranch className="text-green-600" />
                      <span>Forks</span>
                    </div>
                    <span className="font-semibold">{repoData.forks_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-700 gap-2">
                      <FaExclamationCircle className="text-orange-500" />
                      <span>Issues</span>
                    </div>
                    <span className="font-semibold">{repoData.open_issues_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-700 gap-2">
                      <FaEye className="text-blue-600" />
                      <span>Watchers</span>
                    </div>
                    <span className="font-semibold">
                      {(repoData.subscribers_count || repoData.watchers_count).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center text-gray-700 gap-2">
                        <FaCode />
                        <span>Language</span>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                        {repoData.language || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center text-gray-700 gap-2">
                        <FaFileAlt />
                        <span>License</span>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium">
                        {repoData.license?.spdx_id || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-700 gap-2">
                        <FaCalendarAlt />
                        <span>Updated</span>
                      </div>
                      <span className="text-gray-800 font-medium">
                        {new Date(repoData.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex justify-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Version History Panel - Moved to the left */}
            {mcp && mcp.id && (
              <VersionHistoryPanel
                mcpId={mcp.id}
                currentVersion={mcp.version}
                isOwner={isClaimedByCurrentUser}
                isAdmin={isAdminUser}
              />
            )}
          </div>

          {/* README Display Section - Now takes the right side */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaFileAlt /> README
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    Last updated: {formatRefreshDate(lastRefreshed)}
                  </span>
                  <button
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                    title="Refresh README from GitHub"
                  >
                    <FaSync className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {refreshing && !readme && (
                  <div className="flex justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">Fetching latest README...</p>
                    </div>
                  </div>
                )}
                {readme ? (
                  <div className={`markdown-body bg-transparent border-0 prose prose-blue max-w-none ${styles['markdown-dark']}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                      {readme}
                    </ReactMarkdown>
                  </div>
                ) : !refreshing ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaFileAlt className="mx-auto text-4xl mb-4 opacity-30" />
                    <p>No README available for this repository.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
