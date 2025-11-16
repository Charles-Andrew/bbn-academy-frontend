import {
  ArrowRight,
  BookOpen,
  Calendar,
  Package,
  Quote,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MotionFadeIn,
  MotionStaggerChildren,
} from "@/components/ui/motion-fade-in";
import { NewsletterSignup } from "@/components/ui/newsletter-signup";
import {
  getFeaturedPostsSync as getFeaturedPosts,
  getFeaturedProducts,
  getUpcomingEngagements,
} from "@/data";

export const metadata = {
  title: "BBN Academy - Building Brighter Nexts",
  description:
    "Discover premium products, insightful articles, and engaging workshops designed to accelerate your personal and professional growth.",
  openGraph: {
    title: "BBN Academy - Building Brighter Nexts",
    description:
      "Discover premium products, insightful articles, and engaging workshops designed to accelerate your personal and professional growth.",
    type: "website",
  },
};

// SSG: Generate static props at build time
export async function generateStaticParams() {
  return [];
}

export default function Home() {
  const featuredProducts = getFeaturedProducts();
  const featuredPosts = getFeaturedPosts();
  const upcomingEngagements = getUpcomingEngagements().slice(0, 3);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Building
              <span className="text-primary"> Brighter</span>
              <br />
              <span className="text-secondary">Nexts</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Discover premium products, insightful articles, and engaging
              workshops designed to accelerate your personal and professional
              growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary hover:text-foreground transition-all duration-300" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-semibold mb-4">
              Premium Resources
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Featured <span className="text-primary">Products</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium resources designed to accelerate your growth and success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative bg-card rounded-lg border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[16/9] bg-muted rounded-md mb-4 flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {product.category}
                    </span>
                    {product.price && (
                      <span className="text-lg font-semibold text-primary">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <Link href={`/products/${product.id}`}>
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300" asChild>
              <Link href="/products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              Community Voice
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              What <span className="text-secondary">Readers</span> Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real feedback from readers who have been inspired by my books
            </p>
          </MotionFadeIn>

          <MotionStaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Book Reviewer",
                content:
                  "An absolutely captivating collection! Each story offers a unique perspective on technology and humanity that stays with you long after finishing.",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "Tech Entrepreneur",
                content:
                  "The perfect blend of philosophical depth and engaging storytelling. These books challenged my perspectives in the best way possible.",
                rating: 5,
              },
              {
                name: "Emily Rodriguez",
                role: "Literature Student",
                content:
                  "Beautifully written with insights that resonate on multiple levels. I found myself rereading passages to fully appreciate their depth.",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-primary/10">
                    <Quote className="w-12 h-12" />
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={`star-${testimonial.name}-${i}`}
                        className="w-4 h-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </MotionStaggerChildren>
        </div>
      </section>

      {/* Latest Articles Section */}
      {featuredPosts.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Latest Insights
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Fresh perspectives on technology, leadership, and growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="aspect-[16/9] bg-muted rounded-md mb-4 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
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
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" asChild>
                <Link href="/blogs">
                  View All Articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Section */}
      {upcomingEngagements.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Upcoming Events
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join me for workshops, talks, and learning experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingEngagements.map((engagement) => (
                <Card
                  key={engagement.id}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {engagement.type}
                        </span>
                        {engagement.date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(engagement.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                        {engagement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {engagement.description}
                      </p>
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full"
                        >
                          <Link href="/engagements">
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" asChild>
                <Link href="/engagements">
                  View All Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Impact by the <span className="text-primary">Numbers</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2 bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-primary/20">
              <div className="flex justify-center">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-primary">15+</h3>
              <p className="text-muted-foreground">Premium Products</p>
            </div>
            <div className="space-y-2 bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-secondary/20">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-secondary" />
              </div>
              <h3 className="text-3xl font-bold text-secondary">5K+</h3>
              <p className="text-muted-foreground">Community Members</p>
            </div>
            <div className="space-y-2 bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-primary/20">
              <div className="flex justify-center">
                <Star className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-primary">4.9</h3>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-semibold mb-4">
              Get Started Today
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to <span className="text-primary">Grow</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Whether through products, articles, or engagements, I'm here to
              support your journey of continuous improvement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                <Link href="/products">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300" asChild>
                <Link href="/engagements">View Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              Join Our Community
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Stay <span className="text-secondary">Connected</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get updates on new books, exclusive writing tips, and special
              offers delivered to your inbox.
            </p>
          </MotionFadeIn>

          <NewsletterSignup />
        </div>
      </section>
    </MainLayout>
  );
}
