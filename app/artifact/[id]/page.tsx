'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    FaFileDownload, FaFile, FaClock, FaCalendarAlt,
    FaExclamationTriangle, FaCheck, FaShareAlt, FaUpload,
    FaFileAlt, FaFileImage, FaFilePdf, FaProjectDiagram,
    FaArrowLeft, FaFileCode, FaChartBar, FaUsers,
    FaDownload, FaEye, FaHistory, FaInfoCircle,
    FaServer, FaExternalLinkAlt, FaDatabase, FaLock
} from 'react-icons/fa';
import dynamic from 'next/dynamic';
import Card from '../../../components/ui/Card';
import StatsCard from '../../../components/ui/StatsCard';

// Dynamic imports for markdown and code rendering
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });
const SyntaxHighlighter = dynamic(() => import('react-syntax-highlighter'), { ssr: false });

// Dynamic import for mermaid diagram rendering
const MermaidDiagram = dynamic(
    () => import('@lightenna/react-mermaid-diagram').then(mod => mod.MermaidDiagram),
    {
        ssr: false,
        loading: () => <div className="py-4 text-center text-gray-500 text-sm">Loading diagram...</div>
    }
);

interface FileMetadata {
    id: string;
    fileName: string;
    title: string;
    description?: string;
    contentType: string;
    size: number;
    uploadedAt: string | number | Date;
    expiresAt?: string | number | Date;
    downloadCount: number;
    viewCount?: number;
    userId?: string;
    compressed?: boolean;
    originalSize?: number;
    compressionRatio?: number;
    accessHistory?: {
        date: string;
        count: number;
    }[];
    metadata?: Record<string, string>;
    isShared?: boolean;
    password?: string;
}

export default function ArtifactPage() {
    const params = useParams();
    const fileId = params?.id as string;

    const [fileInfo, setFileInfo] = useState<FileMetadata | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [isMermaidDiagram, setIsMermaidDiagram] = useState(false);
    const [accessStats, setAccessStats] = useState<{
        today: number;
        week: number;
        month: number;
    }>({
        today: 0,
        week: 0,
        month: 0
    });

    const isTextFile = useCallback((contentType: string) => {
        return (
            contentType.includes('text') ||
            contentType.includes('markdown') ||
            contentType.includes('json') ||
            contentType.includes('javascript') ||
            contentType.includes('typescript') ||
            contentType.includes('css') ||
            contentType.includes('html') ||
            contentType.includes('xml')
        );
    }, []);

    const isImageFile = useCallback((contentType: string) => {
        return contentType.includes('image');
    }, []);

    const isPdfFile = useCallback((contentType: string) => {
        return contentType.includes('pdf');
    }, []);

    // Check if content is a Mermaid diagram
    const checkIfMermaidDiagram = useCallback((content: string): boolean => {
        // Common Mermaid diagram starters
        const mermaidPatterns = [
            /^\s*graph\s+(TB|TD|BT|RL|LR)/,
            /^\s*sequenceDiagram/,
            /^\s*classDiagram/,
            /^\s*stateDiagram/,
            /^\s*erDiagram/,
            /^\s*gantt/,
            /^\s*pie/,
            /^\s*flowchart/,
            /^\s*journey/
        ];

        return mermaidPatterns.some(pattern => pattern.test(content.trim()));
    }, []);

    useEffect(() => {
        async function fetchFileMetadata() {
            try {
                const response = await fetch(`/api/files/${fileId}`);
                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? 'File not found or has expired'
                            : 'Failed to fetch file information'
                    );
                }

                const data = await response.json();

                // Track view for stats - in a real app this would be a separate API call
                data.viewCount = (data.viewCount || 0) + 1;

                setFileInfo(data);

                if (data.expiresAt) {
                    updateTimeRemaining(data.expiresAt);
                    const timer = setInterval(() => updateTimeRemaining(data.expiresAt), 60000);
                    return () => clearInterval(timer);
                }

                // Generate some mock access stats if none exist
                if (!data.accessHistory) {
                    generateMockAccessStats(data.downloadCount || 0);
                } else {
                    calculateAccessStats(data.accessHistory);
                }

                // Load file content if it's a text-based file
                if (isTextFile(data.contentType) ||
                    data.fileName.toLowerCase().endsWith('.mmd') ||
                    data.fileName.toLowerCase().endsWith('.mermaid')) {
                    fetchFileContent();
                }
            } catch (err: any) {
                console.error('Error fetching file metadata:', err);
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        if (fileId) {
            fetchFileMetadata();
        }
    }, [fileId, isTextFile]);

    const fetchFileContent = async () => {
        if (!fileId) return;

        setContentLoading(true);
        try {
            // Use the text-content endpoint for text files
            const response = await fetch(`/api/uploads/text-content/${fileId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Text content not available for this file');
                } else {
                    throw new Error('Failed to load file content');
                }
            }

            const content = await response.text();
            setFileContent(content);

            // Check if the content is a Mermaid diagram
            const isMermaid = checkIfMermaidDiagram(content);
            setIsMermaidDiagram(isMermaid);

            // Update file info description to indicate it's a Mermaid diagram if detected
            if (isMermaid && fileInfo) {
                setFileInfo(prev => prev ? {
                    ...prev,
                    description: (prev.description || '') +
                        (prev.description ? ' • ' : '') + 'Contains Mermaid diagram'
                } : null);
            }
        } catch (err: any) {
            console.error('Error loading file content:', err);
            setFileContent(null);
        } finally {
            setContentLoading(false);
        }
    };

    // In a real app, this would come from server analytics
    const generateMockAccessStats = (downloadCount: number) => {
        const today = Math.floor(downloadCount * 0.2) || 1;
        const week = Math.floor(downloadCount * 0.6) || 3;
        const month = downloadCount;

        setAccessStats({
            today,
            week,
            month
        });

        // Generate mock access history data (last 7 days)
        const mockHistory = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const count = i === 0
                ? today
                : Math.floor(Math.random() * (week / 7) * 1.5);

            mockHistory.push({
                date: date.toISOString().split('T')[0],
                count
            });
        }

        if (fileInfo) {
            setFileInfo({
                ...fileInfo,
                accessHistory: mockHistory
            });
        }
    };

    const calculateAccessStats = (history: { date: string; count: number }[]) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);

        const todayCount = history.find(entry => entry.date === today)?.count || 0;

        const weekCount = history.reduce((sum, entry) => {
            const entryDate = new Date(entry.date);
            if (entryDate >= oneWeekAgo) {
                return sum + entry.count;
            }
            return sum;
        }, 0);

        const monthCount = history.reduce((sum, entry) => sum + entry.count, 0);

        setAccessStats({
            today: todayCount,
            week: weekCount,
            month: monthCount
        });
    };

    // Simplified time remaining calculation
    const updateTimeRemaining = (expiresAt: string | number | Date) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry.getTime() - now.getTime();

        if (diffMs <= 0) {
            setTimeRemaining('Expired');
            setError('This file has expired');
            return;
        }

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffDays > 0) {
            setTimeRemaining(`${diffDays}d ${diffHours}h`);
        } else if (diffHours > 0) {
            setTimeRemaining(`${diffHours}h ${diffMinutes}m`);
        } else {
            setTimeRemaining(`${diffMinutes}m`);
        }
    };

    // Format bytes to readable size
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Simple date formatter
    const formatDate = (dateString: string | number | Date): string => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleDownload = () => {
        if (!fileInfo) return;
        window.location.href = `/api/uploads/${fileId}`;
        // Do NOT update downloadCount here; let the backend handle it only on real download
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/artifact/${fileId}`)
            .then(() => {
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            });
    };

    // Get file type icon
    const getFileIcon = () => {
        if (!fileInfo) return <FaFile className="text-gray-500" />;

        const contentType = fileInfo.contentType.toLowerCase();
        const fileName = fileInfo.fileName.toLowerCase();

        if (isMermaidDiagram || fileName.endsWith('.mmd') || fileName.endsWith('.mermaid')) {
            return <FaProjectDiagram className="text-green-500" />;
        } else if (contentType.includes('image')) {
            return <FaFileImage className="text-blue-500" />;
        } else if (contentType.includes('pdf')) {
            return <FaFilePdf className="text-red-500" />;
        } else if (contentType.includes('markdown')) {
            return <FaFileAlt className="text-purple-500" />;
        } else if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('typescript')) {
            return <FaFileCode className="text-yellow-500" />;
        } else if (contentType.includes('text')) {
            return <FaFileAlt className="text-gray-500" />;
        } else {
            return <FaFile className="text-gray-500" />;
        }
    };

    // Get appropriate syntax highlighting language 
    const getLanguage = () => {
        if (!fileInfo) return 'text';

        const contentType = fileInfo.contentType.toLowerCase();
        const fileName = fileInfo.fileName.toLowerCase();

        if (isMermaidDiagram || fileName.endsWith('.mmd') || fileName.endsWith('.mermaid')) {
            return 'mermaid';
        } else if (contentType.includes('markdown') || fileName.endsWith('.md')) {
            return 'markdown';
        } else if (contentType.includes('json') || fileName.endsWith('.json')) {
            return 'json';
        } else if (contentType.includes('javascript') || fileName.endsWith('.js')) {
            return 'javascript';
        } else if (contentType.includes('typescript') || fileName.endsWith('.ts')) {
            return 'typescript';
        } else if (contentType.includes('html') || fileName.endsWith('.html')) {
            return 'html';
        } else if (contentType.includes('css') || fileName.endsWith('.css')) {
            return 'css';
        } else {
            return 'text';
        }
    };

    // Render metadata key-value pairs
    const renderMetadata = (metadata?: Record<string, string>) => {
        if (!metadata || Object.keys(metadata).length === 0) return null;
        return (
            <div className="mt-2 text-xs text-gray-600">
                <div className="font-semibold mb-1">Metadata:</div>
                <ul className="list-disc ml-4">
                    {Object.entries(metadata).map(([key, value]) => (
                        <li key={key}><span className="font-medium">{key}:</span> {value}</li>
                    ))}
                </ul>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <div className="w-full max-w-lg bg-white rounded-lg shadow p-6 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-full mb-4"></div>
                        <div className="h-5 w-40 bg-gray-200 rounded mb-3"></div>
                        <div className="h-3 w-24 bg-gray-100 rounded mb-2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !fileInfo) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <Card className="w-full max-w-sm p-6 text-center">
                    <FaExclamationTriangle className="text-yellow-500 text-2xl mx-auto mb-3" />
                    <h1 className="text-lg font-medium text-gray-800 mb-2">File Unavailable</h1>
                    <p className="text-gray-600 mb-5 text-sm">{error || "Unable to retrieve file information"}</p>

                    <div className="flex justify-center space-x-4 mt-2">
                        <Link
                            href="/"
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                        >
                            Home
                        </Link>
                        <Link
                            href="/upload"
                            className="px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-sm"
                        >
                            <FaUpload className="inline mr-1 text-xs" /> Upload
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    // Calculate KPIs
    const compressionRate = fileInfo.originalSize && fileInfo.originalSize > fileInfo.size
        ? Math.round((1 - fileInfo.size / fileInfo.originalSize) * 100)
        : 0;

    const expiryDate = fileInfo.expiresAt
        ? new Date(fileInfo.expiresAt)
        : null;

    const daysUntilExpiry = expiryDate
        ? Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
        : null;

    // Prepare usage chart data from access history
    const usageChartData = fileInfo.accessHistory
        ? fileInfo.accessHistory.map(entry => ({
            label: entry.date.split('-').slice(1).join('/'), // Format as MM/DD
            value: entry.count
        }))
        : [];

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumb navigation */}
                <div className="mb-3 flex items-center text-sm">
                    <Link href="/" className="text-gray-500 hover:text-primary-500 transition-colors">
                        Home
                    </Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-700">File Details</span>
                </div>

                {/* Main Info Card */}
                <Card className="mb-4">
                    <Card.Header className="flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="p-2 bg-gray-50 rounded-full mr-3">
                                {getFileIcon()}
                            </span>
                            <div>
                                <h1 className="font-medium text-gray-800 mb-0.5" title={fileInfo.fileName}>
                                    {fileInfo.title || fileInfo.fileName}
                                </h1>
                                <div className="text-xs text-gray-500">
                                    {formatBytes(fileInfo.size)} • Uploaded {formatDate(fileInfo.uploadedAt)}
                                </div>
                            </div>
                        </div>

                        {timeRemaining && (
                            <div className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 flex items-center">
                                <FaClock className="mr-1" /> {timeRemaining} remaining
                            </div>
                        )}
                    </Card.Header>

                    <Card.Body>
                        {/* Sharing status and password protection */}
                        <div className="mb-4 flex items-center gap-3">
                            {fileInfo.isShared ? (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                                    <FaShareAlt className="mr-1" /> Shared (anyone with link)
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                                    <FaLock className="mr-1" /> Private (only you)
                                </span>
                            )}
                            {fileInfo.isShared && fileInfo.password && (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                                    <FaLock className="mr-1" /> Password protected
                                </span>
                            )}
                        </div>
                        {fileInfo.description && (
                            <div className="text-sm text-gray-700 mb-4 pb-3 border-b border-gray-100">
                                {fileInfo.description}
                            </div>
                        )}
                        {/* Metadata display */}
                        {renderMetadata(fileInfo.metadata)}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Filename</div>
                                <div className="truncate" title={fileInfo.fileName}>{fileInfo.fileName}</div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 mb-1">Downloads</div>
                                <div className="font-medium">{fileInfo.downloadCount}</div>
                            </div>

                            {fileInfo.expiresAt && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Expiration</div>
                                    <div>{formatDate(fileInfo.expiresAt)}</div>
                                </div>
                            )}

                            <div>
                                <div className="text-xs text-gray-500 mb-1">Size</div>
                                <div>
                                    {formatBytes(fileInfo.size)}
                                    {compressionRate > 0 && (
                                        <span className="ml-1 text-xs text-green-600">
                                            ({compressionRate}% compressed)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center px-3 py-1.5 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 transition-colors"
                            >
                                <FaFileDownload className="mr-1" /> Download
                            </button>

                            <button
                                onClick={handleCopyLink}
                                className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                                {linkCopied ? <><FaCheck className="mr-1" /> Copied</> : <><FaShareAlt className="mr-1" /> Share</>}
                            </button>

                            {(isTextFile(fileInfo.contentType) || isMermaidDiagram || isImageFile(fileInfo.contentType)) && (
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200 transition-colors ml-auto"
                                >
                                    <FaEye className="mr-1" /> {showPreview ? "Hide Preview" : "View Content"}
                                </button>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                {/* KPI Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Usage Stats Card */}
                    <StatsCard
                        title="Usage Statistics"
                        icon={<FaChartBar className="text-primary-500" />}
                        tooltip="File access statistics over time"
                    >
                        <div className="mb-5">
                            <StatsCard.Grid columns={3} className="mb-4">
                                <StatsCard.Stat
                                    label="Today"
                                    value={accessStats.today}
                                    icon={<FaEye />}
                                />
                                <StatsCard.Stat
                                    label="This week"
                                    value={accessStats.week}
                                    icon={<FaEye />}
                                />
                                <StatsCard.Stat
                                    label="Total views"
                                    value={fileInfo.viewCount || 0}
                                    icon={<FaEye />}
                                />
                            </StatsCard.Grid>

                            {usageChartData.length > 0 && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-2">7-Day Access Trend</div>
                                    <StatsCard.Chart
                                        data={usageChartData}
                                        type="bar"
                                        height={100}
                                        color="#3b82f6"
                                    />
                                </div>
                            )}
                        </div>
                    </StatsCard>

                    {/* Storage Stats */}
                    <StatsCard
                        title="Storage Details"
                        icon={<FaDatabase className="text-blue-500" />}
                    >
                        <div className="mb-2">
                            <StatsCard.Grid columns={2} className="mb-4">
                                <StatsCard.Stat
                                    label="Size"
                                    value={formatBytes(fileInfo.size)}
                                    icon={<FaFileAlt />}
                                />
                                <StatsCard.Stat
                                    label="Downloads"
                                    value={fileInfo.downloadCount}
                                    icon={<FaDownload />}
                                />
                            </StatsCard.Grid>

                            {fileInfo.originalSize && fileInfo.originalSize > fileInfo.size && (
                                <div className="mt-3">
                                    <StatsCard.Progress
                                        label="Compression"
                                        value={compressionRate}
                                        max={100}
                                        color="green"
                                    />
                                    <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                        <span>Original: {formatBytes(fileInfo.originalSize)}</span>
                                        <span>Saved: {formatBytes(fileInfo.originalSize - fileInfo.size)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </StatsCard>

                    {/* Time Related Stats */}
                    <StatsCard
                        title="Timeline"
                        icon={<FaHistory className="text-purple-500" />}
                    >
                        <div className="space-y-4">
                            <StatsCard.Stat
                                label="Uploaded on"
                                value={formatDate(fileInfo.uploadedAt)}
                                icon={<FaCalendarAlt />}
                                className="mb-2"
                            />

                            {fileInfo.expiresAt && (
                                <>
                                    <StatsCard.Stat
                                        label="Expires on"
                                        value={formatDate(fileInfo.expiresAt)}
                                        icon={<FaClock />}
                                        className="mb-2"
                                    />

                                    {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                                        <div className="mt-3">
                                            <StatsCard.Progress
                                                label="Time Remaining"
                                                value={daysUntilExpiry}
                                                max={30} // Assuming max expiry is 30 days
                                                color={daysUntilExpiry < 3 ? "red" : "primary"}
                                            />
                                            <div className="text-xs text-gray-500 mt-1 flex justify-end">
                                                <span>{daysUntilExpiry} days left</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </StatsCard>
                </div>

                {/* Preview Card - Only shown when preview is toggled */}
                {showPreview && (fileContent || isImageFile(fileInfo.contentType)) && (
                    <Card className="mb-4">
                        <Card.Header className="flex justify-between items-center">
                            <h2 className="font-medium text-gray-700">File Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </Card.Header>

                        <Card.Body>
                            {/* Mermaid Diagram Preview */}
                            {isMermaidDiagram && fileContent && (
                                <div className="mb-4">
                                    <MermaidDiagram>{fileContent}</MermaidDiagram>
                                </div>
                            )}

                            {/* Text Content Preview */}
                            {isTextFile(fileInfo.contentType) && fileContent && !contentLoading && !isMermaidDiagram && (
                                <div className="bg-gray-50 rounded border overflow-auto max-h-96">
                                    {fileInfo.contentType.includes('markdown') ? (
                                        <div className="p-4 prose max-w-none">
                                            <ReactMarkdown>{fileContent}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-sm">
                                            <SyntaxHighlighter language={getLanguage()} showLineNumbers>
                                                {fileContent}
                                            </SyntaxHighlighter>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Image Preview */}
                            {isImageFile(fileInfo.contentType) && (
                                <div className="flex items-center justify-center">
                                    <img
                                        src={`/api/uploads/${fileId}`}
                                        alt={fileInfo.fileName}
                                        className="max-w-full max-h-96 object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/icon.png';
                                            target.style.height = '80px';
                                            target.style.width = '80px';
                                        }}
                                    />
                                </div>
                            )}

                            {contentLoading && (
                                <div className="h-48 flex items-center justify-center">
                                    <div className="animate-pulse">Loading content...</div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {/* Footer Navigation */}
                <div className="flex justify-between items-center text-sm mt-4 px-1">
                    <Link href="/" className="text-primary-500 hover:text-primary-600 transition-colors flex items-center">
                        <FaArrowLeft className="mr-1 text-xs" /> Back to Home
                    </Link>
                    <Link href="/upload" className="text-primary-500 hover:text-primary-600 transition-colors flex items-center">
                        <FaUpload className="mr-1 text-xs" /> Upload New File
                    </Link>
                </div>
            </div>
        </div>
    );
}