import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get total books count
    const { count: totalCount, error: totalError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("Error fetching total books count:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch total books count" },
        { status: 500 },
      );
    }

    // Get featured books count
    const { count: featuredCount, error: featuredError } = await supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("featured", true);

    if (featuredError) {
      console.error("Error fetching featured books count:", featuredError);
      return NextResponse.json(
        { error: "Failed to fetch featured books count" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      totalBooks: totalCount || 0,
      featuredBooks: featuredCount || 0,
    });
  } catch (error) {
    console.error("Error in books stats GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
