export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_media_url: string | null; // URL of the featured media (image or video)
  featured_media_type: "image" | "video" | null; // Type of featured media
  author_id: string;
  published_at: string | null;
  is_published: boolean;
  reading_time: number | null;
  created_at: string;
  tags?: string[];
  featured?: boolean;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  created_at?: string;
}

export interface BlogMedia {
  id: string;
  post_id: string;
  file_name: string;
  file_path: string;
  file_type: "image" | "video";
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number; // for videos in seconds
  alt_text?: string;
  caption?: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface BlogFilters {
  tag?: string;
  search?: string;
  published?: boolean;
}

export interface MediaUploadOptions {
  files: File[];
  postId: string;
  onProgress?: (progress: number) => void;
  onFileUploaded?: (media: BlogMedia) => void;
  onError?: (error: string) => void;
}

export interface MediaGalleryItem {
  media: BlogMedia;
  isEditing: boolean;
  preview?: string;
}
