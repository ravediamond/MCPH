"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role, Permission } from "@/lib/types/rbac";
import {
  AuditLogEntry,
  AuditEventType,
  AuditSeverity,
} from "@/shared/types/crate";
import { useRouter } from "next/navigation";

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
}

export default function AuditLogsPage() {
  const { user, role, hasPermission } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<
    AuditEventType | ""
  >("");
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | "">(
    "",
  );
  const [selectedUser, setSelectedUser] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [error, setError] = useState("");

  // Check permissions
  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (!hasPermission(Permission.VIEW_AUDIT_LOGS)) {
      router.push("/");
      return;
    }
  }, [user, hasPermission, router]);

  // Fetch audit logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (selectedEventType) params.append("eventType", selectedEventType);
      if (selectedSeverity) params.append("severity", selectedSeverity);
      if (selectedUser) params.append("userId", selectedUser);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      if (searchQuery) params.append("search", searchQuery);

      const token = await user?.getIdToken();
      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data: AuditLogsResponse = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && hasPermission(Permission.VIEW_AUDIT_LOGS)) {
      fetchLogs();
    }
  }, [
    currentPage,
    selectedEventType,
    selectedSeverity,
    selectedUser,
    dateRange,
  ]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        export: "csv",
        limit: "10000", // Large limit for export
      });

      if (selectedEventType) params.append("eventType", selectedEventType);
      if (selectedSeverity) params.append("severity", selectedSeverity);
      if (selectedUser) params.append("userId", selectedUser);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const token = await user?.getIdToken();
      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Error exporting logs:", err);
    }
  };

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.LOW:
        return "bg-green-100 text-green-800 border-green-200";
      case AuditSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case AuditSeverity.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case AuditSeverity.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSuccessIndicator = (success: boolean) => {
    return success ? (
      <span className="text-green-600 font-medium">✓</span>
    ) : (
      <span className="text-red-600 font-medium">✗</span>
    );
  };

  if (!user || !hasPermission(Permission.VIEW_AUDIT_LOGS)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and analyze system audit logs for security and compliance.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={selectedEventType}
                onChange={(e) =>
                  setSelectedEventType(e.target.value as AuditEventType | "")
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Events</option>
                {Object.values(AuditEventType).map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) =>
                  setSelectedSeverity(e.target.value as AuditSeverity | "")
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Severities</option>
                {Object.values(AuditSeverity).map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                placeholder="Filter by user ID"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actions
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions, details, or error messages..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Audit Logs ({total} total)
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.eventType.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {log.userEmail || log.userId || "System"}
                          </div>
                          {log.userRole && (
                            <div className="text-xs text-gray-500">
                              {log.userRole}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{log.action}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(
                            log.severity,
                          )}`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getSuccessIndicator(log.success)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-md max-h-32">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                        {log.errorMessage && (
                          <div className="mt-1 text-xs text-red-600">
                            {log.errorMessage}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, total)} of {total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * pageSize >= total}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
