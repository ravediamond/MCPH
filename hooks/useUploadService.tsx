"use client";

import { CrateCategory, CrateSharing } from "@/shared/types/crate";
import { useAuth } from "@/contexts/AuthContext";

// Type definitions for upload options
export interface UploadOptions {
  title?: string;
  description?: string;
  category?: CrateCategory;
  password?: string;
  tags?: string[];
  sharing?: CrateSharing;
}

// Type definition for upload result
export interface UploadResult {
  success: boolean;
  id: string;
  url: string;
  error?: string;
}

/**
 * A custom hook for handling crate uploads in both quick and advanced modes
 * This provides a consistent upload logic to be shared between components
 */
export const useUploadService = () => {
  const { user, getIdToken } = useAuth();

  /**
   * Upload a crate file with the specified options
   * @param file The file to upload
   * @param options Optional upload configuration
   * @returns Promise with upload result
   */
  const uploadCrate = async (
    file: File,
    options: UploadOptions = {},
  ): Promise<UploadResult> => {
    try {
      // Apply defaults for missing options
      const finalOptions = {
        title: options.title || file.name,
        description: options.description || "",
        category: options.category || detectCrateCategory(file),
        password: options.password || "",
        tags: options.tags || [],
        // For anonymous uploads (when user is not logged in), make public by default
        sharing: options.sharing || { public: !user ? true : false },
      };

      // Create form data for the API call
      const formData = new FormData();
      formData.append("file", file);

      // Add all options to the form data
      if (finalOptions.title) formData.append("title", finalOptions.title);
      if (finalOptions.description)
        formData.append("description", finalOptions.description);
      if (finalOptions.category)
        formData.append("fileType", finalOptions.category);
      if (finalOptions.password)
        formData.append("password", finalOptions.password);

      // Add tags if present
      if (finalOptions.tags && finalOptions.tags.length > 0) {
        formData.append("tags", JSON.stringify(finalOptions.tags));
      }

      // Add auth token if user is logged in
      const headers: Record<string, string> = {};
      if (user && getIdToken) {
        try {
          const token = await getIdToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        } catch (e) {
          console.error("Failed to get auth token:", e);
        }
      }

      // Make the actual API call
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Sorry, we couldn't upload your file. Please try again.`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        id: data.id,
        url: data.downloadUrl,
      };
    } catch (error) {
      console.error("Upload failed:", error);
      return {
        success: false,
        id: "",
        url: "",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  /**
   * Detect the appropriate crate category based on file type
   * @param file The file to analyze
   * @returns The detected crate category
   */
  const detectCrateCategory = (file: File): CrateCategory => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Image detection
    if (
      mimeType.startsWith("image/") ||
      [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].some((ext) =>
        fileName.endsWith(ext),
      )
    ) {
      return CrateCategory.IMAGE;
    }

    // Markdown detection
    if (
      mimeType === "text/markdown" ||
      mimeType === "text/x-markdown" ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".markdown")
    ) {
      return CrateCategory.KNOWLEDGE;
    }

    // JSON detection
    if (mimeType === "application/json" || fileName.endsWith(".json")) {
      return CrateCategory.DATA;
    }

    // YAML detection
    if (
      mimeType === "application/yaml" ||
      mimeType === "text/yaml" ||
      mimeType === "text/x-yaml" ||
      mimeType === "application/x-yaml" ||
      fileName.endsWith(".yaml") ||
      fileName.endsWith(".yml")
    ) {
      return CrateCategory.DATA;
    }

    // Text detection
    if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
      return CrateCategory.KNOWLEDGE;
    }

    // Code detection (simplistic)
    if (
      [
        ".js",
        ".ts",
        ".html",
        ".css",
        ".py",
        ".java",
        ".go",
        ".rb",
        ".php",
      ].some((ext) => fileName.endsWith(ext))
    ) {
      return CrateCategory.CODE;
    }

    // Default to binary for unknown types
    return CrateCategory.OTHERS;
  };

  return { uploadCrate, detectCrateCategory };
};
