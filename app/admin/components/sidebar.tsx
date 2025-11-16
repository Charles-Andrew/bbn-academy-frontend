"use client";

import {
  BookOpen,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  Package,
  ScrollText,
  Sun,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Books", href: "/admin/books", icon: BookOpen },
  { name: "Blog Posts", href: "/admin/blogs", icon: FileText },
  { name: "Engagements", href: "/admin/engagements", icon: Users },
  { name: "Products", href: "/admin/products", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-full shrink-0 rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur lg:w-72">
      <div className="flex flex-col gap-6 h-full">
        <div>
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo.webp"
              alt="BBN Academy Logo"
              width={180}
              height={64}
              className="h-16 w-auto max-w-[180px] object-contain"
            />
          </div>
          <h2 className="text-2xl font-semibold text-foreground text-center">
            Admin Console
          </h2>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}

            {/* Logs Button */}
            <li>
              <Link
                href="/admin/logs"
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                  pathname === "/admin/logs"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <ScrollText className="h-5 w-5" />
                Application Logs
              </Link>
            </li>

            {/* Theme Toggle Button */}
            <li>
              <Button
                variant="ghost"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full justify-start gap-3 rounded-xl border border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/50 hover:text-foreground"
              >
                {mounted && theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </li>
          </ul>
        </nav>

        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 rounded-xl border border-border/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
