import { BookOpen, Package } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { FeaturedBooksSection } from "@/components/products/featured-books-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MotionFadeIn,
  MotionStaggerChildren,
} from "@/components/ui/motion-fade-in";
import { getFeaturedProducts, getProductCategories } from "@/data/products";

export default function ProductsPage() {
  const featuredProducts = getFeaturedProducts();
  const categories = getProductCategories();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Premium Products
              <span className="text-primary"> & Books for Growth</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover carefully curated digital products, courses, books, and
              resources designed to accelerate your personal and professional
              development.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="capitalize"
                >
                  {category}
                </Badge>
              ))}
              <Badge variant="secondary" className="capitalize">
                Books
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Handpicked selections that deliver exceptional value and results
            </p>
          </div>

          <MotionStaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="aspect-[16/9] bg-muted rounded-md mb-4 flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                      {product.price && (
                        <span className="text-lg font-semibold text-primary">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </MotionStaggerChildren>
        </div>
      </section>

      <FeaturedBooksSection />

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <MotionFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find exactly what you're looking for in our organized categories
            </p>
          </MotionFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Card
                key={category}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 capitalize">
                    {category}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {category === "digital" &&
                      "Instant downloads, lifetime access"}
                    {category === "physical" &&
                      "Tangible products, shipped worldwide"}
                    {category === "course" &&
                      "Live sessions, expert instruction"}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Books
                </h3>
                <p className="text-muted-foreground mb-4">
                  Curated collection of transformative books across various
                  genres and topics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
