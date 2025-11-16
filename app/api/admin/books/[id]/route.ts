import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: book, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      console.error("Error fetching book:", error);
      return NextResponse.json(
        { error: "Failed to fetch book" },
        { status: 500 },
      );
    }

    // Transform snake_case to camelCase for frontend compatibility
    let transformedCoverImage = book?.cover_image;

    // Filter out invalid image URLs
    if (book?.cover_image) {
      // Handle local paths - set to null so they'll show fallback
      if (
        book.cover_image.startsWith("/images/") ||
        book.cover_image.startsWith("images/")
      ) {
        transformedCoverImage = null;
      }
      // Validate and transform Supabase storage URLs if they exist
      else if (book.cover_image.includes("supabase.co")) {
        // Ensure the URL is properly formatted for Next.js Image component
        if (!book.cover_image.startsWith("http")) {
          transformedCoverImage = `https://gzksezmqcnzgtoyznsjq.supabase.co/storage/v1/object/public/${book.cover_image}`;
        }
      }
      // Validate external URLs
      else if (!book.cover_image.startsWith("http")) {
        transformedCoverImage = null; // Invalid URL format
      }
    }

    const transformedBook = book
      ? {
          ...book,
          coverImage: transformedCoverImage,
          publishedAt: book.published_at,
          purchaseUrl: book.purchase_url,
          createdAt: book.created_at,
          updatedAt: book.updated_at,
        }
      : null;

    return NextResponse.json({ book: transformedBook });
  } catch (error) {
    console.error("Error in book GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = bookSchema.parse(body);

    const { id } = await params;
    const supabase = await createClient();

    const { data: book, error } = await supabase
      .from("books")
      .update({
        title: validatedData.title,
        description: validatedData.description,
        cover_image: validatedData.coverImage,
        author: validatedData.author,
        genre: validatedData.genre,
        published_at:
          validatedData.publishedAt && validatedData.publishedAt.trim() !== ""
            ? new Date(validatedData.publishedAt).toISOString()
            : null,
        isbn: validatedData.isbn,
        price: validatedData.price,
        purchase_url: validatedData.purchaseUrl,
        tags: validatedData.tags,
        featured: validatedData.featured,
        content: validatedData.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      console.error("Error updating book:", error);
      return NextResponse.json(
        {
          error: "Failed to update book",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    // Transform snake_case to camelCase for frontend compatibility
    let transformedCoverImage = book?.cover_image;

    // Filter out invalid image URLs
    if (book?.cover_image) {
      // Handle local paths - set to null so they'll show fallback
      if (
        book.cover_image.startsWith("/images/") ||
        book.cover_image.startsWith("images/")
      ) {
        transformedCoverImage = null;
      }
      // Validate and transform Supabase storage URLs if they exist
      else if (book.cover_image.includes("supabase.co")) {
        // Ensure the URL is properly formatted for Next.js Image component
        if (!book.cover_image.startsWith("http")) {
          transformedCoverImage = `https://gzksezmqcnzgtoyznsjq.supabase.co/storage/v1/object/public/${book.cover_image}`;
        }
      }
      // Validate external URLs
      else if (!book.cover_image.startsWith("http")) {
        transformedCoverImage = null; // Invalid URL format
      }
    }

    const transformedBook = book
      ? {
          ...book,
          coverImage: transformedCoverImage,
          publishedAt: book.published_at,
          purchaseUrl: book.purchase_url,
          createdAt: book.created_at,
          updatedAt: book.updated_at,
        }
      : null;

    return NextResponse.json({ book: transformedBook });
  } catch (error) {
    console.error("Error in book PUT:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.message,
          validationError: true,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // First, get the book details to check if it has a cover image
    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("cover_image")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      console.error("Error fetching book for deletion:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch book for deletion" },
        { status: 500 },
      );
    }

    // Delete the book from the database
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting book:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete book" },
        { status: 500 },
      );
    }

    // If the book had a cover image, delete it from storage
    if (book?.cover_image) {
      try {
        // Extract filename from the cover_image URL
        let fileName = book.cover_image;

        // Handle different URL formats
        if (
          fileName.includes("supabase.co/storage/v1/object/public/book-covers/")
        ) {
          // Extract filename from full Supabase URL
          const urlParts = fileName.split("book-covers/");
          if (urlParts.length > 1) {
            fileName = urlParts[1];
          }
        } else if (fileName.startsWith("http")) {
          // External URL - don't delete from our storage
          console.log(`Skipping external image URL: ${fileName}`);
        } else if (!fileName.startsWith("http") && !fileName.startsWith("/")) {
          // Assume it's just the filename
          // fileName is already correct
        } else {
          // Local path or invalid format - skip deletion
          console.log(`Skipping local/invalid path: ${fileName}`);
          fileName = null;
        }

        // Delete the image from storage if we have a valid filename
        if (fileName?.includes("book-covers/")) {
          const { error: storageError } = await supabase.storage
            .from("book-covers")
            .remove([fileName]);

          if (storageError) {
            console.warn(
              `Warning: Failed to delete cover image "${fileName}" from storage:`,
              storageError,
            );
            // Don't fail the deletion if image cleanup fails, but log it
          } else {
            console.log(`Successfully deleted cover image: ${fileName}`);
          }
        } else if (
          fileName &&
          !fileName.startsWith("http") &&
          !fileName.startsWith("/")
        ) {
          // Direct filename (no path prefix)
          const { error: storageError } = await supabase.storage
            .from("book-covers")
            .remove([fileName]);

          if (storageError) {
            console.warn(
              `Warning: Failed to delete cover image "${fileName}" from storage:`,
              storageError,
            );
          } else {
            console.log(`Successfully deleted cover image: ${fileName}`);
          }
        }
      } catch (imageError) {
        console.error("Error deleting cover image:", imageError);
        // Don't fail the book deletion if image cleanup fails
      }
    }

    return NextResponse.json({
      success: true,
      message: book?.cover_image
        ? "Book and cover image deleted successfully"
        : "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error in book DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
