import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    console.log("API: Starting fetch for featured books...");

    // Create a simple Supabase client for server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("API: Supabase client created");

    // Get featured books and total count in parallel
    const [featuredQuery, totalQuery] = await Promise.all([
      supabase
        .from("books")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("books").select("*", { count: "exact", head: true }),
    ]);

    const { data: books, error: featuredError } = featuredQuery;
    const { count: totalCount, error: countError } = totalQuery;

    console.log("API: Query results:", {
      featuredBooks: books?.length,
      featuredError,
      totalCount,
      countError,
    });

    if (featuredError) {
      console.error("API: Supabase error (featured):", featuredError);
      throw new Error(`Database error: ${featuredError.message}`);
    }

    if (countError) {
      console.error("API: Supabase error (count):", countError);
      throw new Error(`Database error: ${countError.message}`);
    }

    if (!books || books.length === 0) {
      console.log("API: No featured books found");
      return NextResponse.json({
        success: true,
        data: [],
        totalCount: totalCount || 0,
      });
    }

    console.log("API: Successfully fetched books:", books.length);

    return NextResponse.json({
      success: true,
      data: books,
      totalCount: totalCount || 0,
    });
  } catch (error) {
    console.error("API: Error fetching featured books:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch featured books",
      },
      { status: 500 },
    );
  }
}
