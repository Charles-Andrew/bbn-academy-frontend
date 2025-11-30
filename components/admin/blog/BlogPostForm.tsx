"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Eye, Loader2, Save, Upload } from "lucide-react";
import Image from "next/image";
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
import { useAdminStore } from "@/store/admin-store";
import type { BlogTag } from "@/types/blog";
import { TagSelector } from "./TagSelector";

// Create a form-specific schema that matches our form structure
const blogPostFormSchema = z.object({
  title: z.string().min(1, "Blog title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Blog content must be at least 10 characters"),
  authorId: z.string().uuid().optional(),
  isPublished: z.boolean(),
  publishedAt: z.string().optional(),
  readingTime: z.number().optional(),
  tags: z.array(z.string()),
  featured: z.boolean(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
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
  const [estimatedReadingTime, setEstimatedReadingTime] = useState<
    number | null
  >(null);
  const [featuredMedia, setFeaturedMedia] = useState<File | null>(null);
  const [currentFeaturedMediaUrl, setCurrentFeaturedMediaUrl] = useState<
    string | null
  >(null);
  const [currentFeaturedMediaType, setCurrentFeaturedMediaType] = useState<
    "image" | "video" | null
  >(null);
  const [_tempPostId, setTempPostId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshBlogPosts } = useAdminStore();

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      authorId: "",
      isPublished: false,
      publishedAt: "",
      readingTime: 0,
      tags: [],
      featured: false,
      seoTitle: "",
      seoDescription: "",
    },
  });

  // Function to check if form has changes from initial values
  const _hasFormChanges = useCallback(() => {
    // Disable button while form is resetting
    if (isResetting) return false;

    const currentValues = form.getValues();

    // For new posts, check if title has content (allow draft saving with minimal content)
    if (!postId) {
      return currentValues.title?.trim().length > 0 || featuredMedia !== null;
    }

    // For existing posts, check if any field has changed
    const fieldsToCheck = [
      "title",
      "slug",
      "excerpt",
      "content",
      "isPublished",
      "publishedAt",
      "tags",
    ];

    return (
      fieldsToCheck.some((field) => {
        // Use dirty fields as additional check
        return form.formState.dirtyFields[
          field as keyof typeof form.formState.dirtyFields
        ];
      }) || featuredMedia !== null
    );
  }, [postId, form, isResetting, featuredMedia]);

  // Function to check if form is valid for publishing (has required content)
  const canPublish = useCallback(() => {
    const currentValues = form.getValues();
    return (
      currentValues.title?.trim().length > 0 &&
      currentValues.content?.trim().length >= 10
    );
  }, [form]);

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

  // Reset form when postId changes or when dialog opens for new post
  useEffect(() => {
    // Only reset if dialog is open
    if (!open) return;

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
                featured: post.featured || false,
                isPublished: post.is_published || false,
                publishedAt: post.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 10)
                  : undefined,
                tags: tagNames,
              });

              setEstimatedReadingTime(post.reading_time);
              setCurrentFeaturedMediaUrl(post.featured_media_url || null);
              setCurrentFeaturedMediaType(post.featured_media_type || null);
              setFeaturedMedia(null); // Clear any selected file
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
          isPublished: false,
          publishedAt: undefined,
          tags: [],
          featured: false,
          seoTitle: "",
          seoDescription: "",
        });
        setEstimatedReadingTime(null);
        setFeaturedMedia(null);
        setCurrentFeaturedMediaUrl(null);
        setCurrentFeaturedMediaType(null);
        setTempPostId(
          `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        );
      }

      // Small delay to ensure form state is updated
      setTimeout(() => setIsResetting(false), 50);
    };

    resetForm();
  }, [postId, form, open]);

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
  const handleContentChange = (content: string) => {
    form.setValue("content", content);

    if (content.trim()) {
      const readingTime = calculateReadingTime(content);
      setEstimatedReadingTime(readingTime);
      // Also update form value
      form.setValue("readingTime", readingTime);
    } else {
      setEstimatedReadingTime(null);
      form.setValue("readingTime", 0);
    }
  };

  // Handle featured media selection
  const handleFeaturedMediaChange = (file: File | null) => {
    if (file) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      // Validate file size
      if (isVideo && file.size > 25 * 1024 * 1024) {
        toast.error(
          `Video file too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 25MB for videos.`,
        );
        return;
      }

      if (isImage && file.size > 10 * 1024 * 1024) {
        toast.error(
          `Image file too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 10MB for images.`,
        );
        return;
      }
    }

    setFeaturedMedia(file);
  };

  const watchedTitle = form.watch("title");
  const watchedSlug = form.watch("slug");
  const watchedTags = form.watch("tags");

  const handlePublish = async (values: BlogPostFormData) => {
    setIsSubmitting("publish");
    let uploadToastId: string | number | undefined;

    try {
      // Show uploading toast for featured media
      if (featuredMedia) {
        const mediaType = featuredMedia.type.startsWith("video/")
          ? "video"
          : "image";
        uploadToastId = toast.loading(`Uploading ${mediaType}...`);
      }

      // Show creating/updating toast
      const action = postId ? "Updating" : "Creating";
      const creationToastId = toast.loading(`${action} blog post...`);

      // Create FormData for submission
      const formData = new FormData();

      // Add all form fields
      formData.append("title", values.title);
      formData.append("slug", values.slug || "");
      formData.append("excerpt", values.excerpt || "");
      formData.append("content", values.content);
      formData.append("authorId", values.authorId || "");
      formData.append("featured", values.featured ? "true" : "false");
      formData.append("isPublished", "true");
      formData.append(
        "publishedAt",
        values.publishedAt || new Date().toISOString().slice(0, 10),
      );
      formData.append("readingTime", (values.readingTime || 0).toString());
      formData.append("tags", JSON.stringify(values.tags || []));

      // Add featured media if selected
      if (featuredMedia) {
        formData.append("featuredMedia", featuredMedia);
      }

      const url = postId ? `/api/admin/blogs/${postId}` : "/api/admin/blogs";
      const method = postId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${postId ? "update" : "publish"} post`,
        );
      }

      // Update toasts to show success
      if (uploadToastId && featuredMedia) {
        const mediaType = featuredMedia.type.startsWith("video/")
          ? "Video"
          : "Image";
        toast.success(`${mediaType} uploaded successfully!`, {
          id: uploadToastId,
        });
      }

      toast.success(`Post ${postId ? "updated" : "published"} successfully!`, {
        id: creationToastId,
      });

      // Refresh blog posts list and wait for completion
      await refreshBlogPosts();

      // Call success callback
      onSuccess?.();

      // Reset form for new post if this was a create operation
      if (!postId) {
        setTimeout(async () => {
          await form.reset({
            title: "",
            slug: undefined,
            excerpt: "",
            content: "",
            isPublished: false,
            publishedAt: undefined,
            tags: [],
            featured: false,
            seoTitle: "",
            seoDescription: "",
          });
          setEstimatedReadingTime(null);
          setFeaturedMedia(null);
          setCurrentFeaturedMediaUrl(null);
          setCurrentFeaturedMediaType(null);
        }, 50);
      }

      // Close form after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (error) {
      console.error("Blog post submission error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to publish post";

      // Dismiss any loading toasts
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSaveDraft = async (values: BlogPostFormData) => {
    setIsSubmitting("draft");
    let uploadToastId: string | number | undefined;

    try {
      // Show uploading toast for featured media
      if (featuredMedia) {
        const mediaType = featuredMedia.type.startsWith("video/")
          ? "video"
          : "image";
        uploadToastId = toast.loading(`Uploading ${mediaType}...`);
      }

      // Show saving draft toast
      const draftToastId = toast.loading("Saving draft...");

      // Create FormData for draft submission
      const formData = new FormData();

      // Add all form fields
      formData.append("title", values.title || "");
      formData.append("slug", values.slug || "");
      formData.append("excerpt", values.excerpt || "");
      formData.append("content", values.content || "Draft content");
      formData.append("authorId", values.authorId || "");
      formData.append("featured", values.featured ? "true" : "false");
      formData.append("isPublished", "false");
      formData.append("publishedAt", "");
      formData.append("readingTime", "1"); // Minimum 1 for validation
      formData.append("tags", JSON.stringify(values.tags || []));

      // Add featured media if selected
      if (featuredMedia) {
        formData.append("featuredMedia", featuredMedia);
      }

      const url = postId ? `/api/admin/blogs/${postId}` : "/api/admin/blogs";
      const method = postId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save draft`);
      }

      // Update toasts to show success
      if (uploadToastId && featuredMedia) {
        const mediaType = featuredMedia.type.startsWith("video/")
          ? "Video"
          : "Image";
        toast.success(`${mediaType} uploaded successfully!`, {
          id: uploadToastId,
        });
      }

      toast.success(`Draft ${postId ? "updated" : "saved"} successfully!`, {
        id: draftToastId,
      });

      // Refresh blog posts list and wait for completion
      await refreshBlogPosts();

      // Call success callback
      onSuccess?.();

      // Reset form for new post if this was a create operation
      if (!postId) {
        setTimeout(async () => {
          await form.reset({
            title: "",
            slug: undefined,
            excerpt: "",
            content: "",
            isPublished: false,
            publishedAt: undefined,
            tags: [],
            featured: false,
            seoTitle: "",
            seoDescription: "",
          });
          setEstimatedReadingTime(null);
          setFeaturedMedia(null);
          setCurrentFeaturedMediaUrl(null);
          setCurrentFeaturedMediaType(null);
        }, 50);
      }

      // Close form after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (error) {
      console.error("Draft save error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save draft";

      // Dismiss any loading toasts
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submission wrapper that determines which action to take
  const _onFormSubmit = async (values: BlogPostFormData) => {
    console.log("🔍 Form submission started with values:", values);
    console.log("🔍 Form errors:", form.formState.errors);
    console.log("🔍 Featured field value:", values.featured);
    console.log("🔍 isPublished field value:", values.isPublished);

    // Use form's isPublished field to determine action
    if (values.isPublished) {
      await handlePublish(values);
    } else {
      await handleSaveDraft(values);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Prevent closing while submitting
        if (isSubmitting) return;
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {postId ? "Edit Blog Post" : "Create New Blog Post"}
            {isSubmitting && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSubmitting === "draft"
                  ? "Saving draft..."
                  : isSubmitting === "publish"
                    ? "Publishing..."
                    : "Processing..."}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSubmitting
              ? "Please wait while we process your blog post..."
              : postId
                ? "Update your blog post details, content, and settings."
                : "Fill in the details below to create a new blog post."}
          </DialogDescription>
        </DialogHeader>

        <div
          className={`flex-1 overflow-y-auto py-4 ${isSubmitting ? "opacity-75 pointer-events-none" : ""}`}
        >
          <Form {...form}>
            <form className="space-y-6 px-6">
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
              {estimatedReadingTime && !Number.isNaN(estimatedReadingTime) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Estimated reading time: {estimatedReadingTime} minutes
                  </span>
                </div>
              )}

              {/* Publishing Settings */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            console.log("🔍 Featured switch changed:", checked);
                            field.onChange(checked);
                          }}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormLabel>Featured</FormLabel>
                      {/* Remove FormMessage to prevent error display for boolean field */}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            console.log(
                              "🔍 Published switch changed:",
                              checked,
                            );
                            field.onChange(checked);
                          }}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormLabel>Published</FormLabel>
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
                        <Input
                          type="date"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || undefined)
                          }
                          suppressHydrationWarning
                        />
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

              {/* Featured Media Upload */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <FormLabel>Featured Media</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Upload a featured image or video for your blog post. This
                    will be displayed as the main visual.
                  </p>
                </div>

                {/* Current Featured Media Display (for editing) */}
                {postId &&
                  currentFeaturedMediaUrl &&
                  typeof currentFeaturedMediaUrl === "string" &&
                  currentFeaturedMediaUrl.trim() !== "" && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Current Featured Media
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {currentFeaturedMediaType}
                        </span>
                      </div>
                      {currentFeaturedMediaType === "image" ? (
                        currentFeaturedMediaUrl?.trim() ? (
                          <div className="relative w-full max-w-sm h-48">
                            <Image
                              src={currentFeaturedMediaUrl.trim()}
                              alt="Current featured media"
                              className="rounded-lg border"
                              fill
                              sizes="(max-width: 768px) 100vw, 384px"
                            />
                          </div>
                        ) : (
                          <div className="w-full max-w-sm h-48 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground">
                              No image available
                            </span>
                          </div>
                        )
                      ) : currentFeaturedMediaUrl?.trim() ? (
                        <video
                          src={currentFeaturedMediaUrl.trim()}
                          controls
                          className="w-full max-w-sm rounded-lg border"
                          muted
                        >
                          Your browser does not support video tag.
                        </video>
                      ) : (
                        <div className="w-full max-w-sm h-48 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground">
                            No video available
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Uploading a new file will replace this media
                      </p>
                    </div>
                  )}

                {/* Featured Media Uploader */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFeaturedMediaChange(file);
                        // Only show success message if file was accepted
                        const isValidSize =
                          (file.type.startsWith("video/") &&
                            file.size <= 25 * 1024 * 1024) ||
                          (file.type.startsWith("image/") &&
                            file.size <= 10 * 1024 * 1024);

                        if (isValidSize) {
                          const fileType = file.type.startsWith("image/")
                            ? "image"
                            : "video";
                          toast.success(
                            `Selected featured ${fileType}: ${file.name}`,
                          );
                        }
                      }
                    }}
                    className="hidden"
                    id="featured-media-upload"
                  />
                  <label
                    htmlFor="featured-media-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Featured Media
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: Images (JPG, PNG, GIF) up to 10MB and Videos (MP4,
                    WebM) up to 25MB
                  </p>
                  {featuredMedia && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Selected: {featuredMedia.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {featuredMedia.type.startsWith("image/")
                          ? "Image"
                          : "Video"}{" "}
                        • {(featuredMedia.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <FormLabel>Preview</FormLabel>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {form.watch("featured") && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        Featured
                      </Badge>
                    )}
                    <Badge
                      variant={
                        form.watch("isPublished") ? "default" : "secondary"
                      }
                    >
                      {form.watch("isPublished") ? "Published" : "Draft"}
                    </Badge>
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
                  {!canPublish() && !loading && !isSubmitting && (
                    <p className="text-xs text-gray-500">
                      {postId
                        ? "Make changes to enable the update button"
                        : "Add title and at least 10 characters of content to publish"}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        console.log("🔍 Save Draft clicked");
                        // Set form to draft mode and trigger validation/submission
                        try {
                          const currentValues = form.getValues();
                          console.log("🔍 Current form values:", currentValues);
                          console.log(
                            "🔍 Form errors before draft:",
                            form.formState.errors,
                          );

                          // Set to draft mode
                          await form.setValue("isPublished", false, {
                            shouldValidate: false,
                            shouldDirty: true,
                          });

                          // Trigger form submission manually for draft
                          const isValid = await form.trigger();
                          console.log("🔍 Form validation result:", isValid);

                          if (isValid) {
                            const draftValues = form.getValues();
                            await handleSaveDraft(draftValues);
                          }
                        } catch (error) {
                          console.error("🔍 Error in Save Draft:", error);
                        }
                      }}
                      disabled={isSubmitting !== false}
                    >
                      {isSubmitting === "draft" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Draft
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        console.log("🔍 Publish clicked");
                        // Set form to published mode and trigger validation/submission
                        try {
                          const currentValues = form.getValues();
                          console.log("🔍 Current form values:", currentValues);
                          console.log(
                            "🔍 Form errors before publish:",
                            form.formState.errors,
                          );

                          // Set to published mode
                          await form.setValue("isPublished", true, {
                            shouldValidate: false,
                            shouldDirty: true,
                          });

                          // Trigger form validation
                          const isValid = await form.trigger();
                          console.log("🔍 Form validation result:", isValid);

                          if (isValid) {
                            const publishValues = form.getValues();
                            await handlePublish(publishValues);
                          }
                        } catch (error) {
                          console.error("🔍 Error in Publish:", error);
                        }
                      }}
                      disabled={isSubmitting !== false}
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
