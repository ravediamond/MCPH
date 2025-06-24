"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import TransferCratesModal from "@/components/TransferCratesModal";

/**
 * A hook to handle anonymous uploads transition to authenticated users
 * This migrates any temporary crates created when anonymous to a user's account
 * after they sign in.
 */
export const useAnonymousUploadTransition = () => {
  const { user, loading } = useAuth();
  const [tempCrateIds, setTempCrateIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    // Skip during loading or if no user is signed in
    if (loading || !user) return;

    // Check local storage for temporary crate IDs
    const tempCrateIdsJson = localStorage.getItem("mcph_temp_crates");
    if (!tempCrateIdsJson) return;

    try {
      const parsedIds = JSON.parse(tempCrateIdsJson);
      if (!Array.isArray(parsedIds) || parsedIds.length === 0) return;

      // Store the IDs and show the modal
      setTempCrateIds(parsedIds);
      setShowModal(true);
    } catch (error) {
      console.error("Error parsing temporary crate IDs:", error);
    }
  }, [user, loading]);

  // Function to handle the transfer of crates
  const handleTransferCrates = async () => {
    setIsTransferring(true);
    try {
      // Call the API to transfer crate ownership
      const response = await fetch("/api/crates/transfer-ownership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ crateIds: tempCrateIds }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success toast
        toast.success(
          `${data.results.filter((r: { success: boolean }) => r.success).length} previously anonymous uploads have been added to your account.`,
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

        // Store crate details in session storage for display in dashboard
        if (data.crateDetails && data.crateDetails.length > 0) {
          sessionStorage.setItem(
            "mcph_recent_claims",
            JSON.stringify(data.crateDetails),
          );
        }

        // Clear the temporary crates from local storage
        localStorage.removeItem("mcph_temp_crates");
        // Close the modal
        setShowModal(false);
      } else {
        throw new Error(data.error || "Failed to transfer crates");
      }
    } catch (error) {
      console.error("Error transferring crates:", error);
      toast.error("Failed to transfer anonymous uploads. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  };

  // Function to dismiss the modal without transferring
  const handleDismiss = () => {
    setShowModal(false);
    // Clear the temporary crates to prevent showing the modal again
    localStorage.removeItem("mcph_temp_crates");
  };

  /**
   * Store a temporary crate ID in local storage
   * Call this when an anonymous user uploads a crate
   */
  const storeTempCrateId = (crateId: string) => {
    try {
      const existingIdsJson = localStorage.getItem("mcph_temp_crates") || "[]";
      const existingIds = JSON.parse(existingIdsJson);
      if (!Array.isArray(existingIds)) {
        localStorage.setItem("mcph_temp_crates", JSON.stringify([crateId]));
        return;
      }

      if (!existingIds.includes(crateId)) {
        existingIds.push(crateId);
        localStorage.setItem("mcph_temp_crates", JSON.stringify(existingIds));
      }
    } catch (error) {
      console.error("Error storing temporary crate ID:", error);
    }
  };

  return {
    storeTempCrateId,
    transferModal: (
      <TransferCratesModal
        isOpen={showModal}
        onClose={handleDismiss}
        onConfirm={handleTransferCrates}
        crateCount={tempCrateIds.length}
        isLoading={isTransferring}
      />
    ),
  };
};
