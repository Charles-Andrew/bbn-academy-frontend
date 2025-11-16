import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Heart,
  Share2,
  Star,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBookById, getBookSlugs } from "@/data/books";

interface BookPageProps {
  params: {
    slug: string;
  };
}

// SSR: Generate static params for all books at build time
export async function generateStaticParams() {
  const books = getBookSlugs();
  return books.map((slug) => ({
    slug,
  }));
}

// SSR: Generate metadata for each book
export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const book = getBookById(params.slug);

  if (!book) {
    return {
      title: "Book Not Found",
      description: "The requested book could not be found.",
    };
  }

  return {
    title: `${book.title} by ${book.author} | BBN Academy`,
    description: book.description,
    openGraph: {
      title: `${book.title} by ${book.author}`,
      description: book.description,
      type: "book",
    },
  };
}

export default function BookPage({ params }: BookPageProps) {
  const book = getBookById(params.slug);

  if (!book) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/books">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Books
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                <BookOpen className="h-24 w-24 text-muted-foreground" />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {book.purchaseUrl && (
                  <Button size="lg" className="w-full" asChild>
                    <Link
                      href={book.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy Now
                    </Link>
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="lg" className="flex-1">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>

                {book.price && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      ${book.price.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Paperback / Ebook
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{book.genre}</Badge>
                {book.featured && <Badge variant="default">Featured</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground">by {book.author}</p>
            </div>

            {/* Book Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  Published{" "}
                  {new Date(book.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-primary fill-primary" />
                <span className="text-sm font-medium">4.8</span>
                <span className="text-sm text-muted-foreground">
                  (234 reviews)
                </span>
              </div>
              {book.isbn && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">ISBN: {book.isbn}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                About This Book
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Extended Content */}
            {book.content && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Preview
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {book.content}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            {book.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Topics & Themes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Reader Reviews
              </h2>
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Star className="h-12 w-12 text-primary fill-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground mb-1">
                  4.8 out of 5 stars
                </div>
                <p className="text-muted-foreground mb-4">
                  Based on 234 reviews
                </p>
                <Button variant="outline">Read All Reviews</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
