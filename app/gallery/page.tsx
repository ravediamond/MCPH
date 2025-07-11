"use client";

import { useEffect, useState } from "react";
import { Crate, CrateCategory } from "@/shared/types/crate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Loader2,
  Calendar,
  Download,
  User,
  FileText,
  Image,
  Code,
  Database,
  FileIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface GalleryResponse {
  crates: Partial<Crate>[];
  pagination: {
    hasMore: boolean;
    lastCrateId: string | null;
    total: number;
  };
}

const categoryIcons = {
  [CrateCategory.MARKDOWN]: <FileText className="w-4 h-4" />,
  [CrateCategory.CODE]: <Code className="w-4 h-4" />,
  [CrateCategory.IMAGE]: <Image className="w-4 h-4" />,
  [CrateCategory.JSON]: <Database className="w-4 h-4" />,
  [CrateCategory.YAML]: <Database className="w-4 h-4" />,
  [CrateCategory.TEXT]: <FileText className="w-4 h-4" />,
  [CrateCategory.BINARY]: <FileIcon className="w-4 h-4" />,
  [CrateCategory.FEEDBACK]: <FileText className="w-4 h-4" />,
};

export default function GalleryPage() {
  const [crates, setCrates] = useState<Partial<Crate>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    CrateCategory | "all"
  >("all");
  const [pagination, setPagination] = useState<GalleryResponse["pagination"]>({
    hasMore: false,
    lastCrateId: null,
    total: 0,
  });

  const fetchCrates = async (
    category?: CrateCategory | "all",
    startAfter?: string,
    append = false,
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        limit: "12",
        ...(category && category !== "all" && { category }),
        ...(startAfter && { startAfter }),
      });

      const response = await fetch(`/api/gallery?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch gallery crates");
      }

      const data: GalleryResponse = await response.json();

      if (append) {
        setCrates((prev) => [...prev, ...data.crates]);
      } else {
        setCrates(data.crates);
      }

      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch crates");
      console.error("Error fetching gallery crates:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCrates(selectedCategory);
  }, [selectedCategory]);

  const handleLoadMore = () => {
    if (pagination.hasMore && pagination.lastCrateId) {
      fetchCrates(selectedCategory, pagination.lastCrateId, true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary-600 transition-all duration-200 hover:shadow-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="inline-flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium">
              Gallery
            </span>
          </div>
        </nav>

        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Crate Gallery
              </h1>
              <p className="text-gray-600">
                Discover public crates shared by the community
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Filter by category:
                  </span>
                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value as CrateCategory | "all")
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm hover:border-gray-400 transition-colors w-52"
                  >
                    <option value="all">All Categories</option>
                    {Object.values(CrateCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {!loading && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-medium">{crates.length}</span>
                    <span>crates found</span>
                  </div>
                )}
              </div>
            </div>
        </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            </div>
          ) : crates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <p className="text-gray-500 text-lg">
                  No discoverable crates found
                  {selectedCategory !== "all" && ` in ${selectedCategory} category`}
                  .
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crates.map((crate) => (
                  <Card
                    key={crate.id}
                    className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 hover:border-gray-300 bg-white"
                    hoverable
                  >
                    <Card.Header className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-50 rounded-lg">
                            {crate.category && categoryIcons[crate.category]}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {crate.title}
                          </h3>
                        </div>
                        <span className="text-xs bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">
                          {crate.category}
                        </span>
                      </div>
                      {crate.description && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-gray-700 text-sm line-clamp-2">
                            {crate.description}
                          </p>
                        </div>
                      )}
                    </Card.Header>
                    <Card.Body className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(crate.tags) &&
                          crate.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        {Array.isArray(crate.tags) && crate.tags.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 font-medium">
                            +{crate.tags.length - 2} more
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 font-medium">
                            {crate.createdAt &&
                              (() => {
                                const date = new Date(crate.createdAt);
                                return !isNaN(date.getTime())
                                  ? formatDistanceToNow(date, { addSuffix: true })
                                  : "Unknown date";
                              })()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                          <Download className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 font-medium">{crate.downloadCount || 0}</span>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 font-medium truncate">
                            {(crate as any).ownerName || crate.ownerId}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-700 font-medium">{crate.size && formatFileSize(crate.size)}</span>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2 border-t border-gray-100">
                        <Link href={`/crate/${crate.id}`} className="flex-1">
                          <Button variant="outline" fullWidth className="hover:bg-gray-50 hover:border-gray-300 transition-colors">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/download/${crate.id}`}>
                          <Button variant="primary" size="sm" className="px-4 hover:shadow-md transition-shadow">
                            <Download className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

              {pagination.hasMore && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      variant="outline"
                      className="px-8 py-3 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
