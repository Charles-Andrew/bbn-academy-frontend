import {
  getBlogPostBySlug,
  getBlogPosts as getBlogPostsFromDb,
  getBlogTags as getBlogTagsFromDb,
} from "@/lib/supabase/blog";
import type { BlogFilters, BlogPost, BlogTag } from "@/types/blog";

// Cache for static data to improve performance
let cachedPosts: BlogPost[] | null = null;
let cachedTags: BlogTag[] | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if cache is valid
const isCacheValid = () => {
  return Date.now() - lastCacheUpdate < CACHE_DURATION;
};

// Helper function to update cache
const updateCache = async () => {
  try {
    // During build time (static generation), we can't access cookies
    // so we'll skip cache updates and use empty data
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
    if (isBuildTime) {
      console.log("Skipping blog cache update during static generation");
      cachedPosts = [];
      cachedTags = [];
      lastCacheUpdate = Date.now();
      return;
    }

    const postsResult = await getBlogPostsFromDb(
      { page: 1, limit: 100 }, // Get more posts for better caching
      { status: "published", sortBy: "created_at", sortOrder: "desc" },
    );

    const tags = await getBlogTagsFromDb();

    // Transform posts to match expected format
    const transformedPosts = postsResult.posts.map((post: any) => ({
      ...post,
      tags: post.tags?.map((tag: any) => tag.name) || [],
    }));

    cachedPosts = transformedPosts;
    cachedTags = tags;
    lastCacheUpdate = Date.now();
  } catch (error) {
    console.error("Error updating blog cache:", error);
    // If cache update fails, don't override existing cache
    // During build time, set empty cache to prevent repeated attempts
    if (process.env.NEXT_PHASE === "phase-production-build") {
      cachedPosts = [];
      cachedTags = [];
      lastCacheUpdate = Date.now();
    }
  }
};

// Initialize cache on module load (but not during build time)
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
if (!isBuildTime && (!cachedPosts || !cachedTags || !isCacheValid())) {
  updateCache();
}

// Export cached blog posts (for backward compatibility)
export const blogPosts: BlogPost[] = cachedPosts || [];

// Export cached blog tags (for backward compatibility)
export const blogTags: BlogTag[] = cachedTags || [];

// Functions that use Supabase with caching
export const getPublishedPosts = async (): Promise<BlogPost[]> => {
  if (!cachedPosts || !isCacheValid()) {
    await updateCache();
  }
  return (cachedPosts || []).filter((post) => post.is_published);
};

export const getFeaturedPosts = async (): Promise<BlogPost[]> => {
  const published = await getPublishedPosts();
  return published.slice(0, 3); // Return first 3 as featured
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
      tags: post.tags?.map((tag) => tag.name) || [],
    };
  } catch (error) {
    console.error("Error getting post by slug:", error);
    return undefined;
  }
};

export const getPostsByTag = async (tagName: string): Promise<BlogPost[]> => {
  if (!cachedPosts || !isCacheValid()) {
    await updateCache();
  }
  return (cachedPosts || []).filter((post) => post.tags?.includes(tagName));
};

export const searchPosts = async (query: string): Promise<BlogPost[]> => {
  if (!cachedPosts || !isCacheValid()) {
    await updateCache();
  }

  const searchLower = query.toLowerCase();
  return (cachedPosts || []).filter(
    (post) =>
      post.title.toLowerCase().includes(searchLower) ||
      post.excerpt?.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower),
  );
};

export const filterPosts = async (
  filters: BlogFilters,
): Promise<BlogPost[]> => {
  if (!cachedPosts || !isCacheValid()) {
    await updateCache();
  }

  return (cachedPosts || []).filter((post) => {
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
  if (!cachedPosts || !isCacheValid()) {
    await updateCache();
  }
  return (cachedPosts || [])
    .filter((post) => post.is_published)
    .map((post) => post.slug);
};

// Helper function to manually refresh cache (useful for admin operations)
export const refreshBlogCache = async () => {
  await updateCache();
};

// For backward compatibility, also provide synchronous versions that use cache
export const getPublishedPostsSync = () =>
  (cachedPosts || []).filter((post) => post.is_published);

export const getFeaturedPostsSync = () => {
  const published = getPublishedPostsSync();
  return published.slice(0, 3);
};

export const getPostBySlugSync = (slug: string) =>
  (cachedPosts || []).find((post) => post.slug === slug);

export const getPostsByTagSync = (tagName: string) =>
  (cachedPosts || []).filter((post) => post.tags?.includes(tagName));

export const searchPostsSync = (query: string) =>
  (cachedPosts || []).filter(
    (post) =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase()),
  );

export const filterPostsSync = (filters: BlogFilters) => {
  return (cachedPosts || []).filter((post) => {
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

export const getRelatedPostsSync = (currentPost: BlogPost, limit = 3) => {
  const published = getPublishedPostsSync().filter(
    (post) => post.id !== currentPost.id,
  );

  // First try to find posts with shared tags
  const withSharedTags = published.filter((post) =>
    post.tags?.some((tag) => currentPost.tags?.includes(tag)),
  );

  if (withSharedTags.length >= limit) {
    return withSharedTags.slice(0, limit);
  }

  // If not enough, fill with other posts
  return [
    ...withSharedTags,
    ...published.filter((post) => !withSharedTags.includes(post)),
  ].slice(0, limit);
};

export const getBlogSlugsSync = () =>
  (cachedPosts || [])
    .filter((post) => post.is_published)
    .map((post) => post.slug);
