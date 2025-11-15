import { BookOpen, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

const navigation = {
  explore: [
    { name: "All Books", href: "/books" },
    { name: "Featured", href: "/books?featured=true" },
    { name: "New Releases", href: "/books?sort=newest" },
  ],
  about: [
    { name: "About Me", href: "/about" },
    { name: "Writing Journey", href: "/about#journey" },
    { name: "Services", href: "/services" },
  ],
  connect: [
    { name: "Contact", href: "/contact" },
    { name: "Newsletter", href: "/contact#newsletter" },
    { name: "Social Media", href: "/about#social" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">
                BBN Academy
              </span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Discover stories that inspire, challenge, and transform. Explore a
              collection of personally written books that blend imagination with
              insight.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {navigation.explore.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              {navigation.connect.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BBN Academy. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
