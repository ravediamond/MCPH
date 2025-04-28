import { Octokit } from "@octokit/rest";

// Initialize Octokit with GitHub token if available
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
});

/**
 * Fetch GitHub repository data
 * @param owner Repository owner
 * @param repo Repository name
 * @returns Repository data including stars, forks, etc.
 */
export async function getRepositoryData(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      updatedAt: data.updated_at,
      url: data.html_url,
    };
  } catch (error) {
    console.error(`Error fetching repository data for ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Fetch README content for a repository
 * @param owner Repository owner
 * @param repo Repository name
 * @returns README content as string
 */
export async function getReadmeContent(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: "raw",
      },
    });

    return data.toString();
  } catch (error) {
    console.error(`Error fetching README for ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Fetch latest releases for a repository
 * @param owner Repository owner
 * @param repo Repository name
 * @param limit Number of releases to fetch
 * @returns Array of releases
 */
export async function getRepositoryReleases(owner: string, repo: string, limit = 5) {
  try {
    const { data } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: limit,
    });

    return data.map(release => ({
      name: release.name,
      tagName: release.tag_name,
      publishedAt: release.published_at,
      body: release.body,
      url: release.html_url,
    }));
  } catch (error) {
    console.error(`Error fetching releases for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Parse GitHub URL into owner and repo
 * @param url GitHub repository URL
 * @returns Object with owner and repo
 */
export function parseGitHubUrl(url: string) {
  try {
    const urlObj = new URL(url);
    const [, owner, repo] = urlObj.pathname.split('/');
    return { owner, repo };
  } catch (error) {
    console.error(`Error parsing GitHub URL ${url}:`, error);
    return null;
  }
}
