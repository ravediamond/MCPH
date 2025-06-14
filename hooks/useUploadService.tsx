"use client";

import { CrateCategory, CrateSharing } from "@/app/types/crate";
import { useAuth } from "@/contexts/AuthContext";

// Type definitions for upload options
export interface UploadOptions {
  title?: string;
  description?: string;
  category?: CrateCategory;
  password?: string;
  tags?: string[];
  expiresInDays?: number;
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
  const uploadCrate = async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
    try {
      // In a real implementation, this would call your API
      // For this example, we'll simulate success
      
      // Apply defaults for missing options
      const finalOptions = {
        title: options.title || file.name,
        description: options.description || "",
        category: options.category || detectCrateCategory(file),
        password: options.password || "",
        tags: options.tags || [],
        expiresInDays: options.expiresInDays || 30, // Default to 30 days
        sharing: options.sharing || CrateSharing.PUBLIC,
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random ID to simulate upload success
      const crateId = Math.random().toString(36).substring(2, 15);
      
      return {
        success: true,
        id: crateId,
        url: `https://mcph.io/crate/${crateId}`,
      };
    } catch (error) {
      console.error("Upload failed:", error);
      return {
        success: false,
        id: "",
        url: "",
        error: error instanceof Error ? error.message : "Unknown error occurred",
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
      [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].some(ext => fileName.endsWith(ext))
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
      return CrateCategory.MARKDOWN;
    }
    
    // JSON detection
    if (
      mimeType === "application/json" ||
      fileName.endsWith(".json")
    ) {
      return CrateCategory.JSON;
    }
    
    // Code detection (simplistic)
    if (
      [".js", ".ts", ".html", ".css", ".py", ".java", ".go", ".rb", ".php"].some(ext => fileName.endsWith(ext))
    ) {
      return CrateCategory.CODE;
    }
    
    // Default to binary for unknown types
    return CrateCategory.BINARY;
  };
  
  return { uploadCrate, detectCrateCategory };
};
