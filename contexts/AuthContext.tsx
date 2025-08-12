"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, ParsedToken } from "firebase/auth";
import { Role, Permission, FirebaseCustomClaims } from "../lib/types/rbac";
import { parseCustomClaims, hasPermission } from "../lib/rbac";
import {
  auth,
  googleProvider,
  microsoftProvider,
  githubProvider,
  createSAMLProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "../lib/firebaseClient";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: Role;
  permissions: Permission[];
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithSAML: (providerId: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  hasPermission: (
    permission: Permission,
    context?: { resourceOwnerId?: string },
  ) => boolean;
  canAccessResource: (
    resourceOwnerId: string,
    permission: Permission,
  ) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
  const [role, setRole] = useState<Role>(Role.USER);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Make async
      setUser(currentUser);
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult();

          // Parse custom claims for RBAC
          const { role: userRole, permissions: userPermissions } =
            parseCustomClaims(idTokenResult.claims as FirebaseCustomClaims);

          setRole(userRole);
          setPermissions(userPermissions);
          setIsAdmin(userRole >= Role.ADMIN); // Update admin check to use role hierarchy

          // Store the Firebase ID token in a cookie
          const idToken = await currentUser.getIdToken();
          document.cookie = `session=${idToken}; path=/; max-age=3600; SameSite=Strict`;

          console.log(`User authenticated with role: ${userRole}`);

          // TODO: Audit successful login via API when audit endpoint is available
          console.log(`User login audited: ${currentUser.uid}`);
        } catch (error) {
          console.error("Error getting ID token result: ", error);
          setIsAdmin(false);
          setRole(Role.USER);
          setPermissions([]);
        }
      } else {
        setIsAdmin(false);
        setRole(Role.USER);
        setPermissions([]);
        // Clear the session cookie when signed out
        document.cookie =
          "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Add token refresh function
  useEffect(() => {
    if (!user) return;

    // Set up a timer to refresh the token every 50 minutes (tokens expire after 1 hour)
    const tokenRefreshInterval = setInterval(
      async () => {
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
      },
      50 * 60 * 1000,
    ); // 50 minutes in milliseconds

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

  const signInWithMicrosoft = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, microsoftProvider);
      // onAuthStateChanged will handle setting the user and the redirect
    } catch (error) {
      console.error("Error signing in with Microsoft: ", error);
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
      // onAuthStateChanged will handle setting the user and the redirect
    } catch (error) {
      console.error("Error signing in with GitHub: ", error);
      setLoading(false);
    }
  };

  const signInWithSAML = async (providerId: string) => {
    setLoading(true);
    try {
      const samlProvider = createSAMLProvider(providerId);
      await signInWithPopup(auth, samlProvider);
      // onAuthStateChanged will handle setting the user and the redirect
    } catch (error) {
      console.error("Error signing in with SAML: ", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // TODO: Audit logout via API when audit endpoint is available
      if (user) {
        console.log(`User logout audited: ${user.uid}`);
      }

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

  // RBAC permission check functions
  const checkPermission = (
    permission: Permission,
    context?: { resourceOwnerId?: string },
  ): boolean => {
    return hasPermission(role, permission, {
      userId: user?.uid,
      resourceOwnerId: context?.resourceOwnerId,
    });
  };

  const checkResourceAccess = (
    resourceOwnerId: string,
    permission: Permission,
  ): boolean => {
    return hasPermission(role, permission, {
      userId: user?.uid,
      resourceOwnerId,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        role,
        permissions,
        signInWithGoogle,
        signInWithMicrosoft,
        signInWithGithub,
        signInWithSAML,
        signOut,
        getIdToken,
        hasPermission: checkPermission,
        canAccessResource: checkResourceAccess,
      }}
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
