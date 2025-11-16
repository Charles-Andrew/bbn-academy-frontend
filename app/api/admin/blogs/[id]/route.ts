import { type NextRequest, NextResponse } from "next/server";
import { refreshBlogCache } from "@/data/blogs";
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

    const body = await request.json();

    // Validate request body
    const validatedData = blogPostSchema.parse(body);

    // Get current post to check if slug changed
    const currentPost = await getBlogPostById(postId);

    // Handle slug uniqueness
    let slug = validatedData.slug;
    if (slug && slug !== currentPost.slug) {
      slug = await generateUniqueSlug(slug, postId);
    } else if (!slug) {
      // Generate slug from title if not provided
      slug = await generateUniqueSlug(validatedData.title, postId);
    } else {
      slug = currentPost.slug; // Keep existing slug
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
    const updateData = {
      title: validatedData.title,
      slug,
      excerpt: validatedData.excerpt,
      content: validatedData.content,
      featured_image: validatedData.featuredImage || null,
      published_at: publishedAt,
      is_published: validatedData.isPublished,
      reading_time: readingTime,
      featured: validatedData.featured,
      seo_title: validatedData.seoTitle,
      seo_description: validatedData.seoDescription,
    };

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
    await refreshBlogCache();

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

    await deleteBlogPost(postId);

    // Refresh cache
    await refreshBlogCache();

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
      await refreshBlogCache();

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
