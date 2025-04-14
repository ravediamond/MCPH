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
      Accept: 'application/vnd.github.v3.raw'
      // Optionally include authorization headers if you have a GitHub token:
      // Authorization: `token ${process.env.GITHUB_TOKEN}`,
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

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

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
  }

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

    // Fetch fresh README content from GitHub using owner_username and repository_name if available
    const { readme } = await fetchGithubReadme(
      mcp.repository_url,
      mcp.owner_username,
      mcp.repository_name
    );

    // If the README content hasn't changed, just update the timestamp
    if (readme === mcp.readme) {
      await updateMcpReadme(mcp.id, mcp.readme);
      return { ...mcp, last_refreshed: new Date().toISOString() };
    }

    // Update the README content in Supabase
    const updatedData = await updateMcpReadme(mcp.id, readme);
    return updatedData[0] || { ...mcp, readme, last_refreshed: new Date().toISOString() };
  } catch (error) {
    console.error('Error refreshing README:', error);
    // Return the original MCP if refresh fails
    return mcp;
  }
}