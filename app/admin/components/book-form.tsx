import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Create a specific form schema that matches what the form expects
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  author: z.string().min(1, "Author is required"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  genre: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
  isbn: z.string().optional(),
  price: z.number().positive("Price must be positive").optional().nullable(),
  purchaseUrl: z
    .string()
    .url("Purchase URL must be valid")
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string()).max(10, "Too many tags"),
  featured: z.boolean(),
  content: z.string().optional(),
});

type BookFormData = z.infer<typeof formSchema>;

import { Book as BookIcon, X } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Book } from "@/types/book";

interface BookFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
  onSubmit: (data: BookFormData) => Promise<void>;
  loading?: boolean;
}

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Biography",
  "History",
  "Self-Help",
  "Business",
  "Technology",
  "Science",
  "Poetry",
  "Children",
  "Young Adult",
  "Educational",
];

export function BookForm({
  open,
  onOpenChange,
  book,
  onSubmit,
  loading = false,
}: BookFormProps) {
  const [tags, setTags] = useState<string[]>(book?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    book?.coverImage || null,
  );
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageRetries, setImageRetries] = useState(0);
  const [imageValidationMessage, setImageValidationMessage] = useState<
    string | null
  >(null);

  const form = useForm<BookFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      coverImage: "",
      author: "",
      genre: "",
      publishedAt: "",
      isbn: "",
      price: undefined,
      purchaseUrl: "",
      tags: [],
      featured: false,
      content: "",
    },
  });

  // Reset form when book prop changes
  useEffect(() => {
    setIsResetting(true);

    const resetForm = async () => {
      if (book) {
        await form.reset({
          title: book.title || "",
          description: book.description || "",
          coverImage: book.coverImage || "",
          author: book.author || "",
          genre: book.genre || "",
          publishedAt: book.publishedAt
            ? new Date(book.publishedAt).toISOString().split("T")[0]
            : "",
          isbn: book.isbn || "",
          price: book.price || undefined,
          purchaseUrl: book.purchaseUrl || "",
          tags: book.tags || [],
          featured: book.featured || false,
          content: book.content || "",
        });
        setTags(book.tags || []);
        setImagePreview(book.coverImage || null);
      } else {
        await form.reset({
          title: "",
          description: "",
          coverImage: "",
          author: "",
          genre: "",
          publishedAt: "",
          isbn: "",
          price: undefined,
          purchaseUrl: "",
          tags: [],
          featured: false,
          content: "",
        });
        setTags([]);
        setImagePreview(null);
      }
      // Reset file-related states
      setSelectedFile(null);
      setCurrentTag("");
      setImageError(false);
      setImageRetries(0);
      setImageValidationMessage(null);

      // Small delay to ensure form state is updated
      setTimeout(() => setIsResetting(false), 50);
    };

    resetForm();
  }, [book, form]);

  // Function to check if form has changes from initial book values
  const hasFormChanges = useCallback(() => {
    // Disable button while form is resetting
    if (isResetting) return false;

    if (!book) {
      // For new books, check if required fields have values
      return (
        form.getValues("title")?.trim() && form.getValues("author")?.trim()
      );
    }

    const currentValues = form.getValues();

    // Compare each field with original book values
    const fieldsToCheck = [
      "title",
      "description",
      "author",
      "genre",
      "isbn",
      "price",
      "purchaseUrl",
      "featured",
      "content",
    ];

    const hasFieldChanges = fieldsToCheck.some((field) => {
      const currentValue = currentValues[field as keyof typeof currentValues];
      const originalValue = book?.[field as keyof Book];

      // Handle number comparisons (price)
      if (field === "price") {
        return currentValue !== originalValue;
      }

      // Handle boolean comparisons (featured)
      if (field === "featured") {
        return currentValue !== originalValue;
      }

      // Handle string comparisons
      if (
        typeof currentValue === "string" &&
        typeof originalValue === "string"
      ) {
        return currentValue.trim() !== originalValue.trim();
      }

      return currentValue !== originalValue;
    });

    // Check published date separately
    const currentPublished = currentValues.publishedAt
      ? new Date(currentValues.publishedAt).toISOString().split("T")[0]
      : "";
    const originalPublished = book.publishedAt
      ? new Date(book.publishedAt).toISOString().split("T")[0]
      : "";
    if (currentPublished !== originalPublished) return true;

    // Check tags array
    const currentTags = currentValues.tags || [];
    const originalTags = book.tags || [];
    if (currentTags.length !== originalTags.length) return true;
    if (!currentTags.every((tag, index) => tag === originalTags[index]))
      return true;

    // Check cover image changes
    if (selectedFile) return true; // New file selected
    if (currentValues.coverImage !== book.coverImage) return true; // URL changed

    // Use dirty fields as additional check, but only for actual user changes
    const dirtyFieldKeys = Object.keys(form.formState.dirtyFields);
    return hasFieldChanges || dirtyFieldKeys.length > 0;
  }, [book, form, selectedFile, isResetting]);

  const handleImageSelect = useCallback(
    (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size cannot exceed 5MB");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Only image files are allowed");
        return;
      }

      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setImagePreview(previewUrl);
      setImageError(false); // Reset error state for new image
      setImageRetries(0); // Reset retry counter
      setImageValidationMessage(null);

      // Clear the URL input field since we're using a file
      form.setValue("coverImage", "");
    },
    [form],
  );

  const uploadImageToServer = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/books/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const { url } = await response.json();
      return url;
    },
    [],
  );

  const handleAddTag = useCallback(() => {
    if (
      currentTag.trim() &&
      tags.length < 10 &&
      !tags.includes(currentTag.trim())
    ) {
      const newTags = [...tags, currentTag.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setCurrentTag("");
    }
  }, [currentTag, tags, form]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      setTags(newTags);
      form.setValue("tags", newTags);
    },
    [tags, form],
  );

  // Validate image URL before submission
  const validateImageUrl = async (url: string): Promise<boolean> => {
    if (!url || url.trim() === "") return true; // No URL is valid (optional field)

    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      return response.ok && !!contentType && contentType.startsWith("image/");
    } catch (error) {
      console.error("Image URL validation failed:", error);
      return false;
    }
  };

  const handleUrlValidation = async (url: string) => {
    if (url && url.trim() !== "") {
      setImageValidationMessage("Validating image URL...");
      const isValid = await validateImageUrl(url);
      setImageValidationMessage(
        isValid
          ? "✓ Image URL is valid"
          : "✗ Image URL is invalid or not accessible",
      );

      if (!isValid) {
        setImageError(true);
      } else {
        setImageError(false);
      }
    } else {
      setImageValidationMessage(null);
    }
  };

  const handleSubmit = async (data: BookFormData) => {
    // If there's a selected file, upload it first
    let coverImageUrl = data.coverImage;

    if (selectedFile) {
      try {
        setUploading(true);
        coverImageUrl = await uploadImageToServer(selectedFile);
      } catch (error) {
        console.error("Upload error:", error);
        alert(
          "Failed to upload image: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
        return;
      } finally {
        setUploading(false);
      }
    } else if (coverImageUrl && !selectedFile) {
      // Validate URL if provided
      const isValidUrl = await validateImageUrl(coverImageUrl);
      if (!isValidUrl) {
        alert(
          "The provided image URL is not valid or accessible. Please provide a working image URL or upload an image file.",
        );
        return;
      }
    }

    await onSubmit({ ...data, tags, coverImage: coverImageUrl });
  };

  const handleFormSubmit = form.handleSubmit(handleSubmit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
          <DialogDescription>
            {book
              ? "Update the book details below."
              : "Fill in the details to add a new book to your catalog."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6 px-6">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <FormLabel>Cover Image</FormLabel>
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-1">
                    {imagePreview && !imageError ? (
                      <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          key={imageRetries}
                          src={imagePreview}
                          alt={`${book?.title || "New book"} cover preview`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 200px) 100vw, 200px"
                          onError={() => {
                            console.error(
                              `Failed to load preview image: ${imagePreview}`,
                            );
                            if (imageRetries < 2) {
                              setTimeout(
                                () => {
                                  setImageRetries((prev) => prev + 1);
                                  setImageError(false);
                                },
                                1000 * (imageRetries + 1),
                              );
                            } else {
                              setImageError(true);
                            }
                          }}
                          priority={false}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedFile(null);
                            setImageError(false);
                            setImageRetries(0);
                            setImageValidationMessage(null);
                            form.setValue("coverImage", "");
                            // Clear the file input
                            const fileInput = document.querySelector(
                              'input[type="file"]',
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gray-100 rounded-md flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                        <BookIcon className="h-8 w-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">
                          {imagePreview && imageError
                            ? "Image unavailable"
                            : "No image"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file);
                      }}
                      disabled={uploading}
                      className="mb-2"
                    />

                    <p className="text-xs text-gray-500">
                      JPEG, PNG, GIF, WebP (max 5MB)
                    </p>
                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="Or enter image URL directly"
                              className="mt-2"
                              onBlur={(e) => {
                                field.onBlur();
                                handleUrlValidation(e.target.value);
                              }}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value.trim() === "") {
                                  setImageValidationMessage(null);
                                  setImageError(false);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {imageValidationMessage && (
                            <p
                              className={`text-xs mt-1 ${imageValidationMessage.includes("✓") ? "text-green-600" : "text-red-600"}`}
                            >
                              {imageValidationMessage}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter book title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter author name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="publishedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN</FormLabel>
                      <FormControl>
                        <Input placeholder="ISBN-10 or ISBN-13" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter book description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : parseFloat(value),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/book"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <div className="space-y-2">
                <FormLabel>Tags (max 10)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!currentTag.trim()}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Featured Book</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Book Preview/Content (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter book preview or sample content"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="border-t pt-4">
                <div className="flex flex-col items-center gap-2 w-full">
                  {!hasFormChanges() && !loading && (
                    <p className="text-xs text-gray-500">
                      {book
                        ? "Make changes to enable the update button"
                        : "Fill in required fields to enable the add button"}
                    </p>
                  )}
                  <Button type="submit" disabled={loading || !hasFormChanges()}>
                    {loading ? "Saving..." : book ? "Update Book" : "Add Book"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
