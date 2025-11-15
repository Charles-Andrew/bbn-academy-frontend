"use client";

import { useState, useEffect } from "react";
import { Book } from "@/types/book";
import { BookData } from "@/lib/validations";
import { useAdminStore } from "@/store/admin-store";
import { BookCard } from "@/app/admin/components/book-card";
import { BookForm } from "@/app/admin/components/book-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Filter, BookOpen, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GENRE_OPTIONS = [
    { label: "Fiction", value: "Fiction" },
    { label: "Non-Fiction", value: "Non-Fiction" },
    { label: "Science Fiction", value: "Science Fiction" },
    { label: "Fantasy", value: "Fantasy" },
    { label: "Mystery", value: "Mystery" },
    { label: "Thriller", value: "Thriller" },
    { label: "Romance", value: "Romance" },
    { label: "Biography", value: "Biography" },
    { label: "History", value: "History" },
    { label: "Self-Help", value: "Self-Help" },
    { label: "Business", value: "Business" },
    { label: "Technology", value: "Technology" },
    { label: "Science", value: "Science" },
    { label: "Poetry", value: "Poetry" },
    { label: "Children", value: "Children" },
    { label: "Young Adult", value: "Young Adult" },
    { label: "Educational", value: "Educational" },
];

const FEATURED_OPTIONS = [
    { label: "Featured", value: "featured" as const },
    { label: "Non-Featured", value: "non-featured" as const },
];

export default function BooksAdminPage() {
    const [formOpen, setFormOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [viewingBook, setViewingBook] = useState<Book | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [bookStats, setBookStats] = useState({ totalBooks: 0, featuredBooks: 0 });

    const {
        books,
        loading,
        error,
        bookFilters,
        setBooks,
        setLoading,
        setError,
        setBookFilters,
        addBook,
        updateBook,
        removeBook,
        toggleBookFeatured,
        getFilteredBooks,
    } = useAdminStore();

    const filteredBooks = getFilteredBooks();

    const fetchBookStats = async () => {
        try {
            const response = await fetch("/api/admin/books/stats");
            if (!response.ok) {
                throw new Error("Failed to fetch book stats");
            }
            const stats = await response.json();
            setBookStats(stats);
        } catch (err) {
            console.error("Error fetching book stats:", err);
        }
    };

    const fetchBooks = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
            });

            if (bookFilters.search) params.append("search", bookFilters.search);
            if (bookFilters.genres && bookFilters.genres.length > 0) {
                bookFilters.genres.forEach((genre) =>
                    params.append("genres", genre),
                );
            }
            if (
                bookFilters.featuredStatus &&
                bookFilters.featuredStatus.length > 0
            ) {
                const isFeatured =
                    bookFilters.featuredStatus.includes("featured");
                if (bookFilters.featuredStatus.length === 1) {
                    params.append("featured", isFeatured.toString());
                }
            }

            const response = await fetch(
                `/api/admin/books?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error("Failed to fetch books");
            }

            const data = await response.json();
            setBooks(data.books);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch books",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
        fetchBookStats();
    }, [page, bookFilters]);

    const handleAddBook = () => {
        setEditingBook(null);
        setFormOpen(true);
    };

    const handleEditBook = (book: Book) => {
        setEditingBook(book);
        setFormOpen(true);
    };

    const handleViewBook = (book: Book) => {
        setViewingBook(book);
    };

    const handleDeleteBook = (bookId: string) => {
        setBookToDelete(bookId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!bookToDelete) return;

        try {
            const response = await fetch(`/api/admin/books/${bookToDelete}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete book");
            }

            removeBook(bookToDelete);
            setDeleteDialogOpen(false);
            setBookToDelete(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to delete book",
            );
        }
    };

    const handleToggleFeatured = async (bookId: string) => {
        try {
            toggleBookFeatured(bookId);

            // Optimistically update, but we should also update the database
            const book = books.find((b) => b.id === bookId);
            if (book) {
                const response = await fetch(`/api/admin/books/${bookId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...book,
                        featured: !book.featured,
                    }),
                });

                if (!response.ok) {
                    // Revert if failed
                    toggleBookFeatured(bookId);
                    throw new Error("Failed to update book");
                }
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update book",
            );
        }
    };

    const handleFormSubmit = async (data: BookData) => {
        try {
            const url = editingBook
                ? `/api/admin/books/${editingBook.id}`
                : "/api/admin/books";

            const method = editingBook ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save book");
            }

            const result = await response.json();

            if (editingBook) {
                updateBook(editingBook.id, result.book);
            } else {
                addBook(result.book);
            }

            setFormOpen(false);
            setEditingBook(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save book",
            );
        }
    };

    const handleSearchChange = (value: string) => {
        setBookFilters({ search: value });
        setPage(1);
    };

    const handleGenresChange = (genres: string[]) => {
        setBookFilters({
            ...bookFilters,
            genres: genres.length > 0 ? genres : undefined,
        });
        setPage(1);
    };

    const handleFeaturedStatusChange = (
        status: ("featured" | "non-featured")[],
    ) => {
        setBookFilters({
            ...bookFilters,
            featuredStatus: status.length > 0 ? status : undefined,
        });
        setPage(1);
    };

    const featuredCount = bookStats.featuredBooks;
    const totalCount = bookStats.totalBooks;

    return (
        <div className="h-full flex flex-col space-y-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Books Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your book catalog and inventory ({totalCount}{" "}
                        books)
                    </p>
                </div>
                <Button onClick={handleAddBook} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Book
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Books
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Featured Books
                        </CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {featuredCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Filtered Results
                        </CardTitle>
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredBooks.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-3">
                <div className="flex flex-col space-y-1.5">
                    <div className="font-semibold tracking-tight text-base">
                        Filters
                    </div>
                </div>
                <div className="mt-1 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search books..."
                                value={bookFilters.search || ""}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="pl-10 h-10"
                            />
                        </div>
                    </div>

                    <MultiSelect
                        options={GENRE_OPTIONS}
                        selected={bookFilters.genres || []}
                        onChange={handleGenresChange}
                        placeholder="Select Genres"
                        className="w-full sm:w-48 h-10"
                    />

                    <MultiSelect
                        options={FEATURED_OPTIONS}
                        selected={bookFilters.featuredStatus || []}
                        onChange={handleFeaturedStatusChange}
                        placeholder="Featured Status"
                        className="w-full sm:w-40 h-10"
                    />
                </div>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <CardContent className="pt-6">
                        <p className="text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Books List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence>
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 8 }).map((_, index) => (
                            <motion.div
                                key={`skeleton-${index}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Card className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-200 rounded"></div>
                                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : filteredBooks.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No books found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {bookFilters.search ||
                                (bookFilters.genres &&
                                    bookFilters.genres.length > 0) ||
                                (bookFilters.featuredStatus &&
                                    bookFilters.featuredStatus.length > 0)
                                    ? "Try adjusting your filters or search terms."
                                    : "Get started by adding your first book to the catalog."}
                            </p>
                            {!bookFilters.search &&
                                (!bookFilters.genres ||
                                    bookFilters.genres.length === 0) &&
                                (!bookFilters.featuredStatus ||
                                    bookFilters.featuredStatus.length ===
                                        0) && (
                                    <Button onClick={handleAddBook}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Your First Book
                                    </Button>
                                )}
                        </div>
                    ) : (
                        filteredBooks.map((book) => (
                            <motion.div
                                key={book.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <BookCard
                                    book={book}
                                    onEdit={handleEditBook}
                                    onDelete={handleDeleteBook}
                                    onToggleFeatured={handleToggleFeatured}
                                    onView={handleViewBook}
                                />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Book Form Dialog */}
            <BookForm
                open={formOpen}
                onOpenChange={setFormOpen}
                book={editingBook}
                onSubmit={handleFormSubmit}
                loading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Book</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this book? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Book View Dialog */}
            <Dialog
                open={!!viewingBook}
                onOpenChange={() => setViewingBook(null)}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {viewingBook && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{viewingBook.title}</DialogTitle>
                                <DialogDescription>
                                    by {viewingBook.author} •{" "}
                                    {viewingBook.genre}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    {viewingBook.coverImage && (
                                        <div className="relative w-32 h-48 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            <img
                                                src={viewingBook.coverImage}
                                                alt={viewingBook.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h4 className="font-semibold">
                                                Description
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {viewingBook.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold">
                                                    Published:
                                                </span>{" "}
                                                {new Date(
                                                    viewingBook.publishedAt,
                                                ).toLocaleDateString()}
                                            </div>
                                            {viewingBook.isbn && (
                                                <div>
                                                    <span className="font-semibold">
                                                        ISBN:
                                                    </span>{" "}
                                                    {viewingBook.isbn}
                                                </div>
                                            )}
                                            {viewingBook.price && (
                                                <div>
                                                    <span className="font-semibold">
                                                        Price:
                                                    </span>{" "}
                                                    $
                                                    {viewingBook.price.toFixed(
                                                        2,
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-semibold">
                                                    Featured:
                                                </span>{" "}
                                                {viewingBook.featured
                                                    ? "Yes"
                                                    : "No"}
                                            </div>
                                        </div>

                                        {viewingBook.tags.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-2">
                                                    Tags
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {viewingBook.tags.map(
                                                        (tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="secondary"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {viewingBook.purchaseUrl && (
                                            <div>
                                                <a
                                                    href={
                                                        viewingBook.purchaseUrl
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                                >
                                                    View Purchase Link
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {viewingBook.content && (
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Book Preview
                                        </h4>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md max-h-64 overflow-y-auto">
                                            <p className="text-sm whitespace-pre-wrap">
                                                {viewingBook.content}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
