import type { BlogFiltersData, BlogPaginationData } from "@/lib/validations";
import type { BlogMedia, BlogPost as IBlogPost } from "@/types/blog";
import type { Database } from "./types";

// Helper function to get the right client based on context
async function getSupabaseClient() {
  // Dynamic imports to avoid bundling issues
  if (typeof window === "undefined") {
    const { createClient } = await import("./server");
    return createClient();
  } else {
    const { createClient } = await import("./client");
    return createClient();
  }
}

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"];
type BlogPostUpdate = Database["public"]["Tables"]["blog_posts"]["Update"];
type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];
type BlogTagInsert = Database["public"]["Tables"]["blog_tags"]["Insert"];
type BlogTagUpdate = Database["public"]["Tables"]["blog_tags"]["Update"];
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

// Blog Post CRUD Operations
export async function getBlogPosts(
  pagination: BlogPaginationData = { page: 1, limit: 10 },
  filters: BlogFiltersData = {
    status: "all",
    sortBy: "created_at",
    sortOrder: "desc",
  },
) {
  const supabase = await getSupabaseClient();
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

  // Transform the data to include tags as a simple array of tag names and media with public URLs
  const transformedPosts = posts?.map((post: PostWithTagsAndMediaFromDB) => {
    // Transform media data to include public URLs
    const _media =
      post.blog_media
        ?.map((mediaItem) => {
          // Note: This would need the actual Supabase client instance
          // For now, we'll return the media as is and let the API handle URL generation
          return {
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
          } as BlogMedia;
        })
        .sort((a, b) => a.sort_order - b.sort_order) || [];

    return {
      ...post,
      tags:
        post.post_tags?.map((pt) => pt.blog_tags?.name).filter(Boolean) || [],
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
  const supabase = await getSupabaseClient();

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
  const _media =
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
    featured_media_url: blogPostWithTagsAndMedia.featured_media_url, // Map from database field
    featured_media_type: blogPostWithTagsAndMedia.featured_media_type, // Map from database field
    tags:
      blogPostWithTagsAndMedia.post_tags
        ?.map((pt) => pt.blog_tags?.name)
        .filter(Boolean) || [],
  };

  return transformedPost;
}

export async function getBlogPostById(id: string): Promise<IBlogPost> {
  const supabase = await getSupabaseClient();

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
  const _media =
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
    featured_media_url: blogPostWithTagsAndMedia.featured_media_url, // Map from database field
    featured_media_type: blogPostWithTagsAndMedia.featured_media_type, // Map from database field
    tags:
      blogPostWithTagsAndMedia.post_tags
        ?.map((pt) => pt.blog_tags?.name)
        .filter(Boolean) || [],
  };

  return transformedPost;
}

export async function createBlogPost(
  data: BlogPostInsert,
  tagIds: string[] = [],
): Promise<BlogPost> {
  const supabase = await getSupabaseClient();

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
  const supabase = await getSupabaseClient();

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
  const supabase = await getSupabaseClient();

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
  const supabase = await getSupabaseClient();

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

// Blog Tag CRUD Operations
export async function getBlogTags(): Promise<BlogTag[]> {
  const supabase = await getSupabaseClient();

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
  const supabase = await getSupabaseClient();

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
  const supabase = await getSupabaseClient();

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
  const supabase = await getSupabaseClient();

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

// Utility Functions
export async function generateUniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const supabase = await getSupabaseClient();

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

// Blog Statistics
export async function getBlogStats() {
  const supabase = await getSupabaseClient();

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

// Blog Media CRUD Operations
export async function getBlogMediaByPostId(
  postId: string,
): Promise<BlogMedia[]> {
  const supabase = await getSupabaseClient();

  const { data: media, error } = await supabase
    .from("blog_media")
    .select("*")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching blog media:", error);
    throw new Error("Failed to fetch blog media");
  }

  return (media || []).map((mediaItem) => ({
    ...mediaItem,
    file_type: mediaItem.file_type as "image" | "video",
  })) as BlogMedia[];
}

export async function getBlogMediaById(id: string): Promise<BlogMedia> {
  const supabase = await getSupabaseClient();

  const { data: media, error } = await supabase
    .from("blog_media")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching blog media by ID:", error);
    throw new Error("Failed to fetch blog media");
  }

  return {
    ...media,
    file_type: media.file_type as "image" | "video",
  } as BlogMedia;
}

export async function updateBlogMedia(
  id: string,
  data: Partial<BlogMedia>,
): Promise<BlogMedia> {
  const supabase = await getSupabaseClient();

  // If setting as featured, unset other featured media for this post
  if (data.is_featured) {
    const { data: currentMedia } = await supabase
      .from("blog_media")
      .select("post_id")
      .eq("id", id)
      .single();

    if (currentMedia) {
      await supabase
        .from("blog_media")
        .update({ is_featured: false })
        .eq("post_id", currentMedia.post_id)
        .neq("id", id);
    }
  }

  const { data: media, error } = await supabase
    .from("blog_media")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating blog media:", error);
    throw new Error("Failed to update blog media");
  }

  return {
    ...media,
    file_type: media.file_type as "image" | "video",
  } as BlogMedia;
}

export async function deleteBlogMedia(id: string): Promise<void> {
  const supabase = await getSupabaseClient();

  // Get media details before deletion
  const { data: media, error: fetchError } = await supabase
    .from("blog_media")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !media) {
    throw new Error("Media not found");
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("blog_media")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting media record:", deleteError);
    throw new Error("Failed to delete media");
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("blog-images")
    .remove([media.file_path]);

  if (storageError) {
    console.error("Error deleting file from storage:", storageError);
    // Don't throw here as the record was deleted, but log the error
  }
}

export async function reorderBlogMedia(
  postId: string,
  mediaIds: string[],
): Promise<void> {
  const supabase = await getSupabaseClient();

  const updates = mediaIds.map((mediaId, index) =>
    supabase
      .from("blog_media")
      .update({ sort_order: index })
      .eq("id", mediaId)
      .eq("post_id", postId),
  );

  const results = await Promise.all(updates);

  const hasErrors = results.some((result) => result.error);
  if (hasErrors) {
    console.error("Error reordering blog media");
    throw new Error("Failed to reorder blog media");
  }
}

// Helper function to get public URL for media files
export function getMediaPublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Supabase URL not configured");
  }
  return `${supabaseUrl}/storage/v1/object/public/blog-images/${filePath}`;
}
