import { ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MotionFadeIn,
  MotionStaggerChildren,
} from "@/components/ui/motion-fade-in";
import { getFeaturedPosts, getPublishedPosts } from "@/data/blogs";

export default async function BlogsPage() {
  const featuredPosts = await getFeaturedPosts();
  const recentPosts = (await getPublishedPosts()).slice(0, 6);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Insights &amp;
              <span className="text-primary"> Ideas</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore thought-provoking articles on technology, leadership,
              marketing, and personal development from industry experts.
            </p>
            <Button size="lg" asChild>
              <Link href="#recent-posts">
                Read Latest Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Featured Articles
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Handpicked stories that deserve your attention
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.slice(0, 2).map((post) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="aspect-[16/9] bg-muted rounded-md mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-muted-foreground">
                          Featured Image
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(
                            post.published_at || post.created_at,
                          ).toLocaleDateString()}
                        </div>
                        {post.reading_time && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {post.reading_time} min read
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.excerpt}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/blogs/${post.slug}`}>
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Recent Posts Section */}
      <section
        id="recent-posts"
        className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5"
      >
        <div className="container mx-auto px-4">
          <MotionFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Recent Articles
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest insights and trends
            </p>
          </MotionFadeIn>

          <MotionStaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="aspect-[16/9] bg-muted rounded-md mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Article Image
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(
                          post.published_at || post.created_at,
                        ).toLocaleDateString()}
                      </div>
                      {post.reading_time && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {post.reading_time} min
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link href={`/blogs/${post.slug}`}>
                          Read Article
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </MotionStaggerChildren>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link href="/blogs/all">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Stay in the Loop
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get the latest articles and insights delivered straight to your
              inbox. Join our community of curious minds.
            </p>
            <Button size="lg">Subscribe to Newsletter</Button>
          </MotionFadeIn>
        </div>
      </section>
    </MainLayout>
  );
}
