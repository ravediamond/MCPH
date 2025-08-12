import {
  AuditEventType,
  AuditSeverity,
  AuditLogEntry,
} from "../shared/types/crate";
import { db } from "./firebaseService";
import { v4 as uuidv4 } from "uuid";

const AUDIT_LOGS_COLLECTION = "auditLogs";

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  resourceId?: string;
  resourceType?: string;
  resourceOwner?: string;
  mcpTool?: string;
  mcpClientId?: string;
  apiKeyId?: string;
}

export interface CreateAuditLogOptions {
  eventType: AuditEventType;
  action: string;
  context?: AuditContext;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
  severity?: AuditSeverity;
}

class AuditService {
  private readonly collectionName = AUDIT_LOGS_COLLECTION;

  /**
   * Create an audit log entry
   */
  async createAuditLog(options: CreateAuditLogOptions): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        eventType: options.eventType,
        severity:
          options.severity || this.getSeverityForEventType(options.eventType),
        action: options.action,
        success: options.success ?? true,
        ...options.context,
        details: options.details || undefined,
        metadata: {
          ...options.metadata,
          environment: process.env.NODE_ENV || "development",
          version: process.env.APP_VERSION || "unknown",
        },
        errorMessage: options.errorMessage || undefined,
      };

      await db
        .collection(this.collectionName)
        .doc(auditEntry.id)
        .set(this.toFirestoreData(auditEntry));

      // Log critical events to console for immediate visibility
      if (auditEntry.severity === AuditSeverity.CRITICAL) {
        console.error(`[AUDIT CRITICAL] ${auditEntry.action}`, {
          eventType: auditEntry.eventType,
          userId: auditEntry.userId,
          details: auditEntry.details,
        });
      }
    } catch (error) {
      console.error("Failed to create audit log entry:", error);
      // Don't throw - audit logging shouldn't break main functionality
    }
  }

  /**
   * Determine default severity based on event type
   */
  private getSeverityForEventType(eventType: AuditEventType): AuditSeverity {
    const severityMap: Record<AuditEventType, AuditSeverity> = {
      // Authentication - Medium to High
      [AuditEventType.LOGIN]: AuditSeverity.LOW,
      [AuditEventType.LOGOUT]: AuditSeverity.LOW,
      [AuditEventType.LOGIN_FAILED]: AuditSeverity.MEDIUM,
      [AuditEventType.API_KEY_CREATED]: AuditSeverity.MEDIUM,
      [AuditEventType.API_KEY_DELETED]: AuditSeverity.MEDIUM,

      // Crate operations - Low to Medium
      [AuditEventType.CRATE_CREATED]: AuditSeverity.LOW,
      [AuditEventType.CRATE_UPDATED]: AuditSeverity.LOW,
      [AuditEventType.CRATE_DELETED]: AuditSeverity.MEDIUM,
      [AuditEventType.CRATE_VIEWED]: AuditSeverity.LOW,
      [AuditEventType.CRATE_DOWNLOADED]: AuditSeverity.LOW,
      [AuditEventType.CRATE_SHARED]: AuditSeverity.LOW,
      [AuditEventType.CRATE_UNSHARED]: AuditSeverity.LOW,
      [AuditEventType.CRATE_COPIED]: AuditSeverity.LOW,

      // Admin operations - High
      [AuditEventType.USER_ROLE_ASSIGNED]: AuditSeverity.HIGH,
      [AuditEventType.USER_ROLE_REMOVED]: AuditSeverity.HIGH,
      [AuditEventType.USER_DISABLED]: AuditSeverity.HIGH,
      [AuditEventType.USER_ENABLED]: AuditSeverity.HIGH,
      [AuditEventType.ADMIN_CRATE_DELETED]: AuditSeverity.HIGH,

      // MCP operations - Low
      [AuditEventType.MCP_TOOL_CALLED]: AuditSeverity.LOW,
      [AuditEventType.MCP_CLIENT_REGISTERED]: AuditSeverity.LOW,

      // Security events - High to Critical
      [AuditEventType.RATE_LIMIT_EXCEEDED]: AuditSeverity.MEDIUM,
      [AuditEventType.UNAUTHORIZED_ACCESS]: AuditSeverity.HIGH,
      [AuditEventType.SUSPICIOUS_ACTIVITY]: AuditSeverity.CRITICAL,
    };

    return severityMap[eventType] || AuditSeverity.MEDIUM;
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(options: {
    userId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      let query = db
        .collection(this.collectionName)
        .orderBy("timestamp", "desc");

      // Apply filters
      if (options.userId) {
        query = query.where("userId", "==", options.userId);
      }
      if (options.eventType) {
        query = query.where("eventType", "==", options.eventType);
      }
      if (options.severity) {
        query = query.where("severity", "==", options.severity);
      }
      if (options.resourceId) {
        query = query.where("resourceId", "==", options.resourceId);
      }
      if (options.startDate) {
        query = query.where("timestamp", ">=", options.startDate);
      }
      if (options.endDate) {
        query = query.where("timestamp", "<=", options.endDate);
      }

      // Apply pagination
      if (options.offset) {
        const offsetSnapshot = await query.limit(options.offset).get();
        if (!offsetSnapshot.empty) {
          query = query.startAfter(
            offsetSnapshot.docs[offsetSnapshot.docs.length - 1],
          );
        }
      }

      const limit = Math.min(options.limit || 100, 1000); // Max 1000 per request
      query = query.limit(limit);

      const snapshot = await query.get();
      const logs = snapshot.docs.map(
        (doc) => this.fromFirestoreData(doc.data()) as AuditLogEntry,
      );

      // Get total count (this is expensive, consider caching)
      // For now, return the number of logs we got as a simple approximation
      const total = logs.length;

      return { logs, total };
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    failedEvents: number;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    try {
      // Use the existing getAuditLogs method to retrieve logs with filters
      const { logs } = await this.getAuditLogs({
        startDate: options.startDate,
        endDate: options.endDate,
        userId: options.userId,
        limit: 10000, // Large limit for stats calculation
      });

      // Calculate statistics
      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      const userCounts: Record<string, number> = {};
      let failedEvents = 0;

      logs.forEach((log) => {
        // Count by event type
        eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;

        // Count by severity
        eventsBySeverity[log.severity] =
          (eventsBySeverity[log.severity] || 0) + 1;

        // Count failed events
        if (!log.success) {
          failedEvents++;
        }

        // Count by user
        if (log.userId) {
          userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
        }
      });

      // Top users
      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEvents: logs.length,
        eventsByType,
        eventsBySeverity,
        failedEvents,
        topUsers,
      };
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        failedEvents: 0,
        topUsers: [],
      };
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const query = db
        .collection(this.collectionName)
        .where("timestamp", "<", cutoffDate)
        .limit(500); // Process in batches

      const snapshot = await query.get();
      if (snapshot.empty) {
        return 0;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Deleted ${snapshot.size} old audit log entries`);
      return snapshot.size;
    } catch (error) {
      console.error("Failed to clean up old audit logs:", error);
      return 0;
    }
  }

  /**
   * Search audit logs by action or details content
   */
  async searchAuditLogs(
    searchQuery: string,
    options: {
      limit?: number;
      userId?: string;
      severity?: AuditSeverity;
    } = {},
  ): Promise<AuditLogEntry[]> {
    try {
      // This is a basic implementation - for production, consider using Elasticsearch or similar
      const logs = await this.getAuditLogs({
        userId: options.userId,
        severity: options.severity,
        limit: options.limit || 100,
      });

      const searchTerm = searchQuery.toLowerCase();
      return logs.logs.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm) ||
          (log.details &&
            JSON.stringify(log.details).toLowerCase().includes(searchTerm)) ||
          (log.errorMessage &&
            log.errorMessage.toLowerCase().includes(searchTerm)),
      );
    } catch (error) {
      console.error("Failed to search audit logs:", error);
      return [];
    }
  }

  /**
   * Convert to Firestore format
   */
  private toFirestoreData(data: any): any {
    const result = { ...data };
    Object.keys(result).forEach((key) => {
      if (result[key] === undefined) {
        delete result[key];
      } else if (result[key] instanceof Date) {
        // Keep Date objects as-is for Firestore
      } else if (typeof result[key] === "object" && result[key] !== null) {
        result[key] = this.toFirestoreData(result[key]);
      }
    });
    return result;
  }

  /**
   * Convert from Firestore format
   */
  private fromFirestoreData(data: any): any {
    if (!data) return null;
    const result = { ...data };
    Object.keys(result).forEach((key) => {
      if (result[key] && typeof result[key].toDate === "function") {
        result[key] = result[key].toDate();
      } else if (typeof result[key] === "object" && result[key] !== null) {
        result[key] = this.fromFirestoreData(result[key]);
      }
    });
    return result;
  }
}

// Singleton instance
export const auditService = new AuditService();

// Convenience functions for common audit events

export async function auditAuthEvent(
  eventType:
    | AuditEventType.LOGIN
    | AuditEventType.LOGOUT
    | AuditEventType.LOGIN_FAILED,
  context: AuditContext,
  success: boolean = true,
  errorMessage?: string,
): Promise<void> {
  const actionMap = {
    [AuditEventType.LOGIN]: "User logged in",
    [AuditEventType.LOGOUT]: "User logged out",
    [AuditEventType.LOGIN_FAILED]: "User login failed",
  };

  await auditService.createAuditLog({
    eventType,
    action: actionMap[eventType],
    context,
    success,
    errorMessage,
  });
}

export async function auditCrateEvent(
  eventType: AuditEventType,
  crateId: string,
  crateTitle: string,
  context: AuditContext,
  details?: Record<string, any>,
): Promise<void> {
  const actionMap: Partial<Record<AuditEventType, string>> = {
    [AuditEventType.CRATE_CREATED]: `Created crate "${crateTitle}"`,
    [AuditEventType.CRATE_UPDATED]: `Updated crate "${crateTitle}"`,
    [AuditEventType.CRATE_DELETED]: `Deleted crate "${crateTitle}"`,
    [AuditEventType.CRATE_VIEWED]: `Viewed crate "${crateTitle}"`,
    [AuditEventType.CRATE_DOWNLOADED]: `Downloaded crate "${crateTitle}"`,
    [AuditEventType.CRATE_SHARED]: `Shared crate "${crateTitle}"`,
    [AuditEventType.CRATE_UNSHARED]: `Unshared crate "${crateTitle}"`,
    [AuditEventType.CRATE_COPIED]: `Copied crate "${crateTitle}"`,
    [AuditEventType.ADMIN_CRATE_DELETED]: `Admin deleted crate "${crateTitle}"`,
  };

  await auditService.createAuditLog({
    eventType,
    action: actionMap[eventType] || `Crate operation: ${eventType}`,
    context: {
      ...context,
      resourceId: crateId,
      resourceType: "crate",
    },
    details,
  });
}

export async function auditAdminEvent(
  eventType: AuditEventType,
  targetUserId: string,
  context: AuditContext,
  details?: Record<string, any>,
): Promise<void> {
  const actionMap: Partial<Record<AuditEventType, string>> = {
    [AuditEventType.USER_ROLE_ASSIGNED]: `Assigned role to user ${targetUserId}`,
    [AuditEventType.USER_ROLE_REMOVED]: `Removed role from user ${targetUserId}`,
    [AuditEventType.USER_DISABLED]: `Disabled user ${targetUserId}`,
    [AuditEventType.USER_ENABLED]: `Enabled user ${targetUserId}`,
  };

  await auditService.createAuditLog({
    eventType,
    action: actionMap[eventType] || `Admin operation: ${eventType}`,
    context: {
      ...context,
      resourceId: targetUserId,
      resourceType: "user",
    },
    details,
    severity: AuditSeverity.HIGH,
  });
}

export async function auditMcpEvent(
  eventType:
    | AuditEventType.MCP_TOOL_CALLED
    | AuditEventType.MCP_CLIENT_REGISTERED,
  context: AuditContext,
  details?: Record<string, any>,
): Promise<void> {
  const actionMap = {
    [AuditEventType.MCP_TOOL_CALLED]: `MCP tool called: ${context.mcpTool}`,
    [AuditEventType.MCP_CLIENT_REGISTERED]: `MCP client registered: ${context.mcpClientId}`,
  };

  await auditService.createAuditLog({
    eventType,
    action: actionMap[eventType],
    context,
    details,
  });
}

export async function auditSecurityEvent(
  eventType: AuditEventType,
  context: AuditContext,
  details?: Record<string, any>,
  severity?: AuditSeverity,
): Promise<void> {
  const actionMap: Partial<Record<AuditEventType, string>> = {
    [AuditEventType.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
    [AuditEventType.UNAUTHORIZED_ACCESS]: "Unauthorized access attempt",
    [AuditEventType.SUSPICIOUS_ACTIVITY]: "Suspicious activity detected",
  };

  await auditService.createAuditLog({
    eventType,
    action: actionMap[eventType] || `Security event: ${eventType}`,
    context,
    details,
    severity: severity || AuditSeverity.HIGH,
    success: false,
  });
}

// Export the main service and collection name
export { AUDIT_LOGS_COLLECTION };
