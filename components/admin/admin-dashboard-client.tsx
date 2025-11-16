"use client";

import {
  BookOpen,
  FileText,
  MessageSquare,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardClient() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    messagesCount: 0,
    unreadCount: 0,
    booksCount: 0,
    blogsCount: 0,
    blogsPublishedCount: 0,
    blogsDraftCount: 0,
    engagementsCount: 0,
    engagementsUpcomingCount: 0,
    engagementsOngoingCount: 0,
    engagementsCompletedCount: 0,
    engagementsFeaturedCount: 0,
    productsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { count: messagesCount },
        { count: booksCount },
        { count: blogsCount },
        { count: blogsPublishedCount },
        { count: blogsDraftCount },
        { count: engagementsCount },
        { count: engagementsUpcomingCount },
        { count: engagementsOngoingCount },
        { count: engagementsCompletedCount },
        { count: engagementsFeaturedCount },
        { count: productsCount },
      ] = await Promise.all([
        supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true),
        supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("is_published", false),
        supabase
          .from("engagements")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("engagements")
          .select("*", { count: "exact", head: true })
          .eq("status", "upcoming"),
        supabase
          .from("engagements")
          .select("*", { count: "exact", head: true })
          .eq("status", "ongoing"),
        supabase
          .from("engagements")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed"),
        supabase
          .from("engagements")
          .select("*", { count: "exact", head: true })
          .eq("is_featured", true),
        supabase.from("products").select("*", { count: "exact", head: true }),
      ]);

      // Get unread messages count
      const { count: unreadCount } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "unread");

      setStats({
        messagesCount: messagesCount || 0,
        unreadCount: unreadCount || 0,
        booksCount: booksCount || 0,
        blogsCount: blogsCount || 0,
        blogsPublishedCount: blogsPublishedCount || 0,
        blogsDraftCount: blogsDraftCount || 0,
        engagementsCount: engagementsCount || 0,
        engagementsUpcomingCount: engagementsUpcomingCount || 0,
        engagementsOngoingCount: engagementsOngoingCount || 0,
        engagementsCompletedCount: engagementsCompletedCount || 0,
        engagementsFeaturedCount: engagementsFeaturedCount || 0,
        productsCount: productsCount || 0,
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for messages, blog posts, and engagements
    const channel = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        (payload) => {
          console.log("Real-time message update:", payload);
          fetchStats(); // Refresh stats when messages change
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blog_posts",
        },
        (payload) => {
          console.log("Real-time blog post update:", payload);
          fetchStats(); // Refresh stats when blog posts change
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "engagements",
        },
        (payload) => {
          console.log("Real-time engagement update:", payload);
          fetchStats(); // Refresh stats when engagements change
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats, supabase.channel, supabase.removeChannel]);

  const statsData = [
    {
      title: "Total Messages",
      value: stats.messagesCount,
      icon: MessageSquare,
      description: `${stats.unreadCount} unread`,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Books",
      value: stats.booksCount,
      icon: BookOpen,
      description: "Published books",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Blog Posts",
      value: stats.blogsCount,
      icon: FileText,
      description: `${stats.blogsPublishedCount} published, ${stats.blogsDraftCount} drafts`,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Engagements",
      value: stats.engagementsCount,
      icon: Users,
      description: `${stats.engagementsUpcomingCount} upcoming, ${stats.engagementsOngoingCount} ongoing`,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Products",
      value: stats.productsCount,
      icon: Package,
      description: "Digital & physical",
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statsData.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Live updates enabled</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Dashboard updates automatically when new messages arrive.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/messages"
              className="block p-3 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="font-medium flex items-center justify-between">
                View Messages
                {stats.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Manage contact form submissions
              </div>
            </a>
            <a
              href="/admin/books"
              className="block p-3 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="font-medium">Manage Books</div>
              <div className="text-sm text-muted-foreground">
                Add, edit, or remove books
              </div>
            </a>
            <a
              href="/admin/blogs"
              className="block p-3 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="font-medium">Manage Blog Posts</div>
              <div className="text-sm text-muted-foreground">
                Create and edit blog content
              </div>
            </a>
            <a
              href="/admin/engagements"
              className="block p-3 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="font-medium flex items-center justify-between">
                Manage Engagements
                {stats.engagementsUpcomingCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.engagementsUpcomingCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Organize events, workshops, and coaching sessions
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
