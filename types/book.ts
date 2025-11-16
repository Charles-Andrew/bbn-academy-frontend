export interface Book {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  author: string;
  genre: string;
  published_at: string | null;
  isbn?: string | null;
  price?: number | null;
  purchase_url?: string | null;
  tags: string[] | null;
  featured?: boolean | null;
  content?: string | null; // For book preview/sample
  created_at: string;
  updated_at: string;
}

export interface BookCardProps {
  book: Book;
  variant?: "default" | "featured" | "compact";
}

export interface BookFilterOptions {
  genre?: string;
  author?: string;
  tags?: string[];
  featured?: boolean;
  search?: string;
}
