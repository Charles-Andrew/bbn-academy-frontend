import {
  BookOpen,
  FileText,
  MessageSquare,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get counts from different tables
  const [
    { count: messagesCount },
    { count: booksCount },
    { count: blogsCount },
    { count: engagementsCount },
    { count: productsCount },
  ] = await Promise.all([
    supabase.from("contact_messages").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("engagements").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  // Get unread messages count
  const { count: unreadCount } = await supabase
    .from("contact_messages")
    .select("*", { count: "exact", head: true })
    .eq("status", "unread");

  const stats = [
    {
      title: "Total Messages",
      value: messagesCount || 0,
      icon: MessageSquare,
      description: `${unreadCount || 0} unread`,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Books",
      value: booksCount || 0,
      icon: BookOpen,
      description: "Published books",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Blog Posts",
      value: blogsCount || 0,
      icon: FileText,
      description: "Published articles",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Engagements",
      value: engagementsCount || 0,
      icon: Users,
      description: "Events & workshops",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Products",
      value: productsCount || 0,
      icon: Package,
      description: "Digital & physical",
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your site.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
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
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Activity tracking will be available once data is populated.
            </p>
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
              <div className="font-medium">View Messages</div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}