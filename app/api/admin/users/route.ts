import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Get all users from Firebase Auth
    const { users: firebaseUsers } = await getAuth().listUsers();

    // Get additional user data from Firestore if needed
    const usersWithCratesPromise = firestore
      .collection("crates")
      .select("userId")
      .get()
      .then((snapshot) => {
        // Count crates per user
        const cratesCountByUser = new Map<string, number>();
        snapshot.docs.forEach((doc) => {
          const userId = doc.data().userId;
          if (userId) {
            cratesCountByUser.set(
              userId,
              (cratesCountByUser.get(userId) || 0) + 1,
            );
          }
        });
        return cratesCountByUser;
      });

    // Get MCP calls stats from Firestore if available
    const mcpCallsCountByUserPromise = firestore
      .collection("mcpCalls")
      .select("userId")
      .get()
      .then((snapshot) => {
        // Count MCP calls per user
        const mcpCallsCountByUser = new Map<string, number>();
        snapshot.docs.forEach((doc) => {
          const userId = doc.data().userId;
          if (userId) {
            mcpCallsCountByUser.set(
              userId,
              (mcpCallsCountByUser.get(userId) || 0) + 1,
            );
          }
        });
        return mcpCallsCountByUser;
      })
      .catch(() => new Map<string, number>()); // Return empty map if collection doesn't exist

    // Get storage usage per user
    const storageUsedByUserPromise = firestore
      .collection("crates")
      .get()
      .then((snapshot) => {
        // Sum up storage used per user
        const storageByUser = new Map<string, number>();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const userId = data.userId;
          const size = data.size || 0; // Size in bytes
          if (userId) {
            storageByUser.set(userId, (storageByUser.get(userId) || 0) + size);
          }
        });
        return storageByUser;
      });

    // Get user activity data from Firestore if available
    const userActivityPromise = firestore
      .collection("userActivity")
      .get()
      .then((snapshot) => {
        // Get last active timestamp per user
        const lastActiveByUser = new Map<string, string>();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.lastActive && data.userId) {
            const timestamp = data.lastActive.toDate
              ? data.lastActive.toDate()
              : new Date(data.lastActive);
            lastActiveByUser.set(data.userId, timestamp.toISOString());
          }
        });
        return lastActiveByUser;
      })
      .catch(() => new Map<string, string>()); // Return empty map if collection doesn't exist

    // Wait for all Firestore queries to complete
    const [
      cratesCountByUser,
      mcpCallsCountByUser,
      storageUsedByUser,
      lastActiveByUser,
    ] = await Promise.all([
      usersWithCratesPromise,
      mcpCallsCountByUserPromise,
      storageUsedByUserPromise,
      userActivityPromise,
    ]);

    // Combine data and map to response format
    const formattedUsers = firebaseUsers.map((firebaseUser) => {
      // Custom claims might contain isAdmin flag
      const customClaims = firebaseUser.customClaims || {};

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName,
        createdAt: firebaseUser.metadata.creationTime,
        lastLogin: firebaseUser.metadata.lastSignInTime,
        isAdmin: Boolean(customClaims.admin),
        isDisabled: firebaseUser.disabled,
        cratesCount: cratesCountByUser.get(firebaseUser.uid) || 0,
        mcpCallsCount: mcpCallsCountByUser.get(firebaseUser.uid) || 0,
        storageUsed: storageUsedByUser.get(firebaseUser.uid) || 0,
        lastActive:
          lastActiveByUser.get(firebaseUser.uid) ||
          firebaseUser.metadata.lastSignInTime,
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error: any) {
    console.error("Error fetching users:", error);

    if (
      error.code === "auth/id-token-expired" ||
      error.code === "auth/argument-error"
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
