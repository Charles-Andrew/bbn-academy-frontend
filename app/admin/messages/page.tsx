"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MessageCard } from "@/components/admin/messages/message-card";
import { MessageDetailModal } from "@/components/admin/messages/message-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ContactMessage } from "@/types/contact";

const CONTACT_PURPOSES = [
  "Book Inquiry",
  "Writing Services",
  "Collaboration",
  "Speaking Engagement",
  "Other",
] as const;

export default function MessagesPage() {
  const supabase = createClient();
  const router = useRouter();

  // State management
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesPerPage = 20;

  // Check authentication status
  const checkAuthentication = useCallback(async () => {
    try {
      setAuthLoading(true);
      console.log("🔍 Checking authentication status...");

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      console.log("📱 Auth response:", { user, error });

      if (error) {
        console.error("❌ Auth error:", error);
        setAuthError(`Auth error: ${error.message}`);
        setIsAuthenticated(false);
        return;
      }

      if (!user) {
        console.log("❌ No authenticated user found");
        setAuthError("No authenticated user found. Please log in first.");
        setIsAuthenticated(false);
        return;
      }

      console.log("👤 User found:", {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        role: user.role,
        aud: user.aud,
      });

      // Check if user is admin
      if (user.email !== "admin@bbnacademy.com") {
        console.log("❌ User is not admin:", user.email);
        setAuthError(`Access denied: ${user.email} is not an admin user`);
        setIsAuthenticated(false);
        return;
      }

      console.log("✅ Admin user authenticated successfully:", user.email);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error("❌ Authentication check failed:", error);
      setAuthError(
        `Authentication check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, [supabase]);

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMessages = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        // First check if user is authenticated
        if (!isAuthenticated) {
          console.log("User not authenticated, skipping message fetch");
          return;
        }

        console.log("🔄 Fetching messages with filters:", {
          statusFilter,
          purposeFilter,
          searchQuery,
          dateFilter,
        });

        // Build API URL with query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: messagesPerPage.toString(),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(purposeFilter !== "all" && { purpose: purposeFilter }),
          ...(searchQuery && { search: searchQuery }),
          ...(dateFilter && { dateFrom: dateFilter }),
        });

        const response = await fetch(`/api/admin/messages?${params}`);

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`,
          );
        }

        const result = await response.json();

        console.log("✅ API Response successful:", {
          messagesCount: result.messages?.length || 0,
          totalCount: result.pagination?.total || 0,
          sampleData: result.messages?.slice(0, 1),
        });

        const transformedMessages: ContactMessage[] = result.messages || [];

        console.log("Final transformed messages:", transformedMessages);

        setMessages(transformedMessages);
        setTotalMessages(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 1);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching messages:", error);
        let errorMessage = "Failed to fetch messages";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Show error state instead of empty state
        setMessages([]);
        setTotalMessages(0);
        setTotalPages(0);
        setAuthError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, purposeFilter, searchQuery, dateFilter, isAuthenticated],
  );

  useEffect(() => {
    if (mounted) {
      checkAuthentication();
    }
  }, [mounted, checkAuthentication]);

  useEffect(() => {
    if (mounted && isAuthenticated && !authLoading) {
      fetchMessages(1);
    }
  }, [mounted, isAuthenticated, authLoading, fetchMessages]);

  // Real-time updates
  useEffect(() => {
    if (!mounted || !isAuthenticated) return; // Don't set up real-time updates if not authenticated

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        () => {
          if (isAuthenticated) {
            fetchMessages(currentPage);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentPage, fetchMessages, isAuthenticated, mounted]);

  // Update message status
  const updateMessageStatus = async (
    messageId: string,
    status: "unread" | "read" | "replied",
  ) => {
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageIds: [messageId],
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update message status: ${response.status} ${response.statusText}`,
        );
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
      );

      // Also update selectedMessage if it's the one being updated
      setSelectedMessage((prev) =>
        prev && prev.id === messageId ? { ...prev, status } : prev,
      );
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  // Selection management
  const _handleSelectAll = () => {
    if (selectedMessageIds.length === messages.length) {
      setSelectedMessageIds([]);
    } else {
      setSelectedMessageIds(messages.map((msg) => msg.id));
    }
  };

  const handleSelectNone = () => {
    setSelectedMessageIds([]);
  };

  const handleToggleSelection = (messageId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId],
    );
  };

  // Message actions
  const handleMessageClick = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
    if (message.status === "unread") {
      updateMessageStatus(message.id, "read");
    }
  };

  const handleBatchStatusUpdate = async (
    messageIds: string[],
    status: "unread" | "read" | "replied",
  ) => {
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageIds,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update messages: ${response.status} ${response.statusText}`,
        );
      }

      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, status } : msg,
        ),
      );
      handleSelectNone();
    } catch (error) {
      console.error("Error updating messages:", error);
    }
  };

  const handleBatchDelete = async (messageIds: string[]) => {
    try {
      const response = await fetch(
        `/api/admin/messages?ids=${messageIds.join(",")}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete messages: ${response.status} ${response.statusText}`,
        );
      }

      setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg.id)));
      handleSelectNone();
    } catch (error) {
      console.error("Error deleting messages:", error);
    }
  };

  const unreadCount = messages.filter((msg) => msg.status === "unread").length;
  const hasActiveFilters =
    statusFilter !== "all" ||
    purposeFilter !== "all" ||
    dateFilter ||
    searchQuery;

  // Pagination controls
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchMessages(page);
    }
  };

  // Show loading state while checking authentication or while the component is mounting
  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  // Show authentication error only after client-side check is complete
  if (mounted && (authError || !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="text-red-600 font-medium">
            Authentication Required
          </div>
          <div className="text-muted-foreground max-w-md">
            {authError ||
              "Please log in as an administrator to access this page."}
          </div>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Messages
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage contact form submissions
              {unreadCount > 0 && (
                <span className="ml-2 text-lava-600 font-medium">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 sm:w-40 h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "h-10 px-3 gap-2 whitespace-nowrap",
                    hasActiveFilters &&
                      "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select
                    value={purposeFilter}
                    onValueChange={setPurposeFilter}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Filter by purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Purposes</SelectItem>
                      {CONTACT_PURPOSES.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    placeholder="Filter by date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-10"
                  />

                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter("all");
                      setPurposeFilter("all");
                      setDateFilter("");
                      setSearchQuery("");
                    }}
                    className="h-10 w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary and Batch Actions */}
      <div className="flex items-center justify-between px-2 py-2">
        <div className="text-sm text-muted-foreground">
          Showing {messages.length} of {totalMessages} messages
          {hasActiveFilters && " (filtered)"}
          {totalPages > 1 && (
            <span className="ml-4">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {selectedMessageIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={loading}
            >
              Clear Selection
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" disabled={loading}>
                  Actions ({selectedMessageIds.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Status Actions */}
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  Update Status
                </div>
                <DropdownMenuItem
                  onClick={() =>
                    handleBatchStatusUpdate(selectedMessageIds, "unread")
                  }
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Mark as Unread
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleBatchStatusUpdate(selectedMessageIds, "read")
                  }
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleBatchStatusUpdate(selectedMessageIds, "replied")
                  }
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Reply className="h-4 w-4" />
                  Mark as Replied
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Other Actions */}
                <DropdownMenuItem
                  onClick={() => {
                    const emails = messages
                      .filter((msg) => selectedMessageIds.includes(msg.id))
                      .map((msg) => msg.email)
                      .filter(
                        (email, index, arr) => arr.indexOf(email) === index,
                      );

                    if (emails.length === 1) {
                      window.open(`mailto:${emails[0]}`);
                    } else {
                      const subject = encodeURIComponent(
                        "Response to your inquiry",
                      );
                      const body = encodeURIComponent(
                        "Dear valued contact,\n\nThank you for reaching out to BBN Academy.\n\n",
                      );
                      window.open(
                        `mailto:${emails.join(",")}?subject=${subject}&body=${body}`,
                      );
                    }
                  }}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Reply via Email
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Dangerous Actions */}
                <DropdownMenuItem
                  onClick={() => {
                    if (
                      confirm(
                        `Delete ${selectedMessageIds.length} selected message${selectedMessageIds.length !== 1 ? "s" : ""}? This action cannot be undone.`,
                      )
                    ) {
                      handleBatchDelete(selectedMessageIds);
                    }
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading messages...</span>
          </div>
        </div>
      )}

      {/* Messages Display */}
      {!loading && messages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              viewMode="grid"
              isSelected={selectedMessageIds.includes(message.id)}
              onSelect={() => handleToggleSelection(message.id)}
              onClick={() => handleMessageClick(message)}
              onStatusUpdate={updateMessageStatus}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !authError && messages.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasActiveFilters ? "No messages found" : "No messages yet"}
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Contact form submissions will appear here"}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setPurposeFilter("all");
                  setDateFilter("");
                  setSearchQuery("");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
            {!hasActiveFilters && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Debug info: Authenticated: {isAuthenticated ? "Yes" : "No"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Manual refresh triggered");
                    fetchMessages(currentPage);
                  }}
                  className="mt-2"
                >
                  Refresh Messages
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Detail Modal */}
      <MessageDetailModal
        message={selectedMessage}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMessage(null);
        }}
        onStatusUpdate={updateMessageStatus}
      />
    </div>
  );
}
