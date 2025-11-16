"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LogEntry, LogFilterValue, LogLevel } from "@/lib/logging";

export default function LoggingDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState({
    type: "all" as LogFilterValue,
    action: "",
    user_email: "",
    date_from: "",
    date_to: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && filters.type !== "all" && { type: filters.type }),
        ...(filters.action && { action: filters.action }),
        ...(filters.user_email && { user_email: filters.user_email }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      });

      const response = await fetch(`/api/admin/logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getLogTypeBadgeVariant = (type: LogLevel) => {
    switch (type) {
      case "user_action":
        return "default";
      case "error":
        return "destructive";
      case "success":
        return "default";
      case "system":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteOldLogs = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/logs?older_than_days=30", {
        method: "DELETE",
      });
      const _data = await response.json();

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        fetchLogs();
      } else {
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Failed to delete logs:", error);
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      action: "",
      user_email: "",
      date_from: "",
      date_to: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Application Logs</h1>
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="ml-auto">
              Delete Old Logs (30+ days)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Old Logs</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all logs older than 30 days?
                This action cannot be undone and will permanently remove
                historical log data from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteOldLogs}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete Logs"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Select
          value={filters.type}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, type: value as LogFilterValue }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Log Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user_action">User Action</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Action"
          value={filters.action}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, action: e.target.value }))
          }
        />
        <Input
          placeholder="User Email"
          value={filters.user_email}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, user_email: e.target.value }))
          }
        />
        <Input
          type="datetime-local"
          placeholder="From Date"
          value={filters.date_from}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, date_from: e.target.value }))
          }
        />
        <Input
          type="datetime-local"
          placeholder="To Date"
          value={filters.date_to}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, date_to: e.target.value }))
          }
        />
        <Button onClick={clearFilters} variant="outline">
          Clear Filters
        </Button>
      </div>

      {/* Logs Table */}
      <div className="text-sm text-gray-600">
        Showing {logs.length} of {pagination.total} logs
      </div>

      {loading ? (
        <div className="text-center py-8">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No logs found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Sticky Header */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full min-w-[700px]">
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getLogTypeBadgeVariant(log.type)}>
                        {log.type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                      <div className="truncate">{log.details?.info || "-"}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.user_email || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.created_at || "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(prev.pages, prev.page + 1),
              }))
            }
            disabled={pagination.page === pagination.pages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
