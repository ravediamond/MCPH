"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManageFeedbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /crates since feedback management is now integrated there
    router.replace("/crates");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );
}
