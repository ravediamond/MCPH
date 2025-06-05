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
            return NextResponse.json(
                { error: "Forbidden: User is not an admin" },
                { status: 403 },
            );
        }

        // Get total MCP calls count
        let totalCalls = 0;

        // Assuming we have a collection for MCP calls - replace with actual collection name
        const mcpCallsSnapshot = await firestore.collection("mcpCalls").count().get();
        totalCalls = mcpCallsSnapshot.data()?.count || 0;

        // Get MCP calls per user
        const mcpCallsPerUserSnapshot = await firestore
            .collection("mcpCalls")
            .select("userId")
            .get();

        // Count MCP calls per user
        const callsPerUser = new Map<string, number>();
        mcpCallsPerUserSnapshot.docs.forEach(doc => {
            const userId = doc.data().userId;
            if (userId) {
                callsPerUser.set(userId, (callsPerUser.get(userId) || 0) + 1);
            }
        });

        // Calculate average and max MCP calls per user
        const userIds = Array.from(callsPerUser.keys());
        const totalUsersWithCalls = userIds.length;
        const averageCallsPerUser = totalUsersWithCalls > 0 ? totalCalls / totalUsersWithCalls : 0;
        const maxCallsPerUser = Math.max(...Array.from(callsPerUser.values()), 0);

        // Find user with most MCP calls
        let userWithMost = { userId: "", count: 0 };
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
        recentCallsSnapshot.docs.forEach(doc => {
            const timestamp = doc.data().timestamp;
            if (timestamp) {
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
                callsByDay.set(dateString, (callsByDay.get(dateString) || 0) + 1);
            }
        });

        const maxCallsPerDay = Math.max(...Array.from(callsByDay.values()), 0);

        // Generate a trend of MCP calls for the last 7 days
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            trend.push({
                date: dateString,
                count: callsByDay.get(dateString) || 0
            });
        }

        return NextResponse.json({
            totalCalls,
            averagePerUser: averageCallsPerUser,
            maxPerUser: maxCallsPerUser,
            maxPerDay: maxCallsPerDay,
            userWithMost,
            trend
        });
    } catch (error: any) {
        console.error("Error fetching MCP call stats:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}