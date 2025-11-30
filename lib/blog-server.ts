import type { BlogFiltersData, BlogPaginationData } from "@/lib/validations";
import type { BlogPost as IBlogPost } from "@/types/blog";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/types";

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];

// Type for blog post with joined tags from Supabase
type BlogPostWithTags = BlogPost & {
  post_tags?: Array<{
    blog_tags: BlogTag;
  }>;
};

// Server-side only blog operations
export async function getBlogPosts(
  pagination: BlogPaginationData = { page: 1, limit: 10 },
  filters: BlogFiltersData = {
    status: "all",
    sortBy: "created_at",
    sortOrder: "desc",
  },
) {
  const supabase = await createClient();
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("blog_posts")
    .select(
      `
      *,
      post_tags(
        blog_tags(
          id,
          name,
          slug
        )
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`,
    );
  }

  if (filters.status && filters.status !== "all") {
    if (filters.status === "published") {
      query = query.eq("is_published", true).not("published_at", "is", null);
    } else if (filters.status === "draft") {
      query = query.eq("is_published", false);
    }
  }

  if (filters.author) {
    query = query.eq("author_id", filters.author);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.in("post_tags.blog_tags.slug", filters.tags);
  }

  // Apply sorting
  const sortColumn = filters.sortBy || "created_at";
  const sortOrder = filters.sortOrder || "desc";
  const validSortColumns = [
    "created_at",
    "updated_at",
    "published_at",
    "title",
    "slug",
    "id",
    "excerpt",
    "content",
    "featured_media_url",
    "featured_media_type",
    "author_id",
    "is_published",
    "reading_time",
    "featured",
  ] as const;
  const column = validSortColumns.includes(sortColumn as keyof BlogPost)
    ? sortColumn
    : "created_at";
  query = query.order(column, { ascending: sortOrder === "asc" });

  const {
    data: posts,
    error,
    count,
  } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error("Failed to fetch blog posts");
  }

  // Transform the data to include tags as a simple array of tag names
  const transformedPosts = posts?.map((post: BlogPostWithTags) => {
    return {
      ...post,
      tags:
        post.post_tags?.map((pt) => pt.blog_tags?.name).filter(Boolean) || [],
      media: [], // Empty media array until blog_media table is created
    };
  });

  return {
    posts: transformedPosts,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function getBlogPostBySlug(slug: string): Promise<IBlogPost> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      post_tags(
        blog_tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching blog post by slug:", error);
    throw new Error("Failed to fetch blog post");
  }

  // Transform the data to include tags as a simple array
  const blogPostWithTags = post as BlogPostWithTags;

  const transformedPost: IBlogPost = {
    ...blogPostWithTags,
    tags:
      blogPostWithTags.post_tags
        ?.map((pt) => pt.blog_tags?.name)
        .filter(Boolean) || [],
  };

  return transformedPost;
}

export async function getBlogPostById(id: string): Promise<IBlogPost> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      post_tags(
        blog_tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching blog post by ID:", error);
    throw new Error("Failed to fetch blog post");
  }

  // Transform the data to include tags as a simple array
  const blogPostWithTags = post as BlogPostWithTags;

  const transformedPost: IBlogPost = {
    ...blogPostWithTags,
    tags:
      blogPostWithTags.post_tags
        ?.map((pt) => pt.blog_tags?.name)
        .filter(Boolean) || [],
  };

  return transformedPost;
}

// Export other functions that were in blog.ts but keep them server-only
export * from "./supabase/blog";
