import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MCPCard from './MCPCard';
import { MCP } from 'types/mcp';
import { FaExclamationCircle } from 'react-icons/fa';

interface FeaturedMCPsProps {
    title: string;
    type: 'starred' | 'trending';
    limit?: number;
}

export default function FeaturedMCPs({ title, type, limit = 5 }: FeaturedMCPsProps) {
    const router = useRouter();
    const [mcps, setMcps] = useState<MCP[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFeaturedMCPs() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/mcps/featured?type=${type}&limit=${limit}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${type} MCPs`);
                }

                const data = await response.json();
                setMcps(data.mcps || []);
            } catch (err) {
                console.error('Error fetching featured MCPs:', err);
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchFeaturedMCPs();
    }, [type, limit]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{title}</h2>
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{title}</h2>
                <div className="text-center text-red-500 py-8">
                    <FaExclamationCircle className="inline-block mb-1 mr-1" />
                    {error}
                </div>
            </div>
        );
    }

    if (mcps.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{title}</h2>
                <p className="text-center text-gray-500 py-8">No MCPs found</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mcps.map((mcp) => (
                    <MCPCard
                        key={mcp.id}
                        mcp={mcp}
                        onClick={() => router.push(`/mcp/${mcp.id}`)}
                    />
                ))}
            </div>
        </div>
    );
}