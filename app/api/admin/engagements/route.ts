import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { engagementSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse and validate filters
    const filters = {
      search: searchParams.get("search") || undefined,
      type: (searchParams.get("type") as string) || undefined,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    let query = supabase.from("engagements").select("*", { count: "exact" });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "title",
    ];
    const sortField = validSortFields.includes(filters.sortBy)
      ? filters.sortBy
      : "created_at";
    const ascending = filters.sortOrder === "asc";

    const {
      data: engagements,
      error,
      count,
    } = await query
      .order(sortField, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching engagements:", error);
      return NextResponse.json(
        { error: "Failed to fetch engagements" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      engagements,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters,
    });
  } catch (error) {
    console.error("Error in engagements GET:", error);
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
    const validatedData = engagementSchema.parse(body);

    const supabase = await createClient();

    const { data: engagement, error } = await supabase
      .from("engagements")
      .insert({
        title: validatedData.title,
        slug: validatedData.slug,
        type: validatedData.type,
        description: validatedData.description,
        images: validatedData.images,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating engagement:", error);
      return NextResponse.json(
        { error: "Failed to create engagement", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ engagement }, { status: 201 });
  } catch (error) {
    console.error("Error in engagements POST:", error);

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
