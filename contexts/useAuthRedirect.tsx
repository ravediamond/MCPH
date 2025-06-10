import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

type RedirectOptions = {
  whenAuthenticated?: string;
  whenUnauthenticated?: string;
  whenAdmin?: string;
  whenNotAdmin?: string;
};

/**
 * A hook for handling auth-based redirects at the component level
 * Use this for more complex redirect logic that can't be handled by middleware
 */
export const useAuthRedirect = (options: RedirectOptions = {}) => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // Redirect based on authentication status
    if (user && options.whenAuthenticated) {
      router.push(options.whenAuthenticated);
    } else if (!user && options.whenUnauthenticated) {
      router.push(options.whenUnauthenticated);
    }

    // Redirect based on admin status
    if (user && isAdmin && options.whenAdmin) {
      router.push(options.whenAdmin);
    } else if (user && !isAdmin && options.whenNotAdmin) {
      router.push(options.whenNotAdmin);
    }
  }, [user, isAdmin, loading, router, options]);

  return { user, loading, isAdmin };
};
