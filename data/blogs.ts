import type { BlogFilters, BlogPost, BlogTag } from "@/types/blog";
import blogData from "./data.json";

export const blogPosts: BlogPost[] = blogData.blog_posts.map((post) => ({
  ...post,
  tags: blogData.post_tags
    .filter((pt) => pt.post_id === post.id)
    .map((pt) => blogData.blog_tags.find((tag) => tag.id === pt.tag_id)?.name)
    .filter(Boolean) as string[],
}));

export const blogTags: BlogTag[] = blogData.blog_tags;

export const getPublishedPosts = () =>
  blogPosts.filter((post) => post.is_published);

export const getFeaturedPosts = () => {
  const published = getPublishedPosts();
  return published.slice(0, 3); // Return first 3 as featured
};

export const getPostBySlug = (slug: string) =>
  blogPosts.find((post) => post.slug === slug);

export const getPostsByTag = (tagName: string) =>
  blogPosts.filter((post) => post.tags?.includes(tagName));

export const searchPosts = (query: string) =>
  blogPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase()),
  );

export const filterPosts = (filters: BlogFilters) => {
  return blogPosts.filter((post) => {
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

export const getRelatedPosts = (currentPost: BlogPost, limit = 3) => {
  const published = getPublishedPosts().filter(
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
