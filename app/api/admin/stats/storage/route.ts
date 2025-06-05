import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { admin } from "../../../../../lib/firebaseAdmin";

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

    // Get total storage used (assume we store size in bytes in crates collection)
    const cratesSnapshot = await firestore.collection("crates").get();

    let totalStorage = 0;
    let crateCount = cratesSnapshot.size;
    const sizeDistribution = {
      smallCrates: 0, // < 1MB
      mediumCrates: 0, // 1MB-10MB
      largeCrates: 0, // 10MB-100MB
      veryLargeCrates: 0, // >100MB
    };

    // Count file types
    const fileTypes = new Map<string, number>();

    // Process each crate
    cratesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const size = data.size || 0; // Size in bytes
      totalStorage += size;

      // Categorize by size
      if (size < 1_048_576) {
        // Less than 1MB
        sizeDistribution.smallCrates++;
      } else if (size < 10_485_760) {
        // Less than 10MB
        sizeDistribution.mediumCrates++;
      } else if (size < 104_857_600) {
        // Less than 100MB
        sizeDistribution.largeCrates++;
      } else {
        // 100MB or larger
        sizeDistribution.veryLargeCrates++;
      }

      // Count file types
      const mimeType = data.mimeType || "unknown";
      fileTypes.set(mimeType, (fileTypes.get(mimeType) || 0) + 1);
    });

    // Calculate average crate size
    const avgCrateSize = crateCount > 0 ? totalStorage / crateCount : 0;

    // Get storage utilization (example: assuming 10GB quota, adjust as needed)
    const storageQuota = 10 * 1024 * 1024 * 1024; // 10GB in bytes
    const utilization = (totalStorage / storageQuota) * 100;

    // Get top file types
    const topFileTypes = Array.from(fileTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      totalStorage,
      avgCrateSize,
      utilization,
      sizeDistribution,
      topFileTypes,
    });
  } catch (error: any) {
    console.error("Error fetching storage stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
