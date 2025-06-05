// filepath: /Users/ravindu.somawansa@airliquide.com/Workspace/git_repos/perso/MCPHub/app/api/admin/stats/crates/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../lib/firebaseAdmin";

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

    // Get total crates count
    const cratesSnapshot = await firestore.collection("crates").count().get();
    const totalCrates = cratesSnapshot.data().count;

    // Get crates per user metrics
    const usersWithCratesSnapshot = await firestore
      .collection("crates")
      .select("userId")
      .get();

    // Count crates per user
    const cratesPerUser = new Map<string, number>();
    usersWithCratesSnapshot.docs.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) {
        cratesPerUser.set(userId, (cratesPerUser.get(userId) || 0) + 1);
      }
    });

    // Calculate average crates per user and max crates per user
    const userIds = Array.from(cratesPerUser.keys());
    const totalUsers = userIds.length;
    const averageCratesPerUser = totalUsers > 0 ? totalCrates / totalUsers : 0;
    const maxCratesPerUser = Math.max(...Array.from(cratesPerUser.values()), 0);

    // Get file type distribution
    const cratesWithContentTypeSnapshot = await firestore
      .collection("crates")
      .select("mimeType")
      .get();

    const fileTypes = new Map<string, number>();
    cratesWithContentTypeSnapshot.docs.forEach((doc) => {
      const mimeType = doc.data().mimeType || "unknown";
      // Simplify MIME type (e.g., "application/json" -> "json")
      const simplifiedType = mimeType.split("/").pop() || mimeType;
      fileTypes.set(simplifiedType, (fileTypes.get(simplifiedType) || 0) + 1);
    });

    // Get top 5 file types
    const topFileTypes = Array.from(fileTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      count: totalCrates,
      averageCratesPerUser,
      maxCratesPerUser,
      topFileTypes,
    });
  } catch (error: any) {
    console.error("Error fetching crate stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
