'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';

interface MCPDetailProps {
    params: { id: string };
}

export default function MCPDetail({ params }: MCPDetailProps) {
    const { id } = params;
    const [mcp, setMCP] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [readme, setReadme] = useState<string>('');
    const [loadingReadme, setLoadingReadme] = useState<boolean>(false);
    const [repoInfo, setRepoInfo] = useState<{
        owner: string;
        repo: string;
        branch: string;
    }>({
        owner: '',
        repo: '',
        branch: 'main', // Adjust if your default branch is different.
    });
    const [repoData, setRepoData] = useState<any>(null);

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
            }
            setLoading(false);
        }
        fetchMCP();
    }, [id]);

    // Once the MCP record is available, extract the owner/repo from the repository URL,
    // then fetch the raw README from GitHub.
    useEffect(() => {
        async function fetchReadme() {
            if (mcp && mcp.repository_url) {
                // Remove any trailing slashes and split the URL.
                const githubUrl = mcp.repository_url.replace(/\/+$/, '');
                const parts = githubUrl.split('/');
                const owner = parts[parts.length - 2];
                const repo = parts[parts.length - 1];
                // Update repoInfo state.
                setRepoInfo({ owner, repo, branch: 'main' });

                // Build the GitHub API URL for the README.
                const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
                setLoadingReadme(true);
                try {
                    const response = await fetch(readmeUrl, {
                        headers: {
                            Accept: 'application/vnd.github.v3.raw',
                        },
                    });
                    if (!response.ok) {
                        console.error('Failed to fetch README:', response.statusText);
                        setReadme('');
                        return;
                    }
                    const content = await response.text();
                    setReadme(content);
                } catch (error) {
                    console.error('Error fetching README:', error);
                    setReadme('');
                } finally {
                    setLoadingReadme(false);
                }
            }
        }
        fetchReadme();
    }, [mcp]);

    // Fetch GitHub repository metadata (metrics) based on repoInfo.
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

    // Custom renderer for Markdown images. Converts relative paths to absolute GitHub raw URLs.
    const renderers = {
        img: ({ node, ...props }: any) => {
            let src: string = props.src || '';
            // If the src doesn't start with "http" or "https", consider it relative.
            if (!src.match(/^(https?:\/\/)/)) {
                src = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${src}`;
            }
            return <img {...props} src={src} alt={props.alt} className="max-w-full" />;
        },
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    if (!mcp) {
        return (
            <div className="p-8 text-center">
                <p>MCP not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-screen-lg mx-auto py-16 px-4">
            {/* MCP Basic Information */}
            <h1 className="text-3xl font-bold mb-4">
                {mcp.title || 'MCP Detail'}
            </h1>
            <p className="mb-4">{mcp.description || 'No description available.'}</p>
            <p className="text-sm text-gray-600 mb-4">
                GitHub Repository: <a href={mcp.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{mcp.repository_url}</a>
            </p>

            {/* Repository Metrics section styled similar to PyPI */}
            <div className="my-8 p-6 border border-gray-200 rounded-md shadow-sm bg-gray-50">
                <h3 className="text-lg font-medium mb-4">
                    Repository Metrics
                </h3>
                {repoData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <p>
                            <strong>Stars:</strong> {repoData.stargazers_count}
                        </p>
                        <p>
                            <strong>Forks:</strong> {repoData.forks_count}
                        </p>
                        <p>
                            <strong>Open Issues:</strong> {repoData.open_issues_count}
                        </p>
                        <p>
                            <strong>Watchers:</strong>{' '}
                            {repoData.subscribers_count || repoData.watchers_count}
                        </p>
                        <p>
                            <strong>Primary Language:</strong>{' '}
                            {repoData.language || 'N/A'}
                        </p>
                        <p>
                            <strong>License:</strong>{' '}
                            {repoData.license?.spdx_id || 'None'}
                        </p>
                        <p>
                            <strong>Last Updated:</strong>{' '}
                            {new Date(repoData.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                ) : (
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                )}
            </div>

            {/* README display */}
            {loadingReadme ? (
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            ) : readme ? (
                <div className="mt-8 markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                        {readme}
                    </ReactMarkdown>
                </div>
            ) : (
                <p>No README available.</p>
            )}
        </div>
    );
}
