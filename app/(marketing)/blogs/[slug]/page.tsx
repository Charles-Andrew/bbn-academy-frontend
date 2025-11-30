import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  Share2,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MotionFadeIn } from "@/components/ui/motion-fade-in";
import { getBlogSlugs, getPostBySlug, getRelatedPosts } from "@/data/blogs";

interface BlogPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// SSR: Generate static params for all blog posts at build time
export async function generateStaticParams() {
  const posts = await getBlogSlugs();
  return posts.map((slug) => ({
    slug,
  }));
}

// SSR: Generate metadata for each blog post
export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: `${post.title} | BBN Academy Blog`,
    description: post.excerpt || post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.slice(0, 160),
      type: "article",
      publishedTime: post.published_at || post.created_at,
      authors: ["Author Name"],
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post, 3);

  return (
    <MainLayout>
      <article className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/blogs" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <MotionFadeIn className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            <div className="mb-6">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>Author Name</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <time dateTime={post.published_at || post.created_at}>
                    {new Date(
                      post.published_at || post.created_at,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                {post.reading_time && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{post.reading_time} min read</span>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Image */}
            <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Featured Image
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Article featured image will appear here
                </p>
              </div>
            </div>
          </header>

          {/* Article Actions */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div className="text-foreground leading-relaxed space-y-6">
              {post.content.split("\n\n").map((paragraph) => (
                <p
                  key={paragraph.slice(0, 50)}
                  className="text-base leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Article Footer */}
          <footer className="border-t pt-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">About the Author</h3>
                <p className="text-muted-foreground">
                  Expert in technology, leadership, and digital transformation
                  with over a decade of experience.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/about">View Profile</Link>
              </Button>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blogs?tag=${tag}`}
                      className="hover:bg-accent"
                    >
                      <Badge variant="outline">{tag}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </MotionFadeIn>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-16 border-t">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="aspect-[16/9] bg-muted rounded-md mb-4 flex items-center justify-center">
                        <div className="text-center">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Article
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(
                              relatedPost.published_at ||
                                relatedPost.created_at,
                            ).toLocaleDateString()}
                          </div>
                          {relatedPost.reading_time && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {relatedPost.reading_time} min
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <div className="pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full"
                          >
                            <Link href={`/blogs/${relatedPost.slug}`}>
                              Read More
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </MainLayout>
  );
}
