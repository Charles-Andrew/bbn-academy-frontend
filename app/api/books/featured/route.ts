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

    const {
      data: books,
      error,
      count,
    } = await supabase
      .from("books")
      .select("*", { count: "exact" })
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(10);

    console.log("API: Direct query result:", {
      books: books?.length,
      error,
      count,
    });

    if (error) {
      console.error("API: Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!books || books.length === 0) {
      console.log("API: No featured books found");
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    console.log("API: Successfully fetched books:", books.length);

    return NextResponse.json({
      success: true,
      data: books,
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
