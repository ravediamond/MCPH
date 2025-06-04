"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, ParsedToken } from "firebase/auth";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "../lib/firebaseClient";
import { useRouter } from "next/navigation"; // Import useRouter

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // Add isAdmin flag
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Make async
      setUser(currentUser);
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          setIsAdmin(!!idTokenResult.claims.admin); // Check for admin claim

          // Store the Firebase ID token in a cookie
          const idToken = await currentUser.getIdToken();
          document.cookie = `session=${idToken}; path=/; max-age=3600; SameSite=Strict`;

          // Only redirect to /home if on root or login page
          if (
            router &&
            typeof window !== "undefined" &&
            (window.location.pathname === "/" ||
              window.location.pathname === "/login")
          ) {
            router.push("/home");
          }
        } catch (error) {
          console.error("Error getting ID token result: ", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        // Clear the session cookie when signed out
        document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Add token refresh function
  useEffect(() => {
    if (!user) return;

    // Set up a timer to refresh the token every 50 minutes (tokens expire after 1 hour)
    const tokenRefreshInterval = setInterval(async () => {
      try {
        if (auth.currentUser) {
          const newToken = await auth.currentUser.getIdToken(true);
          // Update the session cookie with the new token
          document.cookie = `session=${newToken}; path=/; max-age=3600; SameSite=Strict`;
          console.log("Firebase ID token refreshed");
        }
      } catch (error) {
        console.error("Error refreshing Firebase ID token:", error);
      }
    }, 50 * 60 * 1000); // 50 minutes in milliseconds

    return () => clearInterval(tokenRefreshInterval);
  }, [user]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user and the redirect
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false); // Reset isAdmin on sign out
      // onAuthStateChanged will handle setting the user to null
    } catch (error) {
      console.error("Error signing out: ", error);
      setLoading(false);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken(true); // true to force refresh
        return idToken;
      } catch (error) {
        console.error("Error getting ID token: ", error);
        return null;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, signInWithGoogle, signOut, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
