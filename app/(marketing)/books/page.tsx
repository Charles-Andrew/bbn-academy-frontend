"use client";

import { BookOpen, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

type Book = Database["public"]["Tables"]["books"]["Row"];

type SortOption =
  | "title_asc"
  | "title_desc"
  | "price_asc"
  | "price_desc"
  | "created_at_desc"
  | "created_at_asc";

const sortOptions = [
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "price_asc", label: "Price (Low to High)" },
  { value: "price_desc", label: "Price (High to Low)" },
  { value: "created_at_desc", label: "Newest First" },
  { value: "created_at_asc", label: "Oldest First" },
];

function BooksPageContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || "",
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams?.get("sort") as SortOption) || "created_at_desc",
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books from API
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);

      // Map sort option to API parameters
      if (sortBy === "title_asc") {
        params.append("sortBy", "title");
        params.append("sortOrder", "asc");
      } else if (sortBy === "title_desc") {
        params.append("sortBy", "title");
        params.append("sortOrder", "desc");
      } else if (sortBy === "price_asc") {
        params.append("sortBy", "price");
        params.append("sortOrder", "asc");
      } else if (sortBy === "price_desc") {
        params.append("sortBy", "price");
        params.append("sortOrder", "desc");
      } else if (sortBy === "created_at_asc") {
        params.append("sortBy", "created_at");
        params.append("sortOrder", "asc");
      } else {
        // Default to created_at_desc
        params.append("sortBy", "created_at");
        params.append("sortOrder", "desc");
      }

      params.append("limit", "100");

      const response = await fetch(`/api/books?${params}`);
      const data = await response.json();

      if (data.success) {
        setBooks(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch books");
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch books");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]);

  // Update URL params when search/sort changes
  const updateURLParams = useCallback((query: string, sort: SortOption) => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (sort !== "created_at_desc") {
      params.set("sort", sort);
    }

    const newURL = params.toString() ? `/books?${params.toString()}` : "/books";
    window.history.replaceState({}, "", newURL);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURLParams(searchQuery, sortBy);
      fetchBooks();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, fetchBooks, updateURLParams]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("created_at_desc");
  };

  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  // Filter books client-side (for immediate feedback)
  const filteredBooks = useMemo(() => {
    const filtered = [...books];

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "price_asc": {
          const aPriceAsc = a.price || 0;
          const bPriceAsc = b.price || 0;
          return aPriceAsc - bPriceAsc;
        }
        case "price_desc": {
          const aPriceDesc = a.price || 0;
          const bPriceDesc = b.price || 0;
          return bPriceDesc - aPriceDesc;
        }
        case "created_at_asc": {
          const aDateAsc = new Date(a.created_at);
          const bDateAsc = new Date(b.created_at);
          return aDateAsc.getTime() - bDateAsc.getTime();
        }
        default: {
          const aDateDesc = new Date(a.created_at);
          const bDateDesc = new Date(b.created_at);
          return bDateDesc.getTime() - aDateDesc.getTime();
        }
      }
    });

    return filtered;
  }, [books, sortBy]);

  const BookCard = ({ book }: { book: Book }) => (
    <div className="group bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      {/* Book Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {book.cover_image ? (
          <Image
            src={book.cover_image}
            alt={book.title}
            width={300}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}

        {/* Featured Badge */}
        {book.featured && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">{book.genre}</div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <div className="text-sm text-muted-foreground">by {book.author}</div>
        </div>

        <p className="text-muted-foreground text-sm line-clamp-3">
          {book.description}
        </p>

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={`${book.id}-tag-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {book.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{book.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            {book.price && (
              <span className="text-lg font-bold text-primary">
                ${book.price.toFixed(2)}
              </span>
            )}
          </div>

          {book.purchase_url && (
            <Button size="sm" asChild>
              <a
                href={book.purchase_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy Now
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              All Books
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our complete collection of books covering technology,
            philosophy, science fiction, and more. Find your next great read.
          </p>
        </div>

        {/* Search and Sort Controls */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books, authors, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching books...
              </div>
            ) : (
              <span>
                Found {filteredBooks.length} book
                {filteredBooks.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        {/* Books Grid */}
        {error ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Unable to load books
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchBooks()}>Try Again</Button>
          </div>
        ) : loading && filteredBooks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, () => (
              <div key={`skeleton-${Math.random()}`} className="animate-pulse">
                <div className="bg-muted rounded-lg overflow-hidden">
                  <div className="aspect-[3/4] bg-muted/50" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No books found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No books matching "${searchQuery}" found. Try different keywords.`
                : "No books available at the moment. Check back later for new additions."}
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="w-10 h-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  All Books
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our complete collection of books covering technology,
                philosophy, science fiction, and more. Find your next great
                read.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, () => (
                <div
                  key={`skeleton-${Math.random()}`}
                  className="animate-pulse"
                >
                  <div className="bg-muted rounded-lg overflow-hidden">
                    <div className="aspect-[3/4] bg-muted/50" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MainLayout>
      }
    >
      <BooksPageContent />
    </Suspense>
  );
}
