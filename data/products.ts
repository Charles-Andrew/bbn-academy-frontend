import type { Product, ProductFilters } from "@/types/product";
import productsData from "./data.json";

export const products: Product[] = productsData.products as Product[];

export const getFeaturedProducts = () =>
  products.filter((product) => product.is_featured);

export const getProductsByCategory = (category: string) =>
  products.filter((product) => product.category === category);

export const searchProducts = (query: string) =>
  products.filter(
    (product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()),
  );

export const getProductById = (id: string) =>
  products.find((product) => product.id === id);

export const filterProducts = (filters: ProductFilters) => {
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (
      filters.featured !== undefined &&
      product.is_featured !== filters.featured
    )
      return false;
    if (filters.priceRange && product.price) {
      const [min, max] = filters.priceRange;
      if (product.price < min || product.price > max) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !product.name.toLowerCase().includes(searchLower) &&
        !product.description.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });
};

export const getProductCategories = () => {
  const categories = new Set(products.map((product) => product.category));
  return Array.from(categories) as Product["category"][];
};
