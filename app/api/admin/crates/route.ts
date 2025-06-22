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

    // Get all crates from Firestore
    const cratesSnapshot = await firestore.collection("crates").get();

    // Get user emails for mapping
    const userIds = new Set<string>();
    cratesSnapshot.docs.forEach((doc) => {
      // Use ownerId instead of userId
      const ownerId = doc.data().ownerId;
      if (ownerId) userIds.add(ownerId);
    });

    // Get user info for all users with crates
    const userEmails = new Map<string, string>();

    if (userIds.size > 0) {
      try {
        // We can't get all users at once, so we'll chunk the requests
        const userIdsArray = Array.from(userIds);
        const chunkSize = 100; // Firebase has a limit on batch operations

        for (let i = 0; i < userIdsArray.length; i += chunkSize) {
          const chunk = userIdsArray.slice(i, i + chunkSize);
          const userRecords = await Promise.all(
            chunk.map((userId) =>
              getAuth()
                .getUser(userId)
                .catch(() => null),
            ),
          );

          userRecords.forEach((record) => {
            if (record && record.email) {
              userEmails.set(record.uid, record.email);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        // Continue without user emails if there was an error
      }
    }

    // Format the crate data for the response
    const crates = cratesSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Use ownerId instead of userId
      const ownerId = data.ownerId || "";

      return {
        id: doc.id,
        // Use title instead of name, or fileName as fallback
        name: data.title || data.fileName || "Unnamed Crate",
        description: data.description || "",
        // Map ownerId to userId for the admin page
        userId: ownerId,
        userEmail: userEmails.get(ownerId),
        // Convert Date objects to ISO strings if needed
        createdAt: data.createdAt?.toDate?.()
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()
          ? data.updatedAt.toDate().toISOString()
          : null,
        // Use size directly
        size: data.size || 0,
        mimeType: data.mimeType || "",
        // Use downloadCount instead of accessCount if available
        accessCount: data.downloadCount || data.accessCount || 0,
        // Map shared.public to isPublic if available
        isPublic: data.shared?.public || data.isPublic || false,
        // Determine protection based on passwordHash presence
        isProtected: Boolean(data.shared?.passwordHash || data.isProtected),
        tags: data.tags || [],
        featured: data.featured || false,
      };
    });

    return NextResponse.json({ crates });
  } catch (error: any) {
    console.error("Error fetching crates:", error);

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
