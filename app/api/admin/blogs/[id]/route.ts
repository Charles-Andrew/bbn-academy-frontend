import { type NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import {
  calculateReadingTime,
  deleteBlogPost,
  generateUniqueSlug,
  getBlogPostById,
  toggleBlogPostPublished,
  updateBlogPost,
} from "@/lib/supabase/blog-server";
import { createClient } from "@/lib/supabase/server";
import { blogPostSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const post = await getBlogPostById(postId);

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error in admin blog GET:", error);

    if (
      error instanceof Error &&
      error.message.includes("Failed to fetch blog post")
    ) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const contentType = request.headers.get("content-type");
    let validatedData: z.infer<typeof blogPostSchema>;
    let featuredMediaUrl: string | null = null;
    let featuredMediaType: "image" | "video" | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Handle form data with featured media
      const formData = await request.formData();

      // Extract post data from form fields
      const rawAuthorId = formData.get("authorId") as string;
      const rawReadingTime = formData.get("readingTime") as string;

      const readingTime =
        rawReadingTime &&
        !Number.isNaN(parseInt(rawReadingTime, 10)) &&
        parseInt(rawReadingTime, 10) > 0
          ? parseInt(rawReadingTime, 10)
          : 1;

      // Handle featured media upload
      const featuredMediaFile = formData.get("featuredMedia") as File;
      console.log("Featured media file from FormData:", featuredMediaFile);
      console.log("Featured media file size:", featuredMediaFile?.size);
      console.log("Featured media file name:", featuredMediaFile?.name);

      if (featuredMediaFile && featuredMediaFile.size > 0) {
        // Validate file size based on type
        const isVideo = featuredMediaFile.type.startsWith("video/");
        const isImage = featuredMediaFile.type.startsWith("image/");

        if (isVideo && featuredMediaFile.size > 25 * 1024 * 1024) {
          return NextResponse.json(
            {
              error: "Video file too large",
              details: `Video file size ${(featuredMediaFile.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of 25MB`,
            },
            { status: 400 },
          );
        }

        if (isImage && featuredMediaFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            {
              error: "Image file too large",
              details: `Image file size ${(featuredMediaFile.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of 10MB`,
            },
            { status: 400 },
          );
        }

        const fileExt = featuredMediaFile.name.split(".").pop();
        const fileName = `featured-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const storageBucket = "blog-media"; // Use dedicated blog-media bucket for both images and videos
        const filePath = `blog-media/${fileName}`;

        console.log("Uploading featured media to:", filePath);
        console.log("File type:", featuredMediaFile.type);
        console.log("File extension:", fileExt);
        console.log("Storage bucket:", storageBucket);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(filePath, featuredMediaFile, {
            cacheControl: "3600",
            upsert: false,
          });

        console.log("Upload result:", { uploadData, uploadError });

        if (uploadError) {
          console.error("Featured media upload error:", uploadError);
        } else {
          console.log("Featured media uploaded successfully:", filePath);
          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

          featuredMediaUrl = publicUrl;
          featuredMediaType = featuredMediaFile.type.startsWith("image/")
            ? "image"
            : "video";
        }
      } else {
        console.log("No featured media file found or file size is 0");
      }

      const postData: z.infer<typeof blogPostSchema> & { authorId?: string } = {
        title: formData.get("title") as string,
        slug: formData.get("slug") as string,
        excerpt: formData.get("excerpt") as string,
        content: formData.get("content") as string,
        featured: formData.get("featured") === "true",
        isPublished: formData.get("isPublished") === "true",
        publishedAt: formData.get("publishedAt") as string,
        readingTime,
        tags: formData.get("tags")
          ? JSON.parse(formData.get("tags") as string)
          : [],
      };

      // Only include authorId if it's not empty (it's optional but not nullable in schema)
      if (rawAuthorId && rawAuthorId.trim() !== "") {
        postData.authorId = rawAuthorId;
      }

      // Validate post data
      validatedData = blogPostSchema.parse(postData);
    } else {
      // Handle JSON data (no files)
      const body = await request.json();
      validatedData = blogPostSchema.parse(body);
    }

    // Get current post to check if slug changed and to clean up old featured media
    const currentPost = await getBlogPostById(postId);

    // Clean up old featured media if new one is being uploaded
    if (
      featuredMediaUrl &&
      featuredMediaType &&
      currentPost.featured_media_url
    ) {
      try {
        // Extract file path from current featured media URL
        const currentUrl = new URL(currentPost.featured_media_url);
        const currentFileName = currentUrl.pathname.split("/").pop();
        const bucket = "blog-media";

        if (currentFileName) {
          const currentFilePath = `blog-media/${currentFileName}`;
          console.log("Deleting old featured media:", currentFilePath);

          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([currentFilePath]);

          if (deleteError) {
            console.error(
              "Error deleting old featured media from storage:",
              deleteError,
            );
          } else {
            console.log(
              "Successfully deleted old featured media:",
              currentFilePath,
            );
          }
        }
      } catch (storageError) {
        console.error(
          "Error parsing old featured media URL for deletion:",
          storageError,
        );
      }
    }

    // Handle slug uniqueness with better user input respect
    let slug = validatedData.slug;
    if (!slug || slug.trim() === "") {
      // Generate slug from title if not provided
      slug = await generateUniqueSlug(validatedData.title, postId);
    } else if (slug !== currentPost.slug) {
      // User provided a new slug - clean it up and ensure uniqueness
      slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Ensure uniqueness (excluding current post)
      slug = await generateUniqueSlug(slug, postId);
    } else {
      // Keep existing slug unchanged
      slug = currentPost.slug;
    }

    // Calculate reading time if content changed
    let readingTime = validatedData.readingTime;
    if (!readingTime && validatedData.content !== currentPost.content) {
      readingTime = await calculateReadingTime(validatedData.content);
    } else if (!readingTime) {
      readingTime = currentPost.reading_time || undefined;
    }

    // Handle published_at timestamp
    let publishedAt = currentPost.published_at;
    if (validatedData.isPublished && !currentPost.is_published) {
      // Post is being published for the first time
      publishedAt = validatedData.publishedAt
        ? new Date(validatedData.publishedAt).toISOString()
        : new Date().toISOString();
    } else if (!validatedData.isPublished && currentPost.is_published) {
      // Post is being unpublished
      publishedAt = null;
    } else if (
      validatedData.isPublished &&
      validatedData.publishedAt &&
      validatedData.publishedAt !== currentPost.published_at
    ) {
      // Publication date is being updated
      publishedAt = new Date(validatedData.publishedAt).toISOString();
    }

    // Prepare update data
    const updateData: {
      title: string;
      slug: string;
      excerpt: string | undefined;
      content: string;
      published_at: string | null;
      is_published: boolean;
      reading_time: number | undefined;
      featured: boolean;
      seo_title: string | undefined;
      seo_description: string | undefined;
      featured_media_url?: string;
      featured_media_type?: "image" | "video";
    } = {
      title: validatedData.title,
      slug,
      excerpt: validatedData.excerpt,
      content: validatedData.content,
      published_at: publishedAt,
      is_published: validatedData.isPublished,
      reading_time: readingTime,
      featured: validatedData.featured,
      seo_title: validatedData.seoTitle,
      seo_description: validatedData.seoDescription,
    };

    // Include featured media if uploaded
    if (featuredMediaUrl && featuredMediaType) {
      updateData.featured_media_url = featuredMediaUrl;
      updateData.featured_media_type = featuredMediaType as "image" | "video";
    }

    // Process tags
    const tagIds: string[] = [];
    if (validatedData.tags && validatedData.tags.length > 0) {
      // For each tag, find existing or create new
      for (const tagName of validatedData.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        // Try to find existing tag
        const { data: existingTag } = await supabase
          .from("blog_tags")
          .select("id")
          .eq("slug", tagSlug)
          .single();

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          // Create new tag
          const { data: newTag } = await supabase
            .from("blog_tags")
            .insert({
              name: tagName,
              slug: tagSlug,
            })
            .select("id")
            .single();

          if (newTag) {
            tagIds.push(newTag.id);
          }
        }
      }
    }

    // Update blog post
    const post = await updateBlogPost(postId, updateData, tagIds);

    // Refresh cache

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error in admin blog PUT:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Failed to fetch blog post")
    ) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Get the blog post before deletion to clean up storage
    const post = await getBlogPostById(postId);

    // Delete featured media from storage if it exists
    if (post.featured_media_url) {
      try {
        // Extract file path from URL
        const url = new URL(post.featured_media_url);
        const filePath = url.pathname.split("/").pop(); // Get the filename
        const bucket = "blog-media"; // Use dedicated blog-media bucket for both images and videos

        if (filePath) {
          const fullPath = `blog-media/${filePath}`;
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([fullPath]);

          if (deleteError) {
            console.error(
              "Error deleting featured media from storage:",
              deleteError,
            );
          } else {
            console.log("Successfully deleted featured media:", fullPath);
          }
        }
      } catch (storageError) {
        console.error(
          "Error parsing featured media URL for deletion:",
          storageError,
        );
      }
    }

    // Delete the blog post (this will also cascade delete associated media records)
    await deleteBlogPost(postId);

    // Refresh cache

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin blog DELETE:", error);

    if (
      error instanceof Error &&
      error.message.includes("Failed to fetch blog post")
    ) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Toggle publish status (additional endpoint for convenience)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: postId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "toggle_published") {
      const post = await toggleBlogPostPublished(postId);

      // Refresh cache

      return NextResponse.json({ post });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in admin blog PATCH:", error);

    if (
      error instanceof Error &&
      error.message.includes("Failed to fetch blog post")
    ) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
