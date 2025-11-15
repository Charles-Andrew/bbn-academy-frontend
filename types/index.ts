export * from "./api";
export type { BlogFilters, BlogPost, BlogTag } from "./blog";
export * from "./book";
export * from "./contact";
export type { Engagement, EngagementFilters } from "./engagement";
export type { Product, ProductFilters } from "./product";

// Common UI types
export interface LoadingState {
  loading: boolean;
  error?: string | null;
}

export interface Theme {
  mode: "light" | "dark" | "system";
}

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  features: string[];
  featured?: boolean;
}
