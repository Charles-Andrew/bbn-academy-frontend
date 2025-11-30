export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contact_messages: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          purpose: string;
          message: string;
          status: "unread" | "read" | "replied";
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          purpose: string;
          message: string;
          status?: "unread" | "read" | "replied";
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          purpose?: string;
          message?: string;
          status?: "unread" | "read" | "replied";
          created_at?: string;
        };
      };
      contact_attachments: {
        Row: {
          id: string;
          message_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          file_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          created_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      engagements: {
        Row: {
          id: string;
          title: string;
          slug: string;
          type:
            | "webinar"
            | "workshop"
            | "training"
            | "coaching"
            | "consulting"
            | "speaking"
            | "course"
            | "event";
          description: string;
          content: string | null;
          images: string[];
          date: string | null;
          duration: string;
          price: number | null;
          max_attendees: number | null;
          location: string | null;
          is_virtual: boolean;
          is_featured: boolean;
          booking_url: string | null;
          status: "upcoming" | "ongoing" | "completed" | "cancelled";
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string;
          type:
            | "webinar"
            | "workshop"
            | "training"
            | "coaching"
            | "consulting"
            | "speaking"
            | "course"
            | "event";
          description: string;
          content?: string | null;
          images?: string[];
          date?: string | null;
          duration: string;
          price?: number | null;
          max_attendees?: number | null;
          location?: string | null;
          is_virtual?: boolean;
          is_featured?: boolean;
          booking_url?: string | null;
          status?: "upcoming" | "ongoing" | "completed" | "cancelled";
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          type?:
            | "webinar"
            | "workshop"
            | "training"
            | "coaching"
            | "consulting"
            | "speaking"
            | "course"
            | "event";
          description?: string;
          content?: string | null;
          images?: string[];
          date?: string | null;
          duration?: string;
          price?: number | null;
          max_attendees?: number | null;
          location?: string | null;
          is_virtual?: boolean;
          is_featured?: boolean;
          booking_url?: string | null;
          status?: "upcoming" | "ongoing" | "completed" | "cancelled";
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          title: string;
          description: string;
          cover_image: string | null;
          author: string;
          genre: string;
          published_at: string | null;
          isbn: string | null;
          price: number | null;
          purchase_url: string | null;
          tags: string[] | null;
          featured: boolean | null;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          cover_image?: string | null;
          author: string;
          genre: string;
          published_at?: string | null;
          isbn?: string | null;
          price?: number | null;
          purchase_url?: string | null;
          tags?: string[] | null;
          featured?: boolean | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          cover_image?: string | null;
          author?: string;
          genre?: string;
          published_at?: string | null;
          isbn?: string | null;
          price?: number | null;
          purchase_url?: string | null;
          tags?: string[] | null;
          featured?: boolean | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: "digital" | "physical" | "course";
          price: number | null;
          image_url: string | null;
          is_featured: boolean;
          stock_quantity: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: "digital" | "physical" | "course";
          price?: number | null;
          image_url?: string | null;
          is_featured?: boolean;
          stock_quantity?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: "digital" | "physical" | "course";
          price?: number | null;
          image_url?: string | null;
          is_featured?: boolean;
          stock_quantity?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          is_admin: boolean;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          is_admin?: boolean;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_admin?: boolean;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          featured: boolean;
          featured_media_url: string | null;
          featured_media_type: "image" | "video" | null;
          author_id: string;
          published_at: string | null;
          is_published: boolean;
          reading_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          featured?: boolean;
          featured_media_url?: string | null;
          featured_media_type?: "image" | "video" | null;
          author_id?: string;
          published_at?: string | null;
          is_published?: boolean;
          reading_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          featured?: boolean;
          featured_media_url?: string | null;
          featured_media_type?: "image" | "video" | null;
          author_id?: string;
          published_at?: string | null;
          is_published?: boolean;
          reading_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      post_tags: {
        Row: {
          id: string;
          post_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
