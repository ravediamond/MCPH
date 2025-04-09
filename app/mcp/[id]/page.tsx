'use client';

import { useEffect, useState } from 'react';
import { supabase } from 'lib/supabaseClient';
import {
    Box,
    Container,
    Heading,
    Text,
    Spinner,
    SimpleGrid,
} from '@chakra-ui/react';
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
            return <img {...props} src={src} alt={props.alt} style={{ maxWidth: '100%' }} />;
        },
    };

    if (loading) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (!mcp) {
        return (
            <Box p={8} textAlign="center">
                <Text>MCP not found.</Text>
            </Box>
        );
    }

    return (
        <Container maxW="container.lg" py={16}>
            {/* MCP Basic Information */}
            <Heading as="h1" mb={4}>
                {mcp.title || 'MCP Detail'}
            </Heading>
            <Text mb={4}>{mcp.description || 'No description available.'}</Text>
            <Text fontSize="sm" color="gray.600" mb={4}>
                GitHub Repository: <a href={mcp.repository_url} target="_blank" rel="noopener noreferrer">{mcp.repository_url}</a>
            </Text>

            {/* Repository Metrics section styled similar to PyPI */}
            <Box
                my={8}
                p={6}
                borderWidth="1px"
                borderRadius="md"
                boxShadow="sm"
                bg="gray.50"
            >
                <Heading as="h3" size="md" mb={4}>
                    Repository Metrics
                </Heading>
                {repoData ? (
                    <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                        <Text>
                            <strong>Stars:</strong> {repoData.stargazers_count}
                        </Text>
                        <Text>
                            <strong>Forks:</strong> {repoData.forks_count}
                        </Text>
                        <Text>
                            <strong>Open Issues:</strong> {repoData.open_issues_count}
                        </Text>
                        <Text>
                            <strong>Watchers:</strong>{' '}
                            {repoData.subscribers_count || repoData.watchers_count}
                        </Text>
                        <Text>
                            <strong>Primary Language:</strong>{' '}
                            {repoData.language || 'N/A'}
                        </Text>
                        <Text>
                            <strong>License:</strong>{' '}
                            {repoData.license?.spdx_id || 'None'}
                        </Text>
                        <Text>
                            <strong>Last Updated:</strong>{' '}
                            {new Date(repoData.updated_at).toLocaleDateString()}
                        </Text>
                    </SimpleGrid>
                ) : (
                    <Spinner size="sm" />
                )}
            </Box>

            {/* README display */}
            {loadingReadme ? (
                <Spinner size="lg" />
            ) : readme ? (
                <Box mt={8} className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                        {readme}
                    </ReactMarkdown>
                </Box>
            ) : (
                <Text>No README available.</Text>
            )}
        </Container>
    );
}
