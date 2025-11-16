import type { Database } from "./types";

// Helper function to get the right client based on context
async function getSupabaseClient() {
  // Dynamic imports to avoid bundling issues
  if (typeof window === "undefined") {
    const { createClient } = await import("./server");
    return createClient();
  } else {
    const { createClient } = await import("./client");
    return createClient();
  }
}

type Book = Database["public"]["Tables"]["books"]["Row"];
type BookInsert = Database["public"]["Tables"]["books"]["Insert"];
type BookUpdate = Database["public"]["Tables"]["books"]["Update"];

// Books CRUD Operations
export async function getBooks(
  filters: {
    featured?: boolean;
    genre?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ books: Book[]; total: number }> {
  const supabase = await getSupabaseClient();

  let query = supabase
    .from("books")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.featured !== undefined) {
    query = query.eq("featured", filters.featured);
  }

  if (filters.genre) {
    query = query.eq("genre", filters.genre);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1,
    );
  }

  const { data: books, error, count } = await query;

  if (error) {
    console.error("Error fetching books:", error);
    throw new Error("Failed to fetch books");
  }

  return {
    books: books || [],
    total: count || 0,
  };
}

export async function getBookById(id: string): Promise<Book | null> {
  const supabase = await getSupabaseClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching book by ID:", error);
    if (error.code === "PGRST116") {
      // Record not found
      return null;
    }
    throw new Error("Failed to fetch book");
  }

  return book;
}

export async function getFeaturedBooks(limit: number = 10): Promise<Book[]> {
  const { books } = await getBooks({ featured: true, limit });
  return books;
}

export async function getBooksByGenre(
  genre: string,
  limit: number = 10,
): Promise<Book[]> {
  const { books } = await getBooks({ genre, limit });
  return books;
}

export async function searchBooks(
  query: string,
  limit: number = 20,
): Promise<Book[]> {
  const supabase = await getSupabaseClient();

  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .or(
      `title.ilike.%${query}%,description.ilike.%${query}%,author.ilike.%${query}%,tags.cs.{${query}}`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching books:", error);
    throw new Error("Failed to search books");
  }

  return books || [];
}

export async function createBook(data: BookInsert): Promise<Book> {
  const supabase = await getSupabaseClient();

  const { data: book, error } = await supabase
    .from("books")
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating book:", error);
    throw new Error("Failed to create book");
  }

  return book;
}

export async function updateBook(id: string, data: BookUpdate): Promise<Book> {
  const supabase = await getSupabaseClient();

  const { data: book, error } = await supabase
    .from("books")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating book:", error);
    throw new Error("Failed to update book");
  }

  return book;
}

export async function deleteBook(id: string): Promise<void> {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) {
    console.error("Error deleting book:", error);
    throw new Error("Failed to delete book");
  }
}

export async function toggleBookFeatured(id: string): Promise<Book> {
  const supabase = await getSupabaseClient();

  // First get the current book to determine the new state
  const { data: currentBook } = await supabase
    .from("books")
    .select("featured")
    .eq("id", id)
    .single();

  if (!currentBook) {
    throw new Error("Book not found");
  }

  const newFeaturedState = !currentBook.featured;

  const { data: book, error } = await supabase
    .from("books")
    .update({
      featured: newFeaturedState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling book featured state:", error);
    throw new Error("Failed to toggle book featured state");
  }

  return book;
}

// Utility Functions
export async function getBookGenres(): Promise<string[]> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("books")
    .select("genre")
    .not("genre", "is", null);

  if (error) {
    console.error("Error fetching book genres:", error);
    throw new Error("Failed to fetch book genres");
  }

  // Extract unique genres
  const genres = [...new Set(data?.map((book) => book.genre) || [])];
  return genres.sort();
}

// Book Statistics
export async function getBookStats() {
  const supabase = await getSupabaseClient();

  const [totalResult, featuredResult, genresResult] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("featured", true),
    supabase
      .from("books")
      .select("genre", { count: "exact", head: true })
      .not("genre", "is", null),
  ]);

  // Get unique genre count
  const uniqueGenres = genresResult.data
    ? [...new Set(genresResult.data.map((book) => book.genre))].length
    : 0;

  return {
    total: totalResult.count || 0,
    featured: featuredResult.count || 0,
    genres: uniqueGenres,
  };
}
