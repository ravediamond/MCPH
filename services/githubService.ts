// Rate limit interface for GitHub API responses
interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

// Import our updated cache utility and rate limiter
import { cacheFetch, invalidateCache, CACHE_REGIONS } from '../utils/cacheUtils';
import { githubRateLimiter } from '../utils/githubRateLimiter';

// Cache TTL constants (in seconds)
const README_CACHE_TTL = 6 * 60 * 60; // 6 hours
const REPO_DETAILS_CACHE_TTL = 2 * 60 * 60; // 2 hours

// Define a GitHub cache region
const GITHUB_REGION = 'github';

/**
 * Extracts rate limit information from GitHub API response headers
 * @param headers Response headers from GitHub API call
 * @returns Rate limit information object or null if headers aren't available
 */
export function extractRateLimitInfo(headers: Headers): GitHubRateLimitInfo | null {
  if (!headers) return null;

  try {
    return {
      limit: parseInt(headers.get('x-ratelimit-limit') || '0', 10),
      remaining: parseInt(headers.get('x-ratelimit-remaining') || '0', 10),
      reset: parseInt(headers.get('x-ratelimit-reset') || '0', 10),
      used: parseInt(headers.get('x-ratelimit-used') || '0', 10),
      resource: headers.get('x-ratelimit-resource') || 'core'
    };
  } catch (error) {
    console.warn('Failed to parse GitHub rate limit headers:', error);
    return null;
  }
}

/**
 * Handle GitHub API response and check for rate limiting
 * @param response Fetch API Response object
 * @returns Response if successful
 * @throws Error with detailed message for rate limit or other API errors
 */
export async function handleGitHubResponse(response: Response): Promise<Response> {
  // Extract rate limit info regardless of success/failure
  const rateLimitInfo = extractRateLimitInfo(response.headers);

  // Update our rate limiter with the latest headers
  if (rateLimitInfo) {
    githubRateLimiter.updateFromHeaders(response.headers);
  }

  if (response.ok) {
    // Log remaining rate limit if it's getting low (less than 10% remaining)
    if (rateLimitInfo && rateLimitInfo.limit > 0 && rateLimitInfo.remaining < rateLimitInfo.limit * 0.1) {
      console.warn(`GitHub API rate limit warning: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining requests`);
    }
    return response;
  }

  // Handle specific error cases
  if (response.status === 403 && rateLimitInfo && rateLimitInfo.remaining === 0) {
    const resetDate = new Date(rateLimitInfo.reset * 1000).toLocaleString();
    throw new Error(
      `GitHub API rate limit exceeded. Limit: ${rateLimitInfo.limit}, ` +
      `Used: ${rateLimitInfo.used}, Reset time: ${resetDate}. ` +
      `Consider adding a GitHub token to increase rate limits.`
    );
  } else if (response.status === 404) {
    throw new Error('GitHub repository or resource not found. Please check the repository URL.');
  } else {
    // For other error types, try to get the detailed message from the response
    try {
      const errorData = await response.json();
      throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`);
    } catch (e) {
      throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
    }
  }
}

/**
 * Creates a cache key for GitHub API requests
 */
function createGitHubCacheKey(type: string, owner: string, repo: string): string {
  return `${type}:${owner}/${repo}`;
}

/**
 * Wrapper for GitHub API requests that applies rate limiting
 * @param apiUrl The GitHub API URL to fetch
 * @param options Fetch options
 * @returns Response from the API
 */
async function githubFetch(apiUrl: string, options: RequestInit = {}): Promise<Response> {
  // Apply rate limit delay before making the request
  await githubRateLimiter.applyRateLimitDelay();

  // Add Authorization header if GitHub token is available
  const headers = {
    ...options.headers,
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `token ${process.env.GITHUB_TOKEN}`
    })
  };

  // Make the request
  const response = await fetch(apiUrl, {
    ...options,
    headers
  });

  // Update rate limiter from response headers
  githubRateLimiter.updateFromHeaders(response.headers);

  // Process and validate the response
  await handleGitHubResponse(response);

  return response;
}

export async function fetchGithubReadme(repositoryUrl: string, ownerUsername?: string, repositoryName?: string): Promise<{ readme: string; ownerUsername: string }> {
  let owner: string;
  let repo: string;

  // If owner and repo name are provided directly, use them
  if (ownerUsername && repositoryName) {
    owner = ownerUsername;
    repo = repositoryName;
  } else {
    // Fall back to parsing from URL for backward compatibility
    const normalizedUrl = repositoryUrl.replace(/\/+$/, '');
    const parts = normalizedUrl.split('/');
    owner = parts[parts.length - 2];
    repo = parts[parts.length - 1];
  }

  // Use the new cache fetch utility
  const readme = await cacheFetch<string>(
    GITHUB_REGION,
    createGitHubCacheKey('readme', owner, repo),
    async () => {
      // This function will only run if cache miss
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
      const response = await githubFetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3.raw'
        }
      });

      return await response.text();
    },
    README_CACHE_TTL
  );

  return { readme, ownerUsername: owner };
}

/**
 * Fetches README content from GitHub for a specific repository
 * @param owner GitHub repository owner username
 * @param repo GitHub repository name
 * @returns Promise resolving to the README content as a string
 */
export async function fetchReadmeFromGitHub(owner: string, repo: string): Promise<string> {
  // Use the new cache fetch utility
  return cacheFetch<string>(
    GITHUB_REGION,
    createGitHubCacheKey('readme', owner, repo),
    async () => {
      // This function will only run if cache miss
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
      const response = await githubFetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3.raw'
        }
      });

      return await response.text();
    },
    README_CACHE_TTL
  );
}

/**
 * Checks if a README needs refreshing based on its last_refreshed timestamp
 * @param lastRefreshed ISO timestamp when the README was last fetched
 * @returns boolean indicating if the README should be refreshed
 */
export function shouldRefreshReadme(lastRefreshed: string | null | undefined): boolean {
  // If there's no last_refreshed timestamp, we should definitely refresh
  if (!lastRefreshed) {
    return true;
  }

  const { README_REFRESH_THRESHOLD_MS } = require('../app/config/constants');

  const lastRefreshedDate = new Date(lastRefreshed);
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const timeDifference = currentDate.getTime() - lastRefreshedDate.getTime();

  // Return true if the README is older than the threshold
  return timeDifference > README_REFRESH_THRESHOLD_MS;
}

/**
 * Updates the README content and refresh timestamp for an MCP in Supabase
 * @param mcpId ID of the MCP to update
 * @param readme New README content
 * @returns Promise resolving to the updated record or error
 */
export async function updateMcpReadme(mcpId: string, readme: string): Promise<any> {
  const { supabase } = require('../lib/supabaseClient');

  const updates = {
    readme,
    last_refreshed: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('mcps')
    .update(updates)
    .eq('id', mcpId)
    .select();

  if (error) {
    console.error('Error updating README in Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Invalidates GitHub cache for a specific repository
 * @param owner GitHub repository owner username
 * @param repo GitHub repository name
 */
export function invalidateGitHubCache(owner: string, repo: string): void {
  // Clear both readme and repo details from cache using new API
  invalidateCache(GITHUB_REGION, createGitHubCacheKey('readme', owner, repo));
  invalidateCache(GITHUB_REGION, createGitHubCacheKey('repo', owner, repo));
}

/**
 * Fetches repository details from GitHub
 * @param owner GitHub repository owner username
 * @param repo GitHub repository name
 * @returns Promise resolving to the repository details
 */
export async function fetchRepoDetails(owner: string, repo: string): Promise<any> {
  // Use the new cache fetch utility
  return cacheFetch<any>(
    GITHUB_REGION,
    createGitHubCacheKey('repo', owner, repo),
    async () => {
      // This function will only run if cache miss
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const response = await githubFetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      return await response.json();
    },
    REPO_DETAILS_CACHE_TTL
  );
}

/**
 * Updates the MCP with repository details like star count
 * @param mcpId ID of the MCP to update
 * @param repoDetails Repository details from GitHub API
 * @returns Promise resolving to the updated record or error
 */
export async function updateMcpRepoDetails(mcpId: string, repoDetails: any): Promise<any> {
  const { supabase } = require('../lib/supabaseClient');

  const updates = {
    stars: repoDetails.stargazers_count,
    forks: repoDetails.forks_count,
    open_issues: repoDetails.open_issues_count,
    last_repo_update: repoDetails.updated_at
  };

  const { data, error } = await supabase
    .from('mcps')
    .update(updates)
    .eq('id', mcpId)
    .select();

  if (error) {
    console.error('Error updating repo details in Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Refreshes the README for an MCP if needed
 * @param mcp MCP object with repository info and last_refreshed
 * @returns Promise resolving to the updated MCP or the original if refresh wasn't needed
 */
export async function refreshReadmeIfNeeded(mcp: any): Promise<any> {
  try {
    // Check if README needs refreshing
    if (!shouldRefreshReadme(mcp.last_refreshed)) {
      return mcp; // README is fresh enough, return the original MCP
    }

    let owner = '';
    let repo = '';

    // Get the owner and repo from the MCP data
    if (mcp.owner_username && mcp.repository_name) {
      owner = mcp.owner_username;
      repo = mcp.repository_name;
    } else if (mcp.repository_url) {
      const githubUrl = mcp.repository_url.replace(/\/+$/, '');
      const parts = githubUrl.split('/');
      owner = parts[parts.length - 2];
      repo = parts[parts.length - 1];
    }

    // Invalidate the cache for this repository to ensure fresh data
    invalidateGitHubCache(owner, repo);

    // Fetch fresh README content from GitHub
    const readme = await fetchReadmeFromGitHub(owner, repo);

    // Update the README content in Supabase
    const updatedData = await updateMcpReadme(mcp.id, readme);

    // Fetch and update repository details including star count
    try {
      const repoDetails = await fetchRepoDetails(owner, repo);
      await updateMcpRepoDetails(mcp.id, repoDetails);

      // Add the star count to the return object
      return {
        ...(updatedData[0] || { ...mcp, readme, last_refreshed: new Date().toISOString() }),
        stars: repoDetails.stargazers_count
      };
    } catch (repoError) {
      console.error('Error fetching repo details:', repoError);
      // Return with updated README but without repo details
      return updatedData[0] || { ...mcp, readme, last_refreshed: new Date().toISOString() };
    }
  } catch (error) {
    console.error('Error refreshing README:', error);
    // Return the original MCP if refresh fails
    return mcp;
  }
}

/**
 * Fetches comprehensive repository data during MCP creation
 * This function fetches the README, star count, and other repo details in one go
 * @param repositoryUrl GitHub repository URL
 * @param ownerUsername Optional owner username (will parse from URL if not provided)
 * @param repositoryName Optional repository name (will parse from URL if not provided)
 * @returns Promise with comprehensive GitHub data (readme, stars, etc.)
 */
export async function fetchComprehensiveRepoData(
  repositoryUrl: string,
  ownerUsername?: string,
  repositoryName?: string
): Promise<{
  readme: string;
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  open_issues: number;
  last_repo_update: string;
  languages: string[];
}> {
  let owner: string;
  let repo: string;

  // If owner and repo name are provided directly, use them
  if (ownerUsername && repositoryName) {
    owner = ownerUsername;
    repo = repositoryName;
  } else {
    // Parse from URL
    try {
      const url = new URL(repositoryUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);

      if (pathParts.length >= 2 && (url.hostname === 'github.com' || url.hostname === 'www.github.com')) {
        owner = pathParts[0];
        repo = pathParts[1];
      } else {
        throw new Error('Invalid GitHub repository URL format');
      }
    } catch (error) {
      // Fallback to basic parsing for backward compatibility
      const normalizedUrl = repositoryUrl.replace(/\/+$/, '');
      const parts = normalizedUrl.split('/');
      owner = parts[parts.length - 2];
      repo = parts[parts.length - 1];
    }
  }

  // Fetch both README and repo details concurrently with rate limiting
  // Use cache to reduce the number of API calls
  const [readme, repoDetails] = await Promise.all([
    fetchReadmeFromGitHub(owner, repo),
    fetchRepoDetails(owner, repo)
  ]);

  // Fetch languages with rate limiting
  let languages: string[] = [];
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;
    const languagesResponse = await githubFetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const languagesData = await languagesResponse.json();
    languages = Object.keys(languagesData);
  } catch (error) {
    console.error(`Error fetching repository languages for ${owner}/${repo}:`, error);
  }

  return {
    readme,
    owner,
    repo,
    stars: repoDetails.stargazers_count || 0,
    forks: repoDetails.forks_count || 0,
    open_issues: repoDetails.open_issues_count || 0,
    last_repo_update: repoDetails.updated_at,
    languages
  };
}

/**
 * Applies GitHub repository data to an MCP object
 * This function enriches an MCP with GitHub data without saving to the database
 * @param mcp The MCP object to enrich
 * @param repoData Repository data from GitHub
 * @returns Enriched MCP object
 */
export function enrichMcpWithRepoData(mcp: any, repoData: any): any {
  return {
    ...mcp,
    readme: repoData.readme,
    owner_username: repoData.owner,
    repository_name: repoData.repo,
    stars: repoData.stars,
    forks: repoData.forks,
    open_issues: repoData.open_issues,
    last_repo_update: repoData.last_repo_update,
    languages: repoData.languages,
    last_refreshed: new Date().toISOString()
  };
}