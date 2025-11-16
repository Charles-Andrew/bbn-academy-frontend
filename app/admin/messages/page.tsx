"use client";

import { Eye, EyeOff, MessageCircle, Reply, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { ContactMessage } from "@/types/contact";

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateMessageStatus = async (
    messageId: string,
    status: "unread" | "read" | "replied",
  ) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
      );
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || message.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "read":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "replied":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const unreadCount = messages.filter((msg) => msg.status === "unread").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage contact form submissions
            {unreadCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                ({unreadCount} unread)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <Card
              key={message.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {message.full_name}
                      </h3>
                      <Badge className={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {message.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Purpose: {message.purpose}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(message.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>

                <div className="flex gap-2">
                  {message.status === "unread" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(message.id, "read")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                  {message.status === "read" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(message.id, "replied")}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Mark as Replied
                    </Button>
                  )}
                  {message.status === "replied" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(message.id, "unread")}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Mark as Unread
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`mailto:${message.email}`)}
                  >
                    Reply via Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No messages found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No contact form submissions yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
