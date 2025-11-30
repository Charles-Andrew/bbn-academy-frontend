import type { BlogMedia } from "@/types/blog";

// Helper function to get public URL for media files (client-side safe)
export function getMediaPublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    // Fallback for development/build time
    console.warn("Supabase URL not configured");
    return "";
  }
  return `${supabaseUrl}/storage/v1/object/public/blog-images/${filePath}`;
}

// Client-side media utility functions
export async function updateMediaMetadata(
  mediaId: string,
  updates: Partial<BlogMedia>,
): Promise<BlogMedia> {
  const response = await fetch(`/api/admin/blogs/media/${mediaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update media");
  }

  return response.json();
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const response = await fetch(`/api/admin/blogs/media/${mediaId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete media");
  }
}

export async function reorderMedia(
  postId: string,
  mediaIds: string[],
): Promise<void> {
  const response = await fetch("/api/admin/blogs/media/reorder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postId, mediaIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to reorder media");
  }
}
