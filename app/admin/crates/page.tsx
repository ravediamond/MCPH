"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define crate type
interface Crate {
    id: string;
    name: string;
    description?: string;
    userId: string;
    userEmail?: string;
    createdAt: string;
    updatedAt?: string;
    size: number;
    mimeType?: string;
    accessCount?: number;
    isPublic: boolean;
    isProtected: boolean;
    tags?: string[];
    featured?: boolean;
}

const AdminCratesPage: React.FC = () => {
    const { user, isAdmin, loading, getIdToken } = useAuth();
    const router = useRouter();
    const [crates, setCrates] = useState<Crate[]>([]);
    const [filteredCrates, setFilteredCrates] = useState<Crate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    // Filter options
    const [showPublicOnly, setShowPublicOnly] = useState(false);
    const [showProtectedOnly, setShowProtectedOnly] = useState(false);
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
    const [sortBy, setSortBy] = useState<"name" | "size" | "createdAt" | "accessCount">("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Check authentication and admin status
    useEffect(() => {
        if (!loading && !user) {
            router.push("/home");
        } else if (!loading && user && !isAdmin) {
            router.push("/home");
            alert("Access denied. You are not an admin.");
        }
    }, [user, isAdmin, loading, router]);

    // Fetch crates data
    useEffect(() => {
        const fetchCrates = async () => {
            if (!isAdmin || !user) return;

            setIsLoading(true);
            setError(null);

            try {
                const token = await getIdToken();
                if (!token) {
                    throw new Error("Authentication token not available");
                }

                const response = await fetch("/api/admin/crates", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch crates");
                }

                const data = await response.json();
                setCrates(data.crates);
                setFilteredCrates(data.crates);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                console.error("Error fetching crates:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCrates();
    }, [isAdmin, user, getIdToken]);

    // Filter and sort crates based on search term and filters
    useEffect(() => {
        let result = [...crates];

        // Apply search filter
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(
                crate =>
                    crate.name?.toLowerCase().includes(lowerSearchTerm) ||
                    crate.description?.toLowerCase().includes(lowerSearchTerm) ||
                    crate.userEmail?.toLowerCase().includes(lowerSearchTerm) ||
                    crate.id.toLowerCase().includes(lowerSearchTerm) ||
                    (crate.tags && crate.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
            );
        }

        // Apply visibility filters
        if (showPublicOnly) {
            result = result.filter(crate => crate.isPublic);
        }

        if (showProtectedOnly) {
            result = result.filter(crate => crate.isProtected);
        }

        if (showFeaturedOnly) {
            result = result.filter(crate => crate.featured);
        }

        // Apply sorting
        result.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case "name":
                    valueA = a.name || "";
                    valueB = b.name || "";
                    break;
                case "size":
                    valueA = a.size || 0;
                    valueB = b.size || 0;
                    break;
                case "accessCount":
                    valueA = a.accessCount || 0;
                    valueB = b.accessCount || 0;
                    break;
                case "createdAt":
                default:
                    valueA = new Date(a.createdAt).getTime();
                    valueB = new Date(b.createdAt).getTime();
                    break;
            }

            // For strings (like name)
            if (typeof valueA === "string" && typeof valueB === "string") {
                return sortDirection === "asc"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            // For numbers (like size or accessCount)
            // Convert to numbers to ensure type safety
            const numA = Number(valueA);
            const numB = Number(valueB);
            return sortDirection === "asc" ? numA - numB : numB - numA;
        });

        setFilteredCrates(result);
    }, [crates, searchTerm, showPublicOnly, showProtectedOnly, showFeaturedOnly, sortBy, sortDirection]);

    // Toggle crate's featured status
    const toggleFeaturedStatus = async (crateId: string, currentStatus: boolean) => {
        setActionInProgress(crateId);

        try {
            const token = await getIdToken();
            if (!token) {
                throw new Error("Authentication token not available");
            }

            const response = await fetch(`/api/admin/crates/${crateId}/featured`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ featured: !currentStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update featured status");
            }

            // Update local state
            setCrates(prevCrates =>
                prevCrates.map(crate =>
                    crate.id === crateId ? { ...crate, featured: !currentStatus } : crate
                )
            );

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update featured status");
            console.error("Error updating featured status:", err);
        } finally {
            setActionInProgress(null);
        }
    };

    // Delete a crate
    const deleteCrate = async (crateId: string) => {
        if (!confirm("Are you sure you want to delete this crate? This action cannot be undone.")) {
            return;
        }

        setActionInProgress(crateId);

        try {
            const token = await getIdToken();
            if (!token) {
                throw new Error("Authentication token not available");
            }

            const response = await fetch(`/api/admin/crates/${crateId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete crate");
            }

            // Update local state
            setCrates(prevCrates => prevCrates.filter(crate => crate.id !== crateId));

            // Close modal if the deleted crate was selected
            if (selectedCrate && selectedCrate.id === crateId) {
                setSelectedCrate(null);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete crate");
            console.error("Error deleting crate:", err);
        } finally {
            setActionInProgress(null);
        }
    };

    // Show crate details
    const openCrateDetails = (crate: Crate) => {
        setSelectedCrate(crate);
    };

    // Close crate details modal
    const closeCrateDetails = () => {
        setSelectedCrate(null);
    };

    // Format date for display
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    if (loading) {
        return <p>Loading user data...</p>;
    }

    if (!user || !isAdmin) {
        return <p>Access Denied. Redirecting...</p>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Crate Management</h1>

            {/* Navigation */}
            <div className="mb-8">
                <Link
                    href="/admin/dashboard"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                    <div className="lg:col-span-2">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search Crates
                        </label>
                        <input
                            type="text"
                            id="search"
                            placeholder="Search by name, description, user, or ID..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                            Sort By
                        </label>
                        <select
                            id="sortBy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="createdAt">Creation Date</option>
                            <option value="name">Name</option>
                            <option value="size">Size</option>
                            <option value="accessCount">Access Count</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">
                            Order
                        </label>
                        <select
                            id="sortDirection"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={sortDirection}
                            onChange={(e) => setSortDirection(e.target.value as any)}
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-blue-600"
                                checked={showPublicOnly}
                                onChange={() => setShowPublicOnly(!showPublicOnly)}
                            />
                            <span className="ml-2 text-gray-700">Public Only</span>
                        </label>
                    </div>

                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-blue-600"
                                checked={showProtectedOnly}
                                onChange={() => setShowProtectedOnly(!showProtectedOnly)}
                            />
                            <span className="ml-2 text-gray-700">Password Protected Only</span>
                        </label>
                    </div>

                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-blue-600"
                                checked={showFeaturedOnly}
                                onChange={() => setShowFeaturedOnly(!showFeaturedOnly)}
                            />
                            <span className="ml-2 text-gray-700">Featured Only</span>
                        </label>
                    </div>

                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 ml-auto"
                        onClick={() => {
                            setSearchTerm("");
                            setShowPublicOnly(false);
                            setShowProtectedOnly(false);
                            setShowFeaturedOnly(false);
                            setSortBy("createdAt");
                            setSortDirection("desc");
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Crates Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCrates.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No crates found matching your criteria.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Crate
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Owner
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Size
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCrates.map((crate) => (
                                    <tr key={crate.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                                                    {getFileTypeIcon(crate.mimeType || "")}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 flex items-center">
                                                        {crate.name || "Unnamed Crate"}
                                                        {crate.featured && (
                                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{crate.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {crate.userEmail || crate.userId || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(crate.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatFileSize(crate.size)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                {crate.isPublic ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Public
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Private
                                                    </span>
                                                )}
                                                {crate.isProtected && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Password Protected
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-3">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    onClick={() => openCrateDetails(crate)}
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    className={`${crate.featured ? "text-yellow-600 hover:text-yellow-900" : "text-gray-600 hover:text-gray-900"
                                                        } ${actionInProgress === crate.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    onClick={() => toggleFeaturedStatus(crate.id, !!crate.featured)}
                                                    disabled={actionInProgress === crate.id}
                                                >
                                                    {actionInProgress === crate.id ? (
                                                        "Processing..."
                                                    ) : crate.featured ? (
                                                        "Unfeature"
                                                    ) : (
                                                        "Feature"
                                                    )}
                                                </button>
                                                <button
                                                    className={`text-red-600 hover:text-red-900 ${actionInProgress === crate.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    onClick={() => deleteCrate(crate.id)}
                                                    disabled={actionInProgress === crate.id}
                                                >
                                                    {actionInProgress === crate.id ? "Processing..." : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Crate Details Modal */}
            {selectedCrate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-gray-900">Crate Details</h3>
                                <button
                                    className="text-gray-400 hover:text-gray-500"
                                    onClick={closeCrateDetails}
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-lg font-medium mb-4">Basic Information</h4>

                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm text-gray-500">Name</span>
                                            <p className="font-medium">{selectedCrate.name || "Unnamed Crate"}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Description</span>
                                            <p className="font-medium">{selectedCrate.description || "No description"}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Crate ID</span>
                                            <p className="font-medium text-xs break-all">{selectedCrate.id}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Created At</span>
                                            <p className="font-medium">{formatDate(selectedCrate.createdAt)}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Last Updated</span>
                                            <p className="font-medium">{formatDate(selectedCrate.updatedAt)}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Status</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedCrate.isPublic ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Public
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Private
                                                    </span>
                                                )}
                                                {selectedCrate.isProtected && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Password Protected
                                                    </span>
                                                )}
                                                {selectedCrate.featured && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-medium mb-4">Technical Information</h4>

                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm text-gray-500">Owner</span>
                                            <p className="font-medium">{selectedCrate.userEmail || selectedCrate.userId || "Unknown"}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">File Size</span>
                                            <p className="font-medium">{formatFileSize(selectedCrate.size)}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">MIME Type</span>
                                            <p className="font-medium">{selectedCrate.mimeType || "Unknown"}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Access Count</span>
                                            <p className="font-medium">{selectedCrate.accessCount?.toLocaleString() || "0"}</p>
                                        </div>

                                        <div>
                                            <span className="text-sm text-gray-500">Tags</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedCrate.tags && selectedCrate.tags.length > 0 ? (
                                                    selectedCrate.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500">No tags</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <h4 className="text-lg font-medium mb-4">Actions</h4>

                                <div className="flex flex-wrap gap-4">
                                    <button
                                        className={`px-4 py-2 rounded-md ${selectedCrate.featured
                                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        onClick={() => toggleFeaturedStatus(selectedCrate.id, !!selectedCrate.featured)}
                                        disabled={actionInProgress === selectedCrate.id}
                                    >
                                        {selectedCrate.featured ? "Remove from Featured" : "Add to Featured"}
                                    </button>

                                    <Link
                                        href={`/crate/${selectedCrate.id}`}
                                        target="_blank"
                                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md"
                                    >
                                        View Crate
                                    </Link>

                                    <button
                                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this crate? This action cannot be undone.")) {
                                                deleteCrate(selectedCrate.id);
                                            }
                                        }}
                                        disabled={actionInProgress === selectedCrate.id}
                                    >
                                        Delete Crate
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md"
                                onClick={closeCrateDetails}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to get appropriate icon for file type
function getFileTypeIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    } else if (mimeType.startsWith("video/")) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 012 2z" />
            </svg>
        );
    } else if (mimeType.startsWith("audio/")) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
        );
    } else if (mimeType.startsWith("application/pdf")) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    } else if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        );
    } else {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
        );
    }
}

export default AdminCratesPage;