"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { blogPostSchema } from "@/lib/validations";
import { useAdminStore } from "@/store/admin-store";
import type { BlogTag } from "@/types/blog";
import { ImageUploader } from "./ImageUploader";
import { TagSelector } from "./TagSelector";

// Create a form-specific schema where fields with defaults are required
const blogPostFormSchema = blogPostSchema.extend({
  isPublished: z.boolean(),
  tags: z.array(z.string()),
  featured: z.boolean(),
});

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

import { Clock, Eye, FileText, Loader2, Save, Star, X } from "lucide-react";
import { toast } from "sonner";
import { calculateReadingTime, generateUniqueSlugSync } from "@/lib/blog-utils";

interface BlogPostFormProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string | null;
  onSuccess?: () => void;
}

export function BlogPostForm({
  isOpen,
  onClose,
  postId,
  onSuccess,
}: BlogPostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<"draft" | "publish" | false>(
    false,
  );
  const [_isDrafting, setIsDrafting] = useState(false);
  const [estimatedReadingTime, setEstimatedReadingTime] = useState<
    number | null
  >(null);
  const { setSelectedBlogPost, refreshBlogPosts } = useAdminStore();

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      isPublished: false,
      publishedAt: "",
      tags: [],
      featured: false,
      seoTitle: "",
      seoDescription: "",
    },
  });

  // Load post data if editing
  useEffect(() => {
    if (postId && isOpen) {
      const loadPost = async () => {
        try {
          const response = await fetch(`/api/admin/blogs/${postId}`);
          if (response.ok) {
            const data = await response.json();
            const post = data.post;

            // Transform tags to names array
            const tagNames = post.tags?.map((tag: BlogTag) => tag.name) || [];

            form.reset({
              title: post.title || "",
              slug: post.slug || "",
              excerpt: post.excerpt || "",
              content: post.content || "",
              featuredImage: post.featured_image || "",
              isPublished: post.is_published || false,
              publishedAt: post.published_at
                ? new Date(post.published_at).toISOString().slice(0, 16)
                : "",
              tags: tagNames,
              featured: post.featured || false,
              seoTitle: post.seo_title || "",
              seoDescription: post.seo_description || "",
            });

            setEstimatedReadingTime(post.reading_time);
          } else {
            toast.error("Failed to load blog post");
            onClose();
          }
        } catch (_error) {
          toast.error("Failed to load blog post");
          onClose();
        }
      };

      loadPost();
    } else if (!postId && isOpen) {
      // Reset form for new post
      form.reset();
      setEstimatedReadingTime(null);
    }
  }, [postId, isOpen, form, onClose]);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    form.setValue("title", title);

    // Only auto-generate slug if slug is empty or matches the previous auto-generated pattern
    const currentSlug = form.getValues("slug");
    if (!currentSlug || currentSlug === "") {
      const slug = generateUniqueSlugSync(title);
      form.setValue("slug", slug);
    }
  };

  // Calculate reading time when content changes
  const handleContentChange = async (content: string) => {
    form.setValue("content", content);

    if (content.trim()) {
      const readingTime = calculateReadingTime(content);
      setEstimatedReadingTime(readingTime);
    } else {
      setEstimatedReadingTime(null);
    }
  };

  // Handle form submission
  const onSubmit = async (data: BlogPostFormData, isDraft: boolean = false) => {
    setIsSubmitting(isDraft ? "draft" : "publish");

    try {
      // Ensure draft status
      const submitData = {
        ...data,
        isPublished: !isDraft && data.isPublished,
      };

      const url = postId ? `/api/admin/blogs/${postId}` : "/api/admin/blogs";
      const method = postId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save blog post");
      }

      const _result = await response.json();

      toast.success(
        postId
          ? "Blog post updated successfully"
          : `Blog post ${isDraft ? "saved as draft" : "published"} successfully`,
      );

      // Refresh blog posts list
      await refreshBlogPosts();

      // Clear selected post if editing
      if (postId) {
        setSelectedBlogPost(null);
      }

      // Call success callback
      onSuccess?.();

      // Close form
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save blog post",
      );
    } finally {
      setIsSubmitting(false);
      setIsDrafting(false);
    }
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    const data = form.getValues();
    await onSubmit({ ...data, isPublished: false }, true);
  };

  // Handle publish
  const _handlePublish = async () => {
    const data = form.getValues();

    // Set published date if not already set
    if (!data.publishedAt) {
      form.setValue("publishedAt", new Date().toISOString().slice(0, 16));
    }

    await onSubmit({ ...data, isPublished: true }, false);
  };

  const watchedTitle = form.watch("title");
  const _watchedContent = form.watch("content");
  const watchedTags = form.watch("tags");
  const isFeatured = form.watch("featured");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {postId ? "Edit Blog Post" : "Create New Blog Post"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSubmit(data))}
            className="space-y-6"
          >
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter blog post title..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleTitleChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="blog-post-url" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL-friendly version of the title. Auto-generated from
                        title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Featured Image */}
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image</FormLabel>
                      <FormControl>
                        <ImageUploader
                          value={field.value || ""}
                          onChange={(url) => field.onChange(url)}
                          placeholder="Upload a featured image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Excerpt */}
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the blog post..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A short summary that will appear in blog listings and
                        search results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your blog post content here..."
                          className="min-h-[400px]"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleContentChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Main content of your blog post. You can use Markdown for
                        formatting.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reading Time Display */}
                {estimatedReadingTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated reading time: {estimatedReadingTime} minutes
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column - Settings */}
              <div className="space-y-6">
                {/* Publishing Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Publishing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Published Status */}
                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Published
                            </FormLabel>
                            <FormDescription>
                              Make this post visible to visitors
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Published Date */}
                    {form.watch("isPublished") && (
                      <FormField
                        control={form.control}
                        name="publishedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publication Date</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Featured */}
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              Featured
                            </FormLabel>
                            <FormDescription>
                              Show this post in featured sections
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <TagSelector
                              selectedTags={field.value}
                              onTagsChange={field.onChange}
                              placeholder="Add tags to categorize your post"
                              maxTags={10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">SEO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Custom SEO title (optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Custom title for search engines. Leave empty to use
                            the post title.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Custom SEO description (optional)"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Custom meta description for search engines. Leave
                            empty to use the excerpt.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          form.watch("isPublished") ? "default" : "secondary"
                        }
                      >
                        {form.watch("isPublished") ? "Published" : "Draft"}
                      </Badge>
                      {isFeatured && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold">
                        {watchedTitle || "Untitled Post"}
                      </h4>
                      {form.watch("excerpt") && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {form.watch("excerpt")}
                        </p>
                      )}
                    </div>

                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {watchedTags.slice(0, 5).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {watchedTags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{watchedTags.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={!!isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!!isSubmitting}
                >
                  {isSubmitting === "draft" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Draft
                </Button>

                <Button type="submit" disabled={!!isSubmitting}>
                  {isSubmitting === "publish" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {postId ? "Update" : "Publish"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
