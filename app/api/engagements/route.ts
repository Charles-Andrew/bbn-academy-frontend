import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("engagements")
      .select("*")
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data: engagements, error } = await query;

    if (error) {
      console.error("Error fetching engagements:", error);
      return NextResponse.json(
        { error: "Failed to fetch engagements" },
        { status: 500 },
      );
    }

    return NextResponse.json({ engagements });
  } catch (error) {
    console.error("Error in engagements API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
