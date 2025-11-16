// Client-safe blog utility functions
// These can be used in both server and client components

export async function generateUniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  // This is a simplified version for client-side usage
  // In production, this should call an API endpoint to ensure uniqueness

  // Convert title to slug
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // For client-side generation, we'll append a timestamp to ensure basic uniqueness
  // The API will handle final uniqueness checking
  if (!excludeId) {
    const timestamp = Date.now().toString(36);
    slug = `${slug}-${timestamp}`;
  }

  return slug;
}

export function calculateReadingTime(content: string): number {
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readingTime); // Minimum 1 minute
}

// Client-side version that doesn't require server imports
export function generateUniqueSlugSync(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Add timestamp for basic uniqueness
  const timestamp = Date.now().toString(36);
  return `${slug}-${timestamp}`;
}
