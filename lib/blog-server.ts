import type { BlogFiltersData, BlogPaginationData } from "@/lib/validations";
import type { BlogMedia, BlogPost as IBlogPost } from "@/types/blog";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/types";

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];
// Local type definition since blog_media table might not exist in database types yet
type BlogMediaRow = {
  id: string;
  post_id: string;
  file_name: string;
  file_path: string;
  file_type: "image" | "video";
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number;
  alt_text?: string;
  caption?: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// Type for blog post with joined tags and media from Supabase
type BlogPostWithTagsAndMedia = BlogPost & {
  post_tags?: Array<{
    blog_tags: BlogTag;
  }>;
  blog_media?: BlogMediaRow[];
};

type PostWithTagsAndMediaFromDB = {
  [K in keyof BlogPost]: BlogPost[K];
} & {
  post_tags?: Array<{
    blog_tags: BlogTag;
  }>;
  blog_media?: BlogMediaRow[];
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
      ),
      blog_media(
        id,
        file_name,
        file_path,
        file_type,
        mime_type,
        file_size,
        width,
        height,
        duration,
        alt_text,
        caption,
        is_featured,
        sort_order,
        created_at
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
    "featured_image",
    "author_id",
    "is_published",
    "reading_time",
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

  // Transform the data to include tags as a simple array of tag names and media with public URLs
  const transformedPosts = posts?.map((post: PostWithTagsAndMediaFromDB) => {
    // Transform media data to include public URLs
    const media =
      post.blog_media
        ?.map(
          (mediaItem) =>
            ({
              id: mediaItem.id,
              post_id: mediaItem.post_id,
              file_name: mediaItem.file_name,
              file_path: mediaItem.file_path,
              file_type: mediaItem.file_type as "image" | "video",
              mime_type: mediaItem.mime_type,
              file_size: mediaItem.file_size,
              width: mediaItem.width,
              height: mediaItem.height,
              duration: mediaItem.duration,
              alt_text: mediaItem.alt_text,
              caption: mediaItem.caption,
              is_featured: mediaItem.is_featured,
              sort_order: mediaItem.sort_order,
              created_at: mediaItem.created_at,
            }) as BlogMedia,
        )
        .sort((a, b) => a.sort_order - b.sort_order) || [];

    return {
      ...post,
      tags:
        post.post_tags?.map((pt) => pt.blog_tags?.name).filter(Boolean) || [],
      media,
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
      ),
      blog_media(
        id,
        file_name,
        file_path,
        file_type,
        mime_type,
        file_size,
        width,
        height,
        duration,
        alt_text,
        caption,
        is_featured,
        sort_order,
        created_at
      )
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching blog post by slug:", error);
    throw new Error("Failed to fetch blog post");
  }

  // Transform the data to include tags as a simple array and media with public URLs
  const blogPostWithTagsAndMedia = post as BlogPostWithTagsAndMedia;

  // Transform media data
  const media =
    blogPostWithTagsAndMedia.blog_media
      ?.map(
        (mediaItem) =>
          ({
            id: mediaItem.id,
            post_id: mediaItem.post_id,
            file_name: mediaItem.file_name,
            file_path: mediaItem.file_path,
            file_type: mediaItem.file_type as "image" | "video",
            mime_type: mediaItem.mime_type,
            file_size: mediaItem.file_size,
            width: mediaItem.width,
            height: mediaItem.height,
            duration: mediaItem.duration,
            alt_text: mediaItem.alt_text,
            caption: mediaItem.caption,
            is_featured: mediaItem.is_featured,
            sort_order: mediaItem.sort_order,
            created_at: mediaItem.created_at,
          }) as BlogMedia,
      )
      .sort((a, b) => a.sort_order - b.sort_order) || [];

  const transformedPost: IBlogPost = {
    ...blogPostWithTagsAndMedia,
    featured_media_id: blogPostWithTagsAndMedia.featured_image, // Map from database field
    tags:
      blogPostWithTagsAndMedia.post_tags
        ?.map((pt) => pt.blog_tags?.name)
        .filter(Boolean) || [],
    media,
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
      ),
      blog_media(
        id,
        file_name,
        file_path,
        file_type,
        mime_type,
        file_size,
        width,
        height,
        duration,
        alt_text,
        caption,
        is_featured,
        sort_order,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching blog post by ID:", error);
    throw new Error("Failed to fetch blog post");
  }

  // Transform the data to include tags as a simple array and media with public URLs
  const blogPostWithTagsAndMedia = post as BlogPostWithTagsAndMedia;

  // Transform media data
  const media =
    blogPostWithTagsAndMedia.blog_media
      ?.map(
        (mediaItem) =>
          ({
            id: mediaItem.id,
            post_id: mediaItem.post_id,
            file_name: mediaItem.file_name,
            file_path: mediaItem.file_path,
            file_type: mediaItem.file_type as "image" | "video",
            mime_type: mediaItem.mime_type,
            file_size: mediaItem.file_size,
            width: mediaItem.width,
            height: mediaItem.height,
            duration: mediaItem.duration,
            alt_text: mediaItem.alt_text,
            caption: mediaItem.caption,
            is_featured: mediaItem.is_featured,
            sort_order: mediaItem.sort_order,
            created_at: mediaItem.created_at,
          }) as BlogMedia,
      )
      .sort((a, b) => a.sort_order - b.sort_order) || [];

  const transformedPost: IBlogPost = {
    ...blogPostWithTagsAndMedia,
    featured_media_id: blogPostWithTagsAndMedia.featured_image, // Map from database field
    tags:
      blogPostWithTagsAndMedia.post_tags
        ?.map((pt) => pt.blog_tags?.name)
        .filter(Boolean) || [],
    media,
  };

  return transformedPost;
}

// Export other functions that were in blog.ts but keep them server-only
export * from "./supabase/blog";
