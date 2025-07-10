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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crate Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Discover public crates shared by the community
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as CrateCategory | "all")
                }
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {crates.length} crates found
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : crates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No discoverable crates found
              {selectedCategory !== "all" && ` in ${selectedCategory} category`}
              .
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crates.map((crate) => (
                <Card
                  key={crate.id}
                  className="hover:shadow-lg transition-shadow duration-200"
                  hoverable
                >
                  <Card.Header className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {crate.category && categoryIcons[crate.category]}
                        <h3 className="text-lg font-semibold truncate">
                          {crate.title}
                        </h3>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {crate.category}
                      </span>
                    </div>
                    {crate.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                        {crate.description}
                      </p>
                    )}
                  </Card.Header>
                  <Card.Body className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(crate.tags) && crate.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border"
                        >
                          {tag}
                        </span>
                      ))}
                      {Array.isArray(crate.tags) && crate.tags.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border">
                          +{crate.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {crate.createdAt && 
                            (() => {
                              const date = new Date(crate.createdAt);
                              return !isNaN(date.getTime()) 
                                ? formatDistanceToNow(date, { addSuffix: true })
                                : 'Unknown date';
                            })()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>{crate.downloadCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span className="truncate">{(crate as any).ownerName || crate.ownerId}</span>
                      </div>

                      <span>{crate.size && formatFileSize(crate.size)}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/crate/${crate.id}`} className="flex-1">
                        <Button variant="outline" fullWidth>
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/download/${crate.id}`}>
                        <Button variant="primary" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {pagination.hasMore && (
              <div className="text-center py-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="px-8"
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
