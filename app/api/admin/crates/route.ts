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
        cratesSnapshot.docs.forEach(doc => {
            const userId = doc.data().userId;
            if (userId) userIds.add(userId);
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
                        chunk.map(userId => getAuth().getUser(userId).catch(() => null))
                    );

                    userRecords.forEach(record => {
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
        const crates = cratesSnapshot.docs.map(doc => {
            const data = doc.data();
            const userId = data.userId || "";

            return {
                id: doc.id,
                name: data.name || "",
                description: data.description || "",
                userId: userId,
                userEmail: userEmails.get(userId),
                createdAt: data.createdAt?.toDate?.() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.() || null,
                size: data.size || 0,
                mimeType: data.mimeType || "",
                accessCount: data.accessCount || 0,
                isPublic: data.isPublic || false,
                isProtected: data.isProtected || false,
                tags: data.tags || [],
                featured: data.featured || false
            };
        });

        return NextResponse.json({ crates });
    } catch (error: any) {
        console.error("Error fetching crates:", error);

        if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
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