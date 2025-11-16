import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    console.log("API: Starting fetch for book genres...");

    // Create a simple Supabase client for server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("API: Supabase client created");

    // Get unique genres from books table
    const { data: genres, error } = await supabase
      .from("books")
      .select("genre")
      .not("genre", "is", null)
      .not("genre", "eq", "");

    console.log("API: Genres query result:", {
      genres: genres?.length,
      error,
    });

    if (error) {
      console.error("API: Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Extract unique genres
    const uniqueGenres = [
      ...new Set(genres?.map((item) => item.genre).filter(Boolean)),
    ];

    console.log(
      "API: Successfully fetched unique genres:",
      uniqueGenres.length,
    );

    return NextResponse.json({
      success: true,
      data: uniqueGenres,
    });
  } catch (error) {
    console.error("API: Error fetching genres:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch genres",
      },
      { status: 500 },
    );
  }
}
