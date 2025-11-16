"use client";

import { format } from "date-fns";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BlogPostForm } from "@/components/admin/blog/BlogPostForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAdminStore } from "@/store/admin-store";
import type { BlogPost } from "@/types/blog";

export default function BlogsAdminPage() {
  const {
    blogPosts,
    blogPagination,
    blogFilters,
    loading,
    error,
    setBlogFilters,
    refreshBlogPosts,
    removeBlogPost,
    toggleBlogPostPublished,
    setSelectedBlogPost,
  } = useAdminStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Initialize data on component mount
  useEffect(() => {
    refreshBlogPosts();
  }, [refreshBlogPosts]);

  // Handle search and filters
  const handleSearch = (value: string) => {
    setBlogFilters({ search: value });
  };

  const handleStatusFilter = (status: string) => {
    setBlogFilters({
      status: status === "all" ? undefined : (status as "published" | "draft"),
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    setBlogFilters({ sortBy, sortOrder });
  };

  // Handle pagination
  const handlePageChange = (_page: number) => {
    // Note: You'll need to add setBlogPagination to refreshBlogPosts call
    refreshBlogPosts();
  };

  // Form handlers
  const handleNewPost = () => {
    setEditingPostId(null);
    setSelectedBlogPost(null);
    setFormOpen(true);
  };

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingPostId(null);
    setSelectedBlogPost(null);
  };

  const handleFormSuccess = () => {
    refreshBlogPosts();
    handleFormClose();
  };

  // Handle post actions
  const handleTogglePublished = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/blogs/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "toggle_published" }),
      });

      if (!response.ok) throw new Error("Failed to toggle publish status");

      await toggleBlogPostPublished(postId);
      toast.success("Post status updated successfully");
    } catch (_error) {
      toast.error("Failed to update post status");
    }
  };

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/admin/blogs/${postToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete post");

      await removeBlogPost(postToDelete);
      toast.success("Post deleted successfully");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (_error) {
      toast.error("Failed to delete post");
    }
  };

  // Render post status badge
  const renderStatusBadge = (post: BlogPost) => {
    if (post.is_published) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Published
        </Badge>
      );
    } else {
      return <Badge variant="secondary">Draft</Badge>;
    }
  };

  // Format reading time
  const formatReadingTime = (minutes: number | null) => {
    if (!minutes) return "Unknown";
    return `${minutes} min read`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Blog Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your blog posts and content
          </p>
        </div>
        <Button onClick={handleNewPost}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Posts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {blogPagination.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Published
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {blogPosts.filter((p) => p.is_published).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Drafts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {blogPosts.filter((p) => !p.is_published).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={blogFilters.search || ""}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={blogFilters.status || "all"}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${blogFilters.sortBy || "created_at"}-${blogFilters.sortOrder || "desc"}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="published_at-desc">
                  Recently Published
                </SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              onClick={() => refreshBlogPosts()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading posts...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={() => refreshBlogPosts()}>Try Again</Button>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No blog posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {blogFilters.search || blogFilters.status !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by creating your first blog post."}
              </p>
              <Button onClick={handleNewPost}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {post.title}
                        </h3>
                        {post.featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {renderStatusBadge(post)}
                      </div>

                      {post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatReadingTime(post.reading_time)}
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span>Tags:</span>
                            <div className="flex gap-1">
                              {post.tags?.slice(0, 3).map((tag, index) => {
                                // Handle both string and object tag formats
                                const tagValue =
                                  typeof tag === "string"
                                    ? tag
                                    : (tag as any)?.name || `Tag ${index + 1}`;
                                const tagKey =
                                  typeof tag === "string"
                                    ? tag
                                    : (tag as any)?.id || `tag-${index}`;

                                return (
                                  <Badge
                                    key={tagKey}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tagValue}
                                  </Badge>
                                );
                              })}
                              {post.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/blogs/${post.slug}`, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublished(post.id)}
                      >
                        {post.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditPost(post.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {blogPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing{" "}
                    {(blogPagination.page - 1) * blogPagination.limit + 1} to{" "}
                    {Math.min(
                      blogPagination.page * blogPagination.limit,
                      blogPagination.total,
                    )}{" "}
                    of {blogPagination.total} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(blogPagination.page - 1)}
                      disabled={blogPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {blogPagination.page} of {blogPagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(blogPagination.page + 1)}
                      disabled={blogPagination.page === blogPagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blog Post Form Dialog */}
      <BlogPostForm
        isOpen={formOpen}
        onClose={handleFormClose}
        postId={editingPostId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
