import {
  Book as BookIcon,
  Edit,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onToggleFeatured: (bookId: string) => void;
  onView: (book: Book) => void;
}

export function BookCard({
  book,
  onEdit,
  onDelete,
  onToggleFeatured,
  onView,
}: BookCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageRetries, setImageRetries] = useState(0);
  const { promise } = useToast();

  const handleDelete = () => {
    promise(
      (async () => {
        const response = await fetch(`/api/admin/books/${book.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.error || errorData.details || "Failed to delete book";
          throw new Error(errorMessage);
        }

        // Call the parent's onDelete function to update local state
        onDelete(book.id);
        setDeleteDialogOpen(false);

        return { deleted: true, bookTitle: book.title };
      })(),
      {
        loading: "Deleting book...",
        success: (result) => `"${result.bookTitle}" deleted successfully!`,
        error: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete book";
          return errorMessage;
        },
      },
    );
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleImageError = () => {
    console.error(
      `Failed to load image for book "${book.title}": ${book.coverImage}`,
    );
    if (imageRetries < 2) {
      // Retry loading the image up to 2 times
      setTimeout(
        () => {
          setImageRetries((prev) => prev + 1);
          setImageError(false);
        },
        1000 * (imageRetries + 1),
      ); // Exponential backoff
    } else {
      setImageError(true);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              {/* Book Cover */}
              <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                {book.coverImage && !imageError ? (
                  <Image
                    key={imageRetries} // Force re-render on retry
                    src={book.coverImage}
                    alt={`${book.title} book cover`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    onError={handleImageError}
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <BookIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  {book.featured && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  by {book.author}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {book.genre}
                  </Badge>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatPrice(book.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(book)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(book)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFeatured(book.id)}>
                  {book.featured ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Remove from Featured
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Mark as Featured
                    </>
                  )}
                </DropdownMenuItem>
                {book.purchaseUrl && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a
                        href={book.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Purchase Link
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {book.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>Published: {new Date(book.publishedAt).getFullYear()}</span>
            {book.isbn && <span className="font-mono">ISBN: {book.isbn}</span>}
          </div>

          {book.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {book.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-1.5 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {book.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{book.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{book.title}" by {book.author}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
