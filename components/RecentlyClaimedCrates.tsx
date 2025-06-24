"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FaArrowRight, FaSpinner } from "react-icons/fa";

export default function RecentlyClaimedCrates() {
  const [recentClaims, setRecentClaims] = useState<
    {
      id: string;
      title: string;
      success: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check session storage for recently claimed crates
  useEffect(() => {
    const claimsData = sessionStorage.getItem("mcph_recent_claims");
    if (claimsData) {
      try {
        const claims = JSON.parse(claimsData);
        if (Array.isArray(claims) && claims.length > 0) {
          setRecentClaims(claims);
        }
      } catch (error) {
        console.error("Error parsing recently claimed crates:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // If no recent claims, don't show anything
  if (!loading && recentClaims.length === 0) {
    return null;
  }

  const handleViewCrate = (id: string) => {
    router.push(`/crate/${id}`);
  };

  const handleClearNotification = () => {
    sessionStorage.removeItem("mcph_recent_claims");
    setRecentClaims([]);
  };

  return (
    <div className="mb-8 bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 rounded-lg border border-emerald-600/30 p-4 shadow-md">
      <h2 className="text-lg font-semibold text-emerald-400 mb-3">
        Recently Claimed Uploads
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin text-emerald-500 mr-2" />
          <span className="text-emerald-300">
            Loading recently claimed uploads...
          </span>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-300 mb-4">
            The following anonymous uploads have been added to your account:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {recentClaims.map((crate) => (
              <div
                key={crate.id}
                className="bg-gray-800 border border-emerald-500/20 rounded-md p-3 hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => handleViewCrate(crate.id)}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-emerald-300 truncate"
                    title={crate.title}
                  >
                    {crate.title}
                  </span>
                  <FaArrowRight className="text-emerald-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClearNotification}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </>
      )}
    </div>
  );
}
