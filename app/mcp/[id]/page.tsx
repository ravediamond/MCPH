'use client';

import { useEffect, useState, useRef } from 'react';
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
  FaCheckCircle,
  FaComment,
  FaTrashAlt,
  FaThumbsUp
} from 'react-icons/fa';
import { refreshReadmeIfNeeded } from 'services/githubService';
import { MCP } from 'types/mcp';
// Import SupabaseProvider
import SupabaseProvider from 'app/supabase-provider';
import { useRouter } from 'next/navigation';

// Import the CSS for the dark theme
import styles from './markdown-dark.module.css';

// Import components
import Reviews from 'components/Reviews';

interface MCPDetailProps {
  params: { id: string };
}

export default function MCPDetail({ params }: MCPDetailProps) {
  // Get the ID from params directly - don't use React.use() in client components
  const id = params.id;

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
  const [activeTab, setActiveTab] = useState<'readme' | 'reviews'>('readme');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const cancelRef = useRef(null);
  const router = useRouter();

  // Fetch the current user session
  useEffect(() => {
    async function fetchUserSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);

        // Get the user's GitHub identity if they're logged in
        if (session.user) {
          try {
            // Using a more compatible way to query identities
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            // If there's profile data, see if we can extract GitHub username another way
            if (!error && data) {
              // If you have a field in profiles for GitHub username, use username as fallback
              setCurrentUser({
                ...session.user,
                githubUsername: data.username // Using username field which exists in profiles table
              });

              // Check if the user is an admin
              setIsAdminUser(!!data?.is_admin);
            }
          } catch (identityError) {
            console.error('Error fetching user identity:', identityError);
          }
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
        // Use type assertion to ensure TypeScript understands this is an MCP
        setMCP(data as unknown as MCP);

        // Refresh the README if needed.
        try {
          setRefreshing(true);
          const refreshedMcp = await refreshReadmeIfNeeded(data);
          if (refreshedMcp !== data) {
            setMCP(refreshedMcp as unknown as MCP);
          }

          // Increment view count and update the MCP state with the new view count
          await incrementViewCount(id);
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

  // Function to handle MCP deletion
  const handleDeleteMCP = async () => {
    if (!mcp || !mcp.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('mcps')
        .delete()
        .eq('id', mcp.id);

      if (error) {
        console.error('Error deleting MCP:', error);
        alert('Failed to delete MCP. Please try again.');
      } else {
        setIsDeleteModalOpen(false);
        // Redirect to dashboard or homepage after deletion
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to increment view count
  const incrementViewCount = async (mcpId: string) => {
    try {
      console.log('Incrementing view count for MCP:', mcpId);
      const response = await fetch('/api/mcps/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mcpId })
      });

      const data = await response.json();
      console.log('View count response:', data);

      // If the call was successful and we got a new view count, update the state
      if (data.success && data.viewCount !== undefined) {
        setMCP(prevMcp => {
          if (!prevMcp) return prevMcp;
          return {
            ...prevMcp,
            view_count: data.viewCount
          } as MCP;
        });
      }

      return data;
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

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

  // Fetch repository metadata from the database, not from GitHub API
  useEffect(() => {
    async function fetchRepoData() {
      if (mcp) {
        try {
          // Instead of calling GitHub API, just use the values from the database
          setRepoData({
            stargazers_count: mcp.stars || 0,
            forks_count: mcp.forks || 0,
            open_issues_count: mcp.open_issues || 0,
            updated_at: mcp.last_repo_update || new Date().toISOString(),
            language: mcp.languages ? mcp.languages[0] : null,
            license: { spdx_id: "None" }, // Use a default value since license property doesn't exist in MCP type
            subscribers_count: 0, // Default since watchers property doesn't exist in MCP type
            watchers_count: 0,  // Default since watchers property doesn't exist in MCP type
          });
          setRefreshing(false);
        } catch (error) {
          console.error('Error setting repository data:', error);
          // Set minimal data as fallback
          setRepoData({
            stargazers_count: 0,
            forks_count: 0,
            open_issues_count: 0,
            updated_at: null,
            language: null,
            license: { spdx_id: "None" },
            subscribers_count: 0,
            watchers_count: 0,
          });
          setRefreshing(false);
        }
      } else {
        // If we don't have MCP data, set empty repo data
        setRepoData({
          stargazers_count: 0,
          forks_count: 0,
          open_issues_count: 0,
          updated_at: null,
          language: null,
          license: { spdx_id: "None" },
          subscribers_count: 0,
          watchers_count: 0,
        });
      }
    }
    fetchRepoData();
  }, [mcp]);

  // Custom Markdown components with a proper image renderer
  // that resolves relative image paths to absolute GitHub raw URLs.
  const components = {
    img: (props: any) => {
      const { src, alt, ...rest } = props;
      let imageSrc: string = src || '';
      if (!imageSrc.match(/^(https?:\/\/)/)) {
        imageSrc = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${imageSrc}`;
      }
      return <img src={imageSrc} alt={alt || ''} className="max-w-full rounded-md" {...rest} />;
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 font-medium">Loading MCP details...</p>
        </div>
      </div>
    );
  }

  if (!mcp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-900">
        <div className="bg-gray-800 shadow-md rounded-lg p-6 text-center max-w-md">
          <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
          <h2 className="text-xl font-bold text-gray-100 mb-2">MCP Not Found</h2>
          <p className="text-gray-300">The requested MCP could not be found. Please check the ID and try again.</p>
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

  // Determine if the user can delete the MCP (owner or admin)
  const canDeleteMCP = isAdminUser || (mcp.claimed && isClaimedByCurrentUser) || (!mcp.claimed && isOwner);

  return (
    <div className="bg-gray-900 min-h-screen pb-16 text-gray-200">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 px-4 shadow-lg relative overflow-hidden border-b border-gray-700">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        {/* Accent line at the top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{mcp.name || 'MCP Detail'}</h1>
              <p className="text-lg mb-5 opacity-90 max-w-3xl text-gray-200">
                {mcp.description || 'No description available.'}
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <a
                  href={mcp.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-all duration-300 backdrop-blur-sm border border-white/10"
                >
                  <FaGithub className="text-xl" /> View on GitHub <FaExternalLinkAlt className="ml-1 text-sm" />
                </a>

                {/* Claim MCP Button */}
                {isClaimable && (
                  <button
                    onClick={handleClaimMCP}
                    disabled={claimLoading}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-300 disabled:opacity-50 border border-green-500"
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
                  <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-200 px-4 py-2 rounded-md border border-green-500/30 backdrop-blur-sm">
                    <FaCheckCircle className="text-lg" /> You've claimed this MCP
                  </div>
                )}

                {mcp.claimed && !isClaimedByCurrentUser && (
                  <div className="inline-flex items-center gap-2 bg-blue-900/30 text-blue-200 px-4 py-2 rounded-md border border-blue-500/30 backdrop-blur-sm">
                    <FaCheckCircle className="text-lg" /> Claimed by author
                  </div>
                )}
              </div>
            </div>

            {/* Delete button - Only shown to owner or admin */}
            {canDeleteMCP && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 border border-red-500/50"
                aria-label="Delete MCP"
              >
                <FaTrashAlt /> Delete MCP
              </button>
            )}
          </div>

          {/* Error message */}
          {claimError && (
            <div className="mt-3 p-3 bg-red-900/50 text-red-200 rounded-md border border-red-500/50">
              <p className="font-medium">Error: {claimError}</p>
            </div>
          )}

          {/* Tags Section */}
          {mcp.tags && mcp.tags.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                {mcp.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-100 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Sidebar with Repository Metrics */}
          <div className="lg:col-span-1">
            {/* Repository Info Panel */}
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden mb-6">
              <div className="p-5 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                  <FaGithub /> Repository Info
                </h3>
              </div>
              {repoData ? (
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-300 gap-2">
                      <FaEye className="text-blue-400" />
                      <span>Views</span>
                    </div>
                    <span className="font-semibold text-gray-200">{mcp.view_count?.toLocaleString() || '0'}</span>
                  </div>

                  {/* Rating Info */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-300 gap-2">
                      <FaThumbsUp className="text-green-400" />
                      <span>Rating</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold mr-1 text-gray-200">
                        {mcp.avg_rating ? mcp.avg_rating.toFixed(1) : 'N/A'}
                      </span>
                      {mcp.review_count ? (
                        <span className="text-xs text-gray-400">
                          ({mcp.review_count} {mcp.review_count === 1 ? 'review' : 'reviews'})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-300 gap-2">
                      <FaStar className="text-yellow-400" />
                      <span>Stars</span>
                    </div>
                    <span className="font-semibold text-gray-200">{repoData.stargazers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-300 gap-2">
                      <FaCodeBranch className="text-green-400" />
                      <span>Forks</span>
                    </div>
                    <span className="font-semibold text-gray-200">{repoData.forks_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-300 gap-2">
                      <FaExclamationCircle className="text-orange-400" />
                      <span>Issues</span>
                    </div>
                    <span className="font-semibold text-gray-200">{repoData.open_issues_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-300 gap-2">
                      <FaEye className="text-purple-400" />
                      <span>GitHub Watchers</span>
                    </div>
                    <span className="font-semibold text-gray-200">
                      {(repoData.subscribers_count || repoData.watchers_count).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center text-gray-300 gap-2">
                        <FaCode />
                        <span>Language</span>
                      </div>
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-200 text-sm rounded-full font-medium border border-blue-700/30">
                        {repoData.language || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center text-gray-300 gap-2">
                        <FaFileAlt />
                        <span>License</span>
                      </div>
                      <span className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-full font-medium border border-gray-600">
                        {repoData.license?.spdx_id || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-300 gap-2">
                        <FaCalendarAlt />
                        <span>Updated</span>
                      </div>
                      <span className="text-gray-200 font-medium">
                        {new Date(repoData.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Right side content with tabs for README and Reviews */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-4">
              <button
                onClick={() => setActiveTab('readme')}
                className={`px-5 py-3 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === 'readme'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-blue-400'
                  }`}
              >
                <FaFileAlt className="mr-2" /> README
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-5 py-3 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === 'reviews'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-blue-400'
                  }`}
              >
                <FaComment className="mr-2" /> Reviews {mcp.review_count ? `(${mcp.review_count})` : ''}
              </button>
            </div>

            {/* README Tab Content */}
            {activeTab === 'readme' && (
              <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                    <FaFileAlt /> README
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      Last updated: {formatRefreshDate(lastRefreshed)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  {refreshing && !readme && (
                    <div className="flex justify-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300">Fetching latest README...</p>
                      </div>
                    </div>
                  )}
                  {readme ? (
                    <div className={`markdown-body bg-transparent border-0 prose prose-invert prose-blue max-w-none ${styles['markdown-dark']}`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={components}
                      >
                        {readme}
                      </ReactMarkdown>
                    </div>
                  ) : !refreshing ? (
                    <div className="text-center py-12 text-gray-400">
                      <FaFileAlt className="mx-auto text-4xl mb-4 opacity-30" />
                      <p>No README available for this repository.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Reviews Tab Content */}
            {activeTab === 'reviews' && (
              <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                    <FaComment /> Reviews & Feedback
                  </h3>
                </div>
                <div className="p-5">
                  {mcp && mcp.id && (
                    <SupabaseProvider>
                      <Reviews mcpId={mcp.id} />
                    </SupabaseProvider>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-700">
            <h2 className="text-lg font-bold mb-4 text-gray-100">Delete MCP</h2>
            <p className="mb-6 text-gray-300">
              Are you sure you want to delete "{mcp.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                onClick={handleDeleteMCP}
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
