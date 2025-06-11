import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "../../../../../lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

// Define an interface for the user stats to include the email property
interface UserWithStats {
  userId: string;
  count: number;
  email?: string; // Optional email property
}

// Define an interface for client stats
interface ClientStats {
  clientId: string;
  count: number;
  name?: string; // Optional client name
}

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

    // Get total MCP calls count
    let totalCalls = 0;

    // Assuming we have a collection for MCP calls - replace with actual collection name
    const mcpCallsSnapshot = await firestore
      .collection("mcpCalls")
      .count()
      .get();
    totalCalls = mcpCallsSnapshot.data()?.count || 0;

    // Get MCP calls per user
    const mcpCallsPerUserSnapshot = await firestore
      .collection("mcpCalls")
      .select("userId")
      .get();

    // Count MCP calls per user
    const callsPerUser = new Map<string, number>();
    mcpCallsPerUserSnapshot.docs.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) {
        callsPerUser.set(userId, (callsPerUser.get(userId) || 0) + 1);
      }
    });

    // Get MCP calls per client - grab both clientId and possibly clientName if available
    const mcpCallsPerClientSnapshot = await firestore
      .collection("mcpCalls")
      .get();

    // Count MCP calls per client
    const callsPerClient = new Map<string, number>();
    const clientNames = new Map<string, string>(); // Store client names if available

    mcpCallsPerClientSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const clientId = data.clientId || "unknown";

      // Store client name if available
      if (data.clientName) {
        clientNames.set(clientId, data.clientName);
      }

      callsPerClient.set(clientId, (callsPerClient.get(clientId) || 0) + 1);
    });

    // Calculate average and max MCP calls per user
    const userIds = Array.from(callsPerUser.keys());
    const totalUsersWithCalls = userIds.length;
    const averageCallsPerUser =
      totalUsersWithCalls > 0 ? totalCalls / totalUsersWithCalls : 0;
    const maxCallsPerUser = Math.max(...Array.from(callsPerUser.values()), 0);

    // Find user with most MCP calls
    let userWithMost: UserWithStats = { userId: "", count: 0 };
    if (maxCallsPerUser > 0) {
      for (const [userId, count] of callsPerUser.entries()) {
        if (count === maxCallsPerUser) {
          userWithMost = { userId, count };
          break;
        }
      }

      // Try to get user email if available
      if (userWithMost.userId) {
        try {
          const userRecord = await getAuth().getUser(userWithMost.userId);
          userWithMost.email = userRecord.email;
        } catch (e) {
          console.warn(`Couldn't fetch email for user ${userWithMost.userId}`);
        }
      }
    }

    // Get max MCP calls per day
    // We'll need to aggregate by day
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentCallsSnapshot = await firestore
      .collection("mcpCalls")
      .where("timestamp", ">=", Timestamp.fromDate(thirtyDaysAgo))
      .get();

    // Aggregate calls by day
    const callsByDay = new Map<string, number>();
    recentCallsSnapshot.docs.forEach((doc) => {
      const timestamp = doc.data().timestamp;
      if (timestamp) {
        const date = timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
        callsByDay.set(dateString, (callsByDay.get(dateString) || 0) + 1);
      }
    });

    const maxCallsPerDay = Math.max(...Array.from(callsByDay.values()), 0);

    // Generate a trend of MCP calls for the last 7 days
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      trend.push({
        date: dateString,
        count: callsByDay.get(dateString) || 0,
      });
    }

    // Get top clients by call count (limited to top 10)
    const topClients: ClientStats[] = Array.from(callsPerClient.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([clientId, count]) => ({
        clientId,
        count,
        name: clientNames.get(clientId),
      }));

    // If no clients with IDs found, add a fallback "unknown" client with the total count
    if (topClients.length === 0 && totalCalls > 0) {
      topClients.push({
        clientId: "unknown",
        count: totalCalls,
        name: "Unknown Client",
      });
    }

    return NextResponse.json({
      totalCalls,
      averagePerUser: averageCallsPerUser,
      maxPerUser: maxCallsPerUser,
      maxPerDay: maxCallsPerDay,
      userWithMost,
      trend,
      topClients, // Add top clients to the response
    });
  } catch (error: any) {
    console.error("Error fetching MCP call stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
