import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import { Role } from "@/lib/types/rbac";
import { parseCustomClaims, canAssignRole } from "@/lib/rbac";
import {
  assignUserRole,
  getUserRole,
  removeUserRole,
} from "@/services/firebaseService";

// GET /api/admin/users/[userId]/role - Get user role
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await verifyIdToken(sessionCookie);
    const { role: adminRole } = parseCustomClaims(decodedToken);

    // Check if admin has permission to view roles
    if (adminRole < Role.ADMIN) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const userRole = await getUserRole(params.userId);

    if (!userRole) {
      return NextResponse.json({
        role: Role.USER,
        assignedBy: "system",
        assignedAt: new Date(),
        isActive: true,
      });
    }

    return NextResponse.json(userRole);
  } catch (error) {
    console.error("Error getting user role:", error);
    return NextResponse.json(
      { error: "Failed to get user role" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/users/[userId]/role - Assign role to user
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await verifyIdToken(sessionCookie);
    const { role: adminRole } = parseCustomClaims(decodedToken);

    const { role: newRole } = await request.json();

    if (!Object.values(Role).includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if admin can assign this role
    if (!canAssignRole(adminRole, newRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions to assign this role" },
        { status: 403 },
      );
    }

    const success = await assignUserRole(
      params.userId,
      newRole,
      decodedToken.uid,
      adminRole,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    console.error("Error assigning user role:", error);
    return NextResponse.json(
      { error: "Failed to assign role" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users/[userId]/role - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await verifyIdToken(sessionCookie);
    const { role: adminRole } = parseCustomClaims(decodedToken);

    // Get current user role to check permissions
    const currentUserRole = await getUserRole(params.userId);
    if (!currentUserRole) {
      return NextResponse.json(
        { error: "User has no role to remove" },
        { status: 400 },
      );
    }

    // Check if admin can remove this role
    if (!canAssignRole(adminRole, currentUserRole.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to remove this role" },
        { status: 403 },
      );
    }

    const success = await removeUserRole(
      params.userId,
      decodedToken.uid,
      adminRole,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove role" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user role:", error);
    return NextResponse.json(
      { error: "Failed to remove role" },
      { status: 500 },
    );
  }
}
