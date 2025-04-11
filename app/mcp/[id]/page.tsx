'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';
import { FaStar, FaCodeBranch, FaExclamationCircle, FaEye, FaCode, FaFileAlt, FaCalendarAlt, FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

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

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-10 px-4 shadow-md">
                <div className="max-w-screen-xl mx-auto">
                    <h1 className="text-4xl font-bold mb-4">
                        {mcp.title || 'MCP Detail'}
                    </h1>
                    <p className="text-lg mb-4 opacity-90 max-w-3xl">{mcp.description || 'No description available.'}</p>
                    <a
                        href={mcp.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-blue-800 px-4 py-2 rounded-md hover:bg-opacity-90 transition duration-200"
                    >
                        <FaGithub className="text-xl" /> View on GitHub <FaExternalLinkAlt className="ml-1 text-sm" />
                    </a>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 mt-8">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    {/* Sidebar with Metrics */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
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
                                        <span className="font-semibold">{(repoData.subscribers_count || repoData.watchers_count).toLocaleString()}</span>
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
                    </div>

                    {/* README display */}
                    <div className="lg:col-span-2 mt-8 lg:mt-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaFileAlt /> README
                                </h3>
                            </div>
                            <div className="p-6">
                                {loadingReadme ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : readme ? (
                                    <div className="markdown-body bg-transparent border-0 prose prose-blue max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                                            {readme}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <FaFileAlt className="mx-auto text-4xl mb-4 opacity-30" />
                                        <p>No README available for this repository.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
