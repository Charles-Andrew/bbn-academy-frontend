import {
  getBlogPostBySlug,
  getBlogPosts as getBlogPostsFromDb,
  getBlogTags as getBlogTagsFromDb,
} from "@/lib/blog-server";
import type { BlogFilters, BlogPost, BlogTag } from "@/types/blog";

// Simple functions that fetch fresh data from Supabase each time

export const getPublishedPosts = async (): Promise<BlogPost[]> => {
  const postsResult = await getBlogPostsFromDb(
    { page: 1, limit: 100 },
    { status: "published", sortBy: "published_at", sortOrder: "desc" },
  );

  // Transform posts to match expected format
  return postsResult.posts.map((post) => ({
    ...post,
    tags: post.tags || [], // Tags are already transformed in blog-server.ts
    media: post.media || [], // Media is already handled in blog-server.ts
  }));
};

export const getFeaturedPosts = async (): Promise<BlogPost[]> => {
  const posts = await getPublishedPosts();

  // Only return posts explicitly marked as featured and published
  const explicitlyFeatured = posts.filter(
    (post) => post.is_published && post.featured,
  );

  return explicitlyFeatured.slice(0, 3);
};

export const getRecentPosts = async (limit = 3): Promise<BlogPost[]> => {
  const posts = await getPublishedPosts();

  return posts
    .sort((a, b) => {
      // Sort by published_at (descending), fallback to created_at
      const dateA = new Date(a.published_at || a.created_at);
      const dateB = new Date(b.published_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);
};

export const getPostBySlug = async (
  slug: string,
): Promise<BlogPost | undefined> => {
  try {
    const post = await getBlogPostBySlug(slug);
    if (!post) return undefined;

    // Transform to match expected format
    return {
      ...post,
      tags: post.tags || [],
    };
  } catch (error) {
    console.error("Error getting post by slug:", error);
    return undefined;
  }
};

export const getPostsByTag = async (tagName: string): Promise<BlogPost[]> => {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.tags?.includes(tagName));
};

export const searchPosts = async (query: string): Promise<BlogPost[]> => {
  const posts = await getPublishedPosts();

  const searchLower = query.toLowerCase();
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchLower) ||
      post.excerpt?.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower),
  );
};

export const filterPosts = async (
  filters: BlogFilters,
): Promise<BlogPost[]> => {
  const posts = await getPublishedPosts();

  return posts.filter((post) => {
    if (
      filters.published !== undefined &&
      post.is_published !== filters.published
    )
      return false;
    if (filters.tag && !post.tags?.includes(filters.tag)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !post.title.toLowerCase().includes(searchLower) &&
        !post.excerpt?.toLowerCase().includes(searchLower) &&
        !post.content.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });
};

export const getRelatedPosts = async (
  currentPost: BlogPost,
  limit = 3,
): Promise<BlogPost[]> => {
  const published = await getPublishedPosts();
  const otherPosts = published.filter((post) => post.id !== currentPost.id);

  // First try to find posts with shared tags
  const withSharedTags = otherPosts.filter((post) =>
    post.tags?.some((tag) => currentPost.tags?.includes(tag)),
  );

  if (withSharedTags.length >= limit) {
    return withSharedTags.slice(0, limit);
  }

  // If not enough, fill with other posts
  return [
    ...withSharedTags,
    ...otherPosts.filter((post) => !withSharedTags.includes(post)),
  ].slice(0, limit);
};

export const getBlogSlugs = async (): Promise<string[]> => {
  const posts = await getPublishedPosts();
  return posts.map((post) => post.slug);
};

// For backward compatibility, also provide synchronous versions (now just aliases)
export const getPublishedPostsSync = getPublishedPosts;
export const getFeaturedPostsSync = getFeaturedPosts;
export const getPostBySlugSync = getPostBySlug;
export const getPostsByTagSync = getPostsByTag;
export const searchPostsSync = searchPosts;
export const filterPostsSync = filterPosts;
export const getRelatedPostsSync = getRelatedPosts;
export const getBlogSlugsSync = getBlogSlugs;

// Export cached blog tags (for backward compatibility)
export let blogTags: BlogTag[] = [];

// Initialize blog tags
const initializeBlogTags = async () => {
  try {
    blogTags = await getBlogTagsFromDb();
  } catch (error) {
    console.error("Error initializing blog tags:", error);
    blogTags = [];
  }
};

// Initialize tags on module load
initializeBlogTags();
