// Rate limit interface for GitHub API responses
interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

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

  // Build the GitHub API URL for the README endpoint
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3.raw',
      // Use GitHub token if available for higher rate limits
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `token ${process.env.GITHUB_TOKEN}`
      })
    }
  });

  // Process the response with the new handler
  await handleGitHubResponse(response);

  const readme = await response.text();
  return { readme, ownerUsername: owner };
}

/**
 * Fetches README content from GitHub for a specific repository
 * @param owner GitHub repository owner username
 * @param repo GitHub repository name
 * @returns Promise resolving to the README content as a string
 */
export async function fetchReadmeFromGitHub(owner: string, repo: string): Promise<string> {
  // Build the GitHub API URL for the README endpoint
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3.raw',
      // Use GitHub token if available for higher rate limits
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `token ${process.env.GITHUB_TOKEN}`
      })
    }
  });

  // Process the response with the new handler
  await handleGitHubResponse(response);

  return await response.text();
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
 * Fetches repository details from GitHub
 * @param owner GitHub repository owner username
 * @param repo GitHub repository name
 * @returns Promise resolving to the repository details
 */
export async function fetchRepoDetails(owner: string, repo: string): Promise<any> {
  // Build the GitHub API URL for the repo endpoint
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      // Use GitHub token if available for higher rate limits
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `token ${process.env.GITHUB_TOKEN}`
      })
    }
  });

  // Process the response with the handler
  await handleGitHubResponse(response);

  return await response.json();
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

    // Fetch fresh README content from GitHub
    const { readme } = await fetchGithubReadme(
      mcp.repository_url,
      owner,
      repo
    );

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