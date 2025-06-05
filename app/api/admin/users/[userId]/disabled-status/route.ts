import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const userId = params.userId;
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

    // Get request body to determine the new disabled status
    const body = await request.json();
    const isDisabled = !!body.isDisabled;

    // Check if the user is trying to disable their own account
    if (userId === decodedToken.uid) {
      return NextResponse.json(
        { error: "You cannot modify your own account status" },
        { status: 400 },
      );
    }

    // Update the user's disabled status
    if (isDisabled) {
      await getAuth().updateUser(userId, { disabled: true });
    } else {
      await getAuth().updateUser(userId, { disabled: false });
    }

    return NextResponse.json({
      success: true,
      message: `User ${isDisabled ? "disabled" : "enabled"} successfully`,
    });
  } catch (error: any) {
    console.error("Error updating user disabled status:", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
