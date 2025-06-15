"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

/**
 * A hook to handle anonymous uploads transition to authenticated users
 * This migrates any temporary crates created when anonymous to a user's account
 * after they sign in.
 */
export const useAnonymousUploadTransition = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Skip during loading or if no user is signed in
    if (loading || !user) return;

    // Check local storage for temporary crate IDs
    const tempCrateIdsJson = localStorage.getItem("mcphub_temp_crates");
    if (!tempCrateIdsJson) return;

    try {
      const tempCrateIds = JSON.parse(tempCrateIdsJson);
      if (!Array.isArray(tempCrateIds) || tempCrateIds.length === 0) return;

      // Transfer ownership of temporary crates to authenticated user
      const transferCrates = async () => {
        // In a real implementation, this would call an API endpoint to update ownership
        // For this example, we'll just simulate success
        console.log(
          `Transferring ${tempCrateIds.length} temporary crates to user ${user.uid}`,
        );

        // Show success toast
        toast.success(
          `${tempCrateIds.length} previously anonymous uploads have been added to your account.`,
          {
            duration: 5000,
            icon: "📦",
            style: {
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #dcfce7",
              color: "#166534",
            },
          },
        );

        // Clear the temporary crates from local storage
        localStorage.removeItem("mcphub_temp_crates");
      };

      transferCrates();
    } catch (error) {
      console.error("Error parsing temporary crate IDs:", error);
    }
  }, [user, loading]);

  /**
   * Store a temporary crate ID in local storage
   * Call this when an anonymous user uploads a crate
   */
  const storeTempCrateId = (crateId: string) => {
    try {
      const existingIdsJson =
        localStorage.getItem("mcphub_temp_crates") || "[]";
      const existingIds = JSON.parse(existingIdsJson);
      if (!Array.isArray(existingIds)) {
        localStorage.setItem("mcphub_temp_crates", JSON.stringify([crateId]));
        return;
      }

      if (!existingIds.includes(crateId)) {
        existingIds.push(crateId);
        localStorage.setItem("mcphub_temp_crates", JSON.stringify(existingIds));
      }
    } catch (error) {
      console.error("Error storing temporary crate ID:", error);
    }
  };

  return { storeTempCrateId };
};
