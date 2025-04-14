export async function fetchGithubReadme(repositoryUrl: string): Promise<{ readme: string; ownerUsername: string }> {
    // Normalize the URL and extract owner and repo names
    const normalizedUrl = repositoryUrl.replace(/\/+$/, '');
    const parts = normalizedUrl.split('/');
    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1];
  
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