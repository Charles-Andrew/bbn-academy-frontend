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
      status: (searchParams.get("status") as string) || undefined,
      upcoming:
        searchParams.get("upcoming") === "true"
          ? true
          : searchParams.get("upcoming") === "false"
            ? false
            : undefined,
      virtual:
        searchParams.get("virtual") === "true"
          ? true
          : searchParams.get("virtual") === "false"
            ? false
            : undefined,
      featured:
        searchParams.get("featured") === "true"
          ? true
          : searchParams.get("featured") === "false"
            ? false
            : undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
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
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`,
      );
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.upcoming !== undefined) {
      if (filters.upcoming) {
        query = query.eq("status", "upcoming");
      } else {
        query = query.neq("status", "upcoming");
      }
    }

    if (filters.virtual !== undefined) {
      query = query.eq("is_virtual", filters.virtual);
    }

    if (filters.featured !== undefined) {
      query = query.eq("is_featured", filters.featured);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains("tags", filters.tags);
    }

    if (filters.dateFrom) {
      query = query.gte("date", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("date", filters.dateTo);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "date",
      "title",
      "price",
      "status",
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
        content: validatedData.content,
        images: validatedData.images,
        date: validatedData.date,
        duration: validatedData.duration,
        price: validatedData.price,
        max_attendees: validatedData.maxAttendees,
        location: validatedData.location,
        is_virtual: validatedData.isVirtual,
        is_featured: validatedData.isFeatured,
        booking_url: validatedData.bookingUrl,
        status: validatedData.status,
        tags: validatedData.tags,
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
