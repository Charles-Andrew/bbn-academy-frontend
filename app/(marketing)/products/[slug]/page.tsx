import { ArrowLeft, Package, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MotionFadeIn } from "@/components/ui/motion-fade-in";
import { getProductById } from "@/data/products";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductById(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/products" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        <MotionFadeIn className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-32 w-32 text-muted-foreground" />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="capitalize mb-4">
                {product.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price and Stock */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                {product.price ? (
                  <span className="text-3xl font-bold text-primary">
                    ${product.price}
                  </span>
                ) : (
                  <span className="text-lg text-muted-foreground">
                    Contact for pricing
                  </span>
                )}
              </div>
              <div className="text-right">
                {product.stock_quantity !== null ? (
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} in stock`
                      : "Out of stock"}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Digital product
                  </span>
                )}
              </div>
            </div>

            {/* Metadata */}
            {Object.keys(product.metadata).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Product Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(product.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-sm font-medium">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {product.category === "digital"
                  ? "Download Now"
                  : "Add to Cart"}
              </Button>
              <Button variant="outline" size="lg">
                Save for Later
              </Button>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Why Choose This Product?
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Expertly crafted content</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">
                      Proven results and testimonials
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Regular updates and support</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">
                      30-day satisfaction guarantee
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </MotionFadeIn>
      </div>
    </MainLayout>
  );
}
