"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MotionFadeIn } from "@/components/ui/motion-fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/lib/supabase/types";
import { BookCard } from "./book-card";

type Book = Database["public"]["Tables"]["books"]["Row"];

export function FeaturedBooksSection() {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/books/featured");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setBooks(data.data || []);
          setTotalBooks(data.totalCount || data.data?.length || 0);
          setError(null);
        } else {
          throw new Error(data.error || "Failed to load books");
        }
      } catch (err) {
        console.error("Client: Error loading featured books:", err);
        setError("Failed to load books");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
            {Array.from(
              { length: 4 },
              (_, index) => `featured-book-skeleton-${index + 1}`,
            ).map((skeletonId) => (
              <div
                key={skeletonId}
                className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 space-y-4"
              >
                <Skeleton className="aspect-[3/4] w-full rounded-md" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!loading && error) {
    return (
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Featured Books
            </h2>
            <p className="text-muted-foreground">
              Unable to load books at this time. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!loading && (!books || books.length === 0)) {
    return (
      <section className="py-16 md:py-24 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Featured Books
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              No featured books available at the moment. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-muted/10">
      <div className="container mx-auto px-4">
        <MotionFadeIn className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Featured Books
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
            Handpicked books that inspire, educate, and transform your
            perspective on life and learning
          </p>
          {totalBooks > books.length && (
            <p className="text-sm text-muted-foreground">
              Showing {books.length} of {totalBooks} books
            </p>
          )}
        </MotionFadeIn>

        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto mb-12">
          {books.map((book) => (
            <div
              key={book.id}
              className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0"
            >
              <BookCard book={book} />
            </div>
          ))}
        </div>

        <MotionFadeIn className="text-center">
          <Button
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            asChild
          >
            <Link href="/books" className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              View All Books
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          {totalBooks > books.length && (
            <p className="text-sm text-muted-foreground mt-3">
              Explore our complete collection of {totalBooks} books
            </p>
          )}
        </MotionFadeIn>
      </div>
    </section>
  );
}
