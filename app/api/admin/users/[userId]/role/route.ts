import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/firebaseAdmin";
import { Role } from "@/lib/types/rbac";
import { parseCustomClaims, canAssignRole } from "@/lib/rbac";
import {
  assignUserRole,
  getUserRole,
  removeUserRole,
} from "@/services/firebaseService";
import { auditAdminEvent } from "@/services/auditService";
import { AuditEventType } from "@/shared/types/crate";

// GET /api/admin/users/[userId]/role - Get user role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const { role: adminRole } = parseCustomClaims(decodedToken.customClaims || {});

    // Check if admin has permission to view roles
    if (adminRole < Role.ADMIN) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const resolvedParams = await params;
    const userRole = await getUserRole(resolvedParams.userId);

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
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const { role: adminRole } = parseCustomClaims(decodedToken.customClaims || {});

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

    const resolvedParams = await params;
    const success = await assignUserRole(
      resolvedParams.userId,
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

    // Audit the role assignment
    await auditAdminEvent(
      AuditEventType.USER_ROLE_ASSIGNED,
      resolvedParams.userId,
      {
        userId: decodedToken.uid,
        userEmail: decodedToken.email,
        userRole: adminRole,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      {
        assignedRole: newRole,
        previousRole: "unknown", // Could be enhanced by fetching previous role
      },
    );

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
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const { role: adminRole } = parseCustomClaims(decodedToken.customClaims || {});

    const resolvedParams = await params;
    
    // Get current user role to check permissions
    const currentUserRole = await getUserRole(resolvedParams.userId);
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
      resolvedParams.userId,
      decodedToken.uid,
      adminRole,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove role" },
        { status: 500 },
      );
    }

    // Audit the role removal
    await auditAdminEvent(
      AuditEventType.USER_ROLE_REMOVED,
      resolvedParams.userId,
      {
        userId: decodedToken.uid,
        userEmail: decodedToken.email,
        userRole: adminRole,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      {
        removedRole: currentUserRole.role,
        newRole: Role.USER,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user role:", error);
    return NextResponse.json(
      { error: "Failed to remove role" },
      { status: 500 },
    );
  }
}
