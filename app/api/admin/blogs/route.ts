import { type NextRequest, NextResponse } from "next/server";
import { refreshBlogCache } from "@/data/blogs";
import {
  calculateReadingTime,
  createBlogPost,
  generateUniqueSlug,
  getBlogPosts,
} from "@/lib/supabase/blog-server";
import { createClient } from "@/lib/supabase/server";
import {
  blogFiltersSchema,
  blogPostSchema,
  paginationSchema,
} from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const paginationData = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });

    const filtersData = blogFiltersSchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "all",
      author: searchParams.get("author") || undefined,
      tags: searchParams.get("tags")
        ? searchParams.get("tags")?.split(",")
        : undefined,
      featured: searchParams.get("featured")
        ? searchParams.get("featured") === "true"
        : undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const result = await getBlogPosts(paginationData, filtersData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in admin blogs GET:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = blogPostSchema.parse(body);

    // Generate unique slug if not provided
    let slug = validatedData.slug;
    if (!slug) {
      slug = await generateUniqueSlug(validatedData.title);
    } else {
      // Ensure slug is unique
      slug = await generateUniqueSlug(slug);
    }

    // Calculate reading time if not provided
    const readingTime =
      validatedData.readingTime ||
      (await calculateReadingTime(validatedData.content));

    // Set author to current admin user if not provided
    const authorId = validatedData.authorId || user.id;

    // Prepare post data
    const postData = {
      title: validatedData.title,
      slug,
      excerpt: validatedData.excerpt,
      content: validatedData.content,
      featured_image: validatedData.featuredImage || null,
      author_id: authorId,
      published_at:
        validatedData.isPublished && validatedData.publishedAt
          ? new Date(validatedData.publishedAt).toISOString()
          : validatedData.isPublished
            ? new Date().toISOString()
            : null,
      is_published: validatedData.isPublished,
      reading_time: readingTime,
      featured: validatedData.featured,
      seo_title: validatedData.seoTitle,
      seo_description: validatedData.seoDescription,
    };

    // Process tags
    const tagIds: string[] = [];
    if (validatedData.tags && validatedData.tags.length > 0) {
      // For now, we'll handle tag names and create/get them as needed
      // In a more complete implementation, you might want to separate tag creation from post creation
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

    // Create blog post
    const post = await createBlogPost(postData, tagIds);

    // Refresh cache to include new post
    await refreshBlogCache();

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error in admin blogs POST:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
