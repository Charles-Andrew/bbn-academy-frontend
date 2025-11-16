export interface Product {
  id: string;
  name: string;
  description: string;
  category: "digital" | "physical" | "course";
  price: number | null;
  image_url: string | null;
  is_featured: boolean;
  stock_quantity: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  featured?: boolean;
  priceRange?: [number, number];
  search?: string;
}
