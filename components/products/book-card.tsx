"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/types";

type Book = Database["public"]["Tables"]["books"]["Row"];

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 rounded-md mb-4 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {book.cover_image ? (
            <Image
              src={book.cover_image}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement("div");
                  icon.className = "h-16 w-16 text-primary";
                  icon.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5Z"/><path d="M8 2v20"/><path d="M12 2v20"/><path d="M16 2v20"/></svg>';
                  parent.appendChild(icon);
                }
              }}
            />
          ) : (
            <BookOpen className="h-16 w-16 text-primary" />
          )}
        </div>
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="text-center flex-shrink-0">
            <Badge variant="outline" className="text-xs mb-2 inline-block">
              {book.genre}
            </Badge>
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 leading-tight mb-1">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground">by {book.author}</p>
            {book.featured && (
              <Badge variant="secondary" className="text-xs mt-2">
                Featured
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 text-center">
            {book.description}
          </p>
          {book.price && (
            <div className="flex flex-col gap-3 mt-auto pt-3 text-center">
              <span className="text-lg font-semibold text-primary">
                ${book.price}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
