export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
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

export interface BlogFilters {
  tag?: string;
  search?: string;
  published?: boolean;
}
