"use client";

import { ArrowRight, Calendar, Clock, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
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
import type { BlogPost } from "@/types/blog";

type SortOption =
  | "created_at_desc"
  | "created_at_asc"
  | "title_asc"
  | "title_desc";

const sortOptions = [
  { value: "created_at_desc", label: "Newest First" },
  { value: "created_at_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
];

function ArticlesPageContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || "",
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams?.get("sort") as SortOption) || "created_at_desc",
  );
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles from API
  const fetchArticles = useCallback(async () => {
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
      } else if (sortBy === "created_at_asc") {
        params.append("sortBy", "created_at");
        params.append("sortOrder", "asc");
      } else {
        // Default to created_at_desc
        params.append("sortBy", "created_at");
        params.append("sortOrder", "desc");
      }

      params.append("limit", "50");

      const response = await fetch(`/api/blogs?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch articles");
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
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

    const newURL = params.toString()
      ? `/blogs/all?${params.toString()}`
      : "/blogs/all";
    window.history.replaceState({}, "", newURL);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURLParams(searchQuery, sortBy);
      fetchArticles();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, fetchArticles, updateURLParams]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("created_at_desc");
  };

  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  // Filter articles client-side (for immediate feedback)
  const filteredArticles = useMemo(() => {
    const filtered = [...articles];

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
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
  }, [articles, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const ArticleCard = ({ article }: { article: BlogPost }) => (
    <div className="group bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      {/* Article Header */}
      <div className="p-6 space-y-4">
        {/* Article Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <time dateTime={article.created_at}>
              {formatDate(article.created_at)}
            </time>
            {article.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{article.reading_time} min read</span>
              </div>
            )}
          </div>
          {article.featured && (
            <Badge className="bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>

        {/* Article Title */}
        <h3 className="font-semibold text-xl line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/blogs/${article.slug}`} className="hover:text-primary">
            {article.title}
          </Link>
        </h3>

        {/* Article Excerpt */}
        {article.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={`${article.id}-tag-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Read More Link */}
        <div className="pt-2">
          <Link
            href={`/blogs/${article.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Read More
            <ArrowRight className="w-3 h-3" />
          </Link>
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
            <Calendar className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              All Articles
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our complete collection of articles covering technology,
            philosophy, science, and more. Find insights that inspire and
            inform.
          </p>
        </div>

        {/* Search and Sort Controls */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, titles, content..."
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
                Searching articles...
              </div>
            ) : (
              <span>
                Found {filteredArticles.length} article
                {filteredArticles.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        {/* Articles Grid */}
        {error ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Unable to load articles
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchArticles()}>Try Again</Button>
          </div>
        ) : loading && filteredArticles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, () => (
              <div key={`skeleton-${Math.random()}`} className="animate-pulse">
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-4 bg-muted rounded w-16" />
                    </div>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-5 bg-muted rounded w-16" />
                      <div className="h-5 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No articles found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No articles matching "${searchQuery}" found. Try different keywords.`
                : "No articles available at the moment. Check back later for new content."}
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Calendar className="w-10 h-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  All Articles
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our complete collection of articles covering technology,
                philosophy, science, and more. Find insights that inspire and
                inform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, () => (
                <div
                  key={`skeleton-${Math.random()}`}
                  className="animate-pulse"
                >
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-24" />
                        <div className="h-4 bg-muted rounded w-16" />
                      </div>
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                      <div className="flex gap-1">
                        <div className="h-5 bg-muted rounded w-16" />
                        <div className="h-5 bg-muted rounded w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MainLayout>
      }
    >
      <ArticlesPageContent />
    </Suspense>
  );
}
