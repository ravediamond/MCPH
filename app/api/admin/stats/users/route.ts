import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

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
      // Check for the admin custom claim
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403 },
      );
    }

    // Get all users
    const listUsersResult = await getAuth().listUsers();
    const totalUsers = listUsersResult.users.length;

    // Get active users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = listUsersResult.users.filter((user) => {
      return (
        user.metadata.lastSignInTime &&
        new Date(user.metadata.lastSignInTime) >= thirtyDaysAgo
      );
    });

    const activeUsersCount = activeUsers.length;

    // Calculate user growth rate (30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const usersCreatedLast30Days = listUsersResult.users.filter((user) => {
      return (
        user.metadata.creationTime &&
        new Date(user.metadata.creationTime) >= thirtyDaysAgo
      );
    }).length;

    const usersCreatedPrevious30Days = listUsersResult.users.filter((user) => {
      return (
        user.metadata.creationTime &&
        new Date(user.metadata.creationTime) >= sixtyDaysAgo &&
        new Date(user.metadata.creationTime) < thirtyDaysAgo
      );
    }).length;

    // Calculate growth rate percentage
    const growthRate =
      usersCreatedPrevious30Days > 0
        ? ((usersCreatedLast30Days - usersCreatedPrevious30Days) /
            usersCreatedPrevious30Days) *
          100
        : usersCreatedLast30Days * 100; // If no users in previous period, growth is 100% of new users

    return NextResponse.json({
      count: totalUsers,
      activeUsersLast30Days: activeUsersCount,
      userGrowthRate: growthRate,
      newUsersLast30Days: usersCreatedLast30Days,
    });
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
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
