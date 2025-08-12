import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/firebaseAdmin";
import { Role, Permission } from "@/lib/types/rbac";
import { parseCustomClaims, hasPermission } from "@/lib/rbac";
import { auditService } from "@/services/auditService";
import { AuditEventType, AuditSeverity } from "@/shared/types/crate";

// GET /api/admin/audit-logs - Get audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const { role } = parseCustomClaims(decodedToken.customClaims || {});

    // Check permissions - only admins can view audit logs
    if (!hasPermission(role, Permission.VIEW_AUDIT_LOGS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const eventType = searchParams.get("eventType") as AuditEventType | null;
    const severity = searchParams.get("severity") as AuditSeverity | null;
    const userId = searchParams.get("userId");
    const resourceId = searchParams.get("resourceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000); // Max 1000
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");
    const exportFormat = searchParams.get("export");

    // Build filter options
    const filterOptions: any = {
      limit,
      offset,
    };

    if (eventType && Object.values(AuditEventType).includes(eventType)) {
      filterOptions.eventType = eventType;
    }

    if (severity && Object.values(AuditSeverity).includes(severity)) {
      filterOptions.severity = severity;
    }

    if (userId) {
      filterOptions.userId = userId;
    }

    if (resourceId) {
      filterOptions.resourceId = resourceId;
    }

    if (startDate) {
      filterOptions.startDate = new Date(startDate);
    }

    if (endDate) {
      filterOptions.endDate = new Date(endDate);
    }

    // Get audit logs
    let logs, total;
    if (search) {
      // Use search functionality
      const searchResults = await auditService.searchAuditLogs(search, {
        userId: filterOptions.userId,
        severity: filterOptions.severity,
        limit: filterOptions.limit,
      });
      logs = searchResults;
      total = searchResults.length;
    } else {
      // Use regular filtered query
      const result = await auditService.getAuditLogs(filterOptions);
      logs = result.logs;
      total = result.total;
    }

    // Handle CSV export
    if (exportFormat === "csv") {
      const csvHeaders = [
        "Timestamp",
        "Event Type",
        "Severity",
        "User ID",
        "User Email",
        "User Role",
        "Action",
        "Success",
        "IP Address",
        "User Agent",
        "Resource ID",
        "Resource Type",
        "MCP Tool",
        "Error Message",
        "Details",
      ];

      const csvRows = logs.map((log) => [
        log.timestamp?.toISOString() || "",
        log.eventType || "",
        log.severity || "",
        log.userId || "",
        log.userEmail || "",
        log.userRole || "",
        log.action || "",
        log.success ? "Yes" : "No",
        log.ipAddress || "",
        log.userAgent || "",
        log.resourceId || "",
        log.resourceType || "",
        log.mcpTool || "",
        log.errorMessage || "",
        JSON.stringify(log.details || {}),
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row
            .map((field) => `"${field.toString().replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Return JSON response
    return NextResponse.json({
      logs,
      total,
      filters: filterOptions,
      pagination: {
        offset,
        limit,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}

// GET /api/admin/audit-logs/stats - Get audit log statistics
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(sessionCookie);
    const { role } = parseCustomClaims(decodedToken.customClaims || {});

    // Check permissions
    if (!hasPermission(role, Permission.VIEW_AUDIT_LOGS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { startDate, endDate, userId } = body;

    const filterOptions: any = {};

    if (startDate) {
      filterOptions.startDate = new Date(startDate);
    }

    if (endDate) {
      filterOptions.endDate = new Date(endDate);
    }

    if (userId) {
      filterOptions.userId = userId;
    }

    const stats = await auditService.getAuditStats(filterOptions);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit statistics" },
      { status: 500 },
    );
  }
}
