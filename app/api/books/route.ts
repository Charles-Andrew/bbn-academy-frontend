import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("API: Starting fetch for all books...");

    // Create a simple Supabase client for server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("API: Supabase client created");

    // Get query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    console.log("API: Query parameters:", {
      search,
      genre,
      sortBy,
      sortOrder,
      page,
      limit,
      offset,
    });

    // Build query
    let query = supabase
      .from("books")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%,tags.cs.{${search}}`,
      );
    }

    // Apply genre filter
    if (genre) {
      query = query.eq("genre", genre);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    console.log("API: Executing query...");
    const { data: books, error, count } = await query;

    console.log("API: Query result:", {
      books: books?.length,
      error,
      count,
    });

    if (error) {
      console.error("API: Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Get total count for pagination
    const totalCount = count || 0;

    console.log("API: Successfully fetched books:", books?.length);

    return NextResponse.json({
      success: true,
      data: books || [],
      totalCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("API: Error fetching books:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch books",
      },
      { status: 500 },
    );
  }
}
