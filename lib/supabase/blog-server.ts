import type { BlogFiltersData, BlogPaginationData } from "@/lib/validations";
import { createClient } from "./server";
import type { Database } from "./types";

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"];
type BlogPostUpdate = Database["public"]["Tables"]["blog_posts"]["Update"];
type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];
type BlogTagInsert = Database["public"]["Tables"]["blog_tags"]["Insert"];
type BlogTagUpdate = Database["public"]["Tables"]["blog_tags"]["Update"];
type PostTag = Database["public"]["Tables"]["post_tags"]["Row"];

// Blog Post CRUD Operations (Server-only)
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

  if (filters.featured !== undefined) {
    query = query.eq("featured", filters.featured);
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
  query = query.order(sortColumn as any, { ascending: sortOrder === "asc" });

  const {
    data: posts,
    error,
    count,
  } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error("Failed to fetch blog posts");
  }

  // Transform the data to include tags as a simple array
  const transformedPosts = posts?.map((post: any) => ({
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.blog_tags) || [],
  }));

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

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost & { tags: BlogTag[] }> {
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
    .single();

  if (error) {
    console.error("Error fetching blog post by slug:", error);
    throw new Error("Failed to fetch blog post");
  }

  // Transform the data to include tags as a simple array
  const transformedPost = {
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.blog_tags) || [],
  };

  return transformedPost as any;
}

export async function getBlogPostById(
  id: string,
): Promise<BlogPost & { tags: BlogTag[] }> {
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
  const transformedPost = {
    ...post,
    tags: post.post_tags?.map((pt: any) => pt.blog_tags) || [],
  };

  return transformedPost as any;
}

export async function createBlogPost(
  data: BlogPostInsert,
  tagIds: string[] = [],
): Promise<BlogPost> {
  const supabase = await createClient();

  // Create the blog post
  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating blog post:", error);
    throw new Error("Failed to create blog post");
  }

  // Associate tags with the post
  if (tagIds.length > 0) {
    const postTags = tagIds.map((tagId) => ({
      post_id: post.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("post_tags")
      .insert(postTags);

    if (tagError) {
      console.error("Error associating tags with blog post:", tagError);
      // Don't throw here as the post was created successfully
    }
  }

  return post;
}

export async function updateBlogPost(
  id: string,
  data: BlogPostUpdate,
  tagIds: string[] = [],
): Promise<BlogPost> {
  const supabase = await createClient();

  // Update the blog post
  const { data: post, error } = await supabase
    .from("blog_posts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating blog post:", error);
    throw new Error("Failed to update blog post");
  }

  // Update tag associations
  // First, remove existing tag associations
  await supabase.from("post_tags").delete().eq("post_id", id);

  // Then, add new tag associations
  if (tagIds.length > 0) {
    const postTags = tagIds.map((tagId) => ({
      post_id: id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("post_tags")
      .insert(postTags);

    if (tagError) {
      console.error("Error associating tags with blog post:", tagError);
      // Don't throw here as the post was updated successfully
    }
  }

  return post;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const supabase = await createClient();

  // Delete tag associations first (due to foreign key constraint)
  await supabase.from("post_tags").delete().eq("post_id", id);

  // Delete the blog post
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting blog post:", error);
    throw new Error("Failed to delete blog post");
  }
}

export async function toggleBlogPostPublished(id: string): Promise<BlogPost> {
  const supabase = await createClient();

  // First get the current post to determine the new state
  const { data: currentPost } = await supabase
    .from("blog_posts")
    .select("is_published")
    .eq("id", id)
    .single();

  if (!currentPost) {
    throw new Error("Blog post not found");
  }

  const newPublishedState = !currentPost.is_published;
  const now = new Date().toISOString();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update({
      is_published: newPublishedState,
      published_at: newPublishedState ? now : null,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling blog post published state:", error);
    throw new Error("Failed to toggle blog post published state");
  }

  return post;
}

// Blog Tag CRUD Operations (Server-only)
export async function getBlogTags(): Promise<BlogTag[]> {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from("blog_tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching blog tags:", error);
    throw new Error("Failed to fetch blog tags");
  }

  return tags || [];
}

export async function createBlogTag(data: BlogTagInsert): Promise<BlogTag> {
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from("blog_tags")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating blog tag:", error);
    throw new Error("Failed to create blog tag");
  }

  return tag;
}

export async function updateBlogTag(
  id: string,
  data: BlogTagUpdate,
): Promise<BlogTag> {
  const supabase = await createClient();

  const { data: tag, error } = await supabase
    .from("blog_tags")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating blog tag:", error);
    throw new Error("Failed to update blog tag");
  }

  return tag;
}

export async function deleteBlogTag(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if tag is being used by any posts
  const { data: associations } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", id)
    .limit(1);

  if (associations && associations.length > 0) {
    throw new Error("Cannot delete tag that is being used by blog posts");
  }

  const { error } = await supabase.from("blog_tags").delete().eq("id", id);

  if (error) {
    console.error("Error deleting blog tag:", error);
    throw new Error("Failed to delete blog tag");
  }
}

// Utility Functions (Server-only)
export async function generateUniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const supabase = await createClient();

  // Convert title to slug
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const originalSlug = slug;
  let counter = 1;

  while (true) {
    let query = supabase.from("blog_posts").select("id").eq("slug", slug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.limit(1);

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${originalSlug}-${counter}`;
    counter++;
  }
}

export async function calculateReadingTime(content: string): Promise<number> {
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readingTime); // Minimum 1 minute
}

// Blog Statistics (Server-only)
export async function getBlogStats() {
  const supabase = await createClient();

  const [totalResult, publishedResult, draftResult, tagsResult] =
    await Promise.all([
      supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false),
      supabase.from("blog_tags").select("id", { count: "exact", head: true }),
    ]);

  return {
    total: totalResult.count || 0,
    published: publishedResult.count || 0,
    draft: draftResult.count || 0,
    tags: tagsResult.count || 0,
  };
}
