import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";
import { createClient } from "@/lib/supabase/server";
import { bookSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("books")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    if (genre) {
      query = query.eq("genre", genre);
    }

    if (featured === "true") {
      query = query.eq("featured", true);
    } else if (featured === "false") {
      query = query.eq("featured", false);
    }

    const {
      data: books,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching books:", error);
      await logger.logError(
        "fetch_books_failed",
        error,
        { search, genre, featured, page, limit },
        undefined,
        request,
      );
      return NextResponse.json(
        { error: "Failed to fetch books" },
        { status: 500 },
      );
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedBooks = books
      ? books.map((book) => {
          let transformedCoverImage = book.cover_image;

          // Filter out invalid image URLs
          if (book.cover_image) {
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

          return {
            ...book,
            coverImage: transformedCoverImage,
            publishedAt: book.published_at,
            purchaseUrl: book.purchase_url,
            createdAt: book.created_at,
            updatedAt: book.updated_at,
          };
        })
      : [];

    // Don't log simple fetch operations - only important actions

    return NextResponse.json({
      books: transformedBooks,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in books GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = bookSchema.parse(body);

    const supabase = await createClient();

    // Extract user info for logging (you may want to get this from auth session)
    const currentUser = { id: "admin_user", email: "admin@example.com" }; // Update with actual user extraction

    const { data: book, error } = await supabase
      .from("books")
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating book:", error);

      await logger.logError(
        "book_creation_failed",
        error,
        {
          book_title: validatedData.title,
          book_author: validatedData.author,
          book_genre: validatedData.genre,
          validation_data: validatedData,
        },
        currentUser,
        request,
      );

      // Determine the specific error type
      let errorMessage = "Failed to create book";
      let statusCode = 500;

      if (error.code === "42501") {
        errorMessage =
          "Permission denied: You don't have admin privileges to create books";
        statusCode = 403;
      } else if (error.code === "23505") {
        errorMessage = "A book with this title already exists";
        statusCode = 409;
      } else if (error.code === "23514") {
        errorMessage = "Invalid data: Required fields are missing";
        statusCode = 400;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: error.code ? `Database error: ${error.code}` : undefined,
        },
        { status: statusCode },
      );
    }

    // Log successful book creation
    await logger.logBookOperation(
      "created",
      {
        id: book.id,
        title: book.title,
        author: book.author,
      },
      currentUser,
      [`Created new book: ${book.title}`],
    );

    // Transform snake_case to camelCase for frontend compatibility
    let transformedCoverImage = book.cover_image;

    // Filter out invalid image URLs
    if (book.cover_image) {
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

    return NextResponse.json({ book: transformedBook }, { status: 201 });
  } catch (error) {
    console.error("Error in books POST:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
