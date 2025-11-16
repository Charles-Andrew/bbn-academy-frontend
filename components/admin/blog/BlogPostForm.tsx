"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Eye, Loader2, Save, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { calculateReadingTime, generateUniqueSlugSync } from "@/lib/blog-utils";
import { blogPostSchema } from "@/lib/validations";
import { useAdminStore } from "@/store/admin-store";
import type { BlogMedia, BlogTag } from "@/types/blog";
import { MediaGallery } from "./MediaGallery";
import { MediaUploader } from "./MediaUploader";
import { TagSelector } from "./TagSelector";

// Create a form-specific schema where fields with defaults are required
const blogPostFormSchema = blogPostSchema.extend({
  isPublished: z.boolean(),
  tags: z.array(z.string()),
  featured: z.boolean(),
});

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

interface BlogPostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string | null;
  onSuccess?: () => void;
  loading?: boolean;
}

export function BlogPostForm({
  open,
  onOpenChange,
  postId,
  onSuccess,
  loading = false,
}: BlogPostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<"draft" | "publish" | false>(
    false,
  );
  const [_isDrafting, setIsDrafting] = useState(false);
  const [estimatedReadingTime, setEstimatedReadingTime] = useState<
    number | null
  >(null);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [tempPostId, setTempPostId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { setSelectedBlogPost, refreshBlogPosts } = useAdminStore();

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: "",
      slug: undefined,
      excerpt: "",
      content: "",
      featuredMediaId: null, // Changed from featuredImage
      isPublished: false,
      publishedAt: "",
      tags: [],
      featured: false,
    },
  });

  // Function to check if form has changes from initial values
  const hasFormChanges = useCallback(() => {
    // Disable button while form is resetting
    if (isResetting) return false;

    const currentValues = form.getValues();

    // For new posts, check if required fields have values
    if (!postId) {
      return currentValues.title?.trim() && currentValues.content?.trim();
    }

    // For existing posts, check if any field has changed
    const fieldsToCheck = [
      "title",
      "slug",
      "excerpt",
      "content",
      "featuredMediaId", // Changed from featuredImage
      "isPublished",
      "publishedAt",
      "tags",
      "featured",
      "seoTitle",
      "seoDescription",
    ];

    return fieldsToCheck.some((field) => {
      // Use dirty fields as additional check
      return form.formState.dirtyFields[
        field as keyof typeof form.formState.dirtyFields
      ];
    });
  }, [postId, form, isResetting]);

  // Function to check slug status - simplified to always show auto-generated
  const getSlugStatus = useCallback(() => {
    const currentSlug = form.getValues("slug");

    if (!currentSlug || currentSlug === "") {
      return {
        isAuto: true,
        message: "Slug will be auto-generated from title",
      };
    }

    return { isAuto: true, message: "Auto-generated from title" };
  }, [form]);

  // Reset form when postId changes
  useEffect(() => {
    setIsResetting(true);
    const resetForm = async () => {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (postId) {
        // Load existing post data
        const loadPost = async () => {
          try {
            const response = await fetch(`/api/admin/blogs/${postId}`);
            if (response.ok) {
              const data = await response.json();
              const post = data.post;

              // Transform tags to names array
              const tagNames = post.tags?.map((tag: BlogTag) => tag.name) || [];

              await form.reset({
                title: post.title || "",
                slug: post.slug || "",
                excerpt: post.excerpt || "",
                content: post.content || "",
                featuredMediaId: post.featured_media_id || null, // Changed from featured_image
                isPublished: post.is_published || false,
                publishedAt: post.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 16)
                  : "",
                tags: tagNames,
                featured: post.featured || false,
              });

              setEstimatedReadingTime(post.reading_time);
              setMedia(post.media || []);
            } else {
              toast.error("Failed to load blog post");
            }
          } catch (_error) {
            toast.error("Failed to load blog post");
          }
        };

        loadPost();
      } else {
        // Reset form for new post
        await form.reset({
          title: "",
          slug: undefined,
          excerpt: "",
          content: "",
          featuredMediaId: null, // Changed from featuredImage
          isPublished: false,
          publishedAt: "",
          tags: [],
          featured: false,
        });
        setEstimatedReadingTime(null);
        setMedia([]);
        setTempPostId(
          `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        );
      }

      // Small delay to ensure form state is updated
      setTimeout(() => setIsResetting(false), 50);
    };

    resetForm();
  }, [postId, form]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Auto-generate slug from title with debouncing
  const handleTitleChange = (title: string) => {
    form.setValue("title", title);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for slug generation
    debounceTimerRef.current = setTimeout(() => {
      // Always auto-generate slug from title
      const newSlug = generateUniqueSlugSync(title);
      form.setValue("slug", newSlug, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }, 300); // 300ms debounce for responsive feedback
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
      // If we have temporary media and no postId, we need to create the post first
      if (!postId && media.length > 0 && tempPostId) {
        // Create post as draft first to get a proper ID
        const createData = {
          ...data,
          isPublished: false, // Always create as draft first
        };

        const createResponse = await fetch("/api/admin/blogs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createData),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || "Failed to create blog post");
        }

        const createResult = await createResponse.json();
        const newPostId = createResult.post.id;

        // Now update the temporary media with the correct post ID
        for (const mediaItem of media) {
          try {
            await fetch(`/api/admin/blogs/media/${mediaItem.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                post_id: newPostId,
              }),
            });
          } catch (error) {
            console.error("Failed to update media post ID:", error);
          }
        }

        // Now update the post with the final publication status
        const updateData = {
          ...data,
          isPublished: !isDraft && data.isPublished,
        };

        const updateResponse = await fetch(`/api/admin/blogs/${newPostId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || "Failed to update blog post");
        }

        toast.success(
          `Blog post ${isDraft ? "saved as draft" : "published"} successfully`,
        );
      } else {
        // Normal submission without temporary media
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

        toast.success(
          postId
            ? "Blog post updated successfully"
            : `Blog post ${isDraft ? "saved as draft" : "published"} successfully`,
        );
      }

      // Refresh blog posts list
      await refreshBlogPosts();

      // Clear selected post if editing
      if (postId) {
        setSelectedBlogPost(null);
      }

      // Call success callback
      onSuccess?.();

      // Close form
      onOpenChange(false);
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
    await handleDraftSubmit();
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

  // Handle media upload complete
  const handleMediaUploadComplete = (uploadedMedia: BlogMedia[]) => {
    setMedia((prev) => [...prev, ...uploadedMedia]);
    setShowMediaUploader(false);
    toast.success(
      `Successfully uploaded ${uploadedMedia.length} media file(s)`,
    );
  };

  // Handle media update
  const handleMediaUpdate = (mediaId: string, updates: Partial<BlogMedia>) => {
    setMedia((prev) =>
      prev.map((item) =>
        item.id === mediaId ? { ...item, ...updates } : item,
      ),
    );
  };

  // Handle media delete
  const handleMediaDelete = (mediaId: string) => {
    setMedia((prev) => prev.filter((item) => item.id !== mediaId));
    toast.success("Media deleted successfully");
  };

  // Handle media reorder
  const handleMediaReorder = (mediaIds: string[]) => {
    setMedia((prev) => {
      const mediaMap = new Map(prev.map((item) => [item.id, item]));
      return mediaIds
        .map((id) => mediaMap.get(id))
        .filter(Boolean) as BlogMedia[];
    });
  };

  const watchedTitle = form.watch("title");
  const watchedSlug = form.watch("slug");
  const watchedTags = form.watch("tags");
  const isFeatured = form.watch("featured");

  const handleFormSubmit = form.handleSubmit((data) => onSubmit(data, false)); // Regular submission (publish)
  const handleDraftSubmit = form.handleSubmit((data) => onSubmit(data, true)); // Draft submission

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle>
            {postId ? "Edit Blog Post" : "Create New Blog Post"}
          </DialogTitle>
          <DialogDescription>
            {postId
              ? "Update your blog post details, content, and settings."
              : "Fill in the details below to create a new blog post."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6 px-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter blog post title"
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
                render={({ field }) => {
                  const slugStatus = getSlugStatus();
                  // Always override any error state
                  return (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Slug
                      </div>
                      <FormControl>
                        <Input
                          key={watchedSlug} // Force re-render when slug changes
                          placeholder="blog-post-url"
                          {...field}
                          readOnly // Make field read-only
                          className="bg-muted cursor-not-allowed border-input focus:border-input" // Visual indication it's read-only
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {slugStatus.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{watchedSlug?.length || 0}/200</span>
                          {watchedSlug && watchedSlug.length > 200 && (
                            <span className="text-destructive">Too long</span>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  );
                }}
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
                        placeholder="Brief description of the blog post"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
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
                        placeholder="Write your blog post content here"
                        className="min-h-[400px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleContentChange(e.target.value);
                        }}
                      />
                    </FormControl>
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

              {/* Publishing Settings */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Published</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Featured</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

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

              {/* Tags */}
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

              {/* Media Gallery */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <FormLabel>Media Gallery</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Upload images and videos for your blog post. Click the star
                    icon on any media item to set it as the featured media.
                    Featured media will be prominently displayed.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaUploader(!showMediaUploader)}
                  >
                    {showMediaUploader ? "Cancel" : "Add Media"}
                  </Button>
                </div>

                {/* Featured Media Indicator */}
                {media.some((m) => m.is_featured) && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-600 fill-current" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      Featured media is selected and will be prominently
                      displayed
                    </span>
                  </div>
                )}

                {/* Media Uploader */}
                <AnimatePresence>
                  {showMediaUploader && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <MediaUploader
                        postId={postId || tempPostId || ""}
                        onUploadComplete={handleMediaUploadComplete}
                        onError={(error) => toast.error(error)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Media Gallery */}
                {(postId || media.length > 0) && (
                  <MediaGallery
                    media={media}
                    onMediaUpdate={handleMediaUpdate}
                    onMediaDelete={handleMediaDelete}
                    onMediaReorder={handleMediaReorder}
                    editable={true}
                  />
                )}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <FormLabel>Preview</FormLabel>
                <div className="border rounded-lg p-4 space-y-3">
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
                        <Badge key={tag} variant="outline" className="text-xs">
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
                </div>
              </div>

              <DialogFooter className="border-t pt-4">
                <div className="flex flex-col items-center gap-2 w-full">
                  {!hasFormChanges() && !loading && !isSubmitting && (
                    <p className="text-xs text-gray-500">
                      {postId
                        ? "Make changes to enable the update button"
                        : "Fill in required fields to enable the publish button"}
                    </p>
                  )}
                  <div className="flex gap-2">
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

                    <Button
                      type="submit"
                      disabled={!!isSubmitting || !hasFormChanges()}
                    >
                      {isSubmitting === "publish" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {postId ? "Update Post" : "Publish Post"}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
