import { type NextRequest, NextResponse } from "next/server";
import { getBlogPosts } from "@/lib/supabase/blog-server";
import { blogFiltersSchema, paginationSchema } from "@/lib/validations";

// GET /api/blogs - Public blog posts API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const paginationData = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: Math.min(Number(searchParams.get("limit")) || 12, 50), // Cap at 50 items
    });

    // Parse filters with public-only defaults
    const filtersData = blogFiltersSchema.parse({
      search: searchParams.get("search") || undefined,
      status: "published", // Always show only published posts for public API
      author: undefined, // Don't allow author filtering for public API
      tags: searchParams.get("tags")?.split(",").filter(Boolean),
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      featured: searchParams.get("featured")
        ? searchParams.get("featured") === "true"
        : undefined,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    // Fetch blog posts using existing server function
    const result = await getBlogPosts(paginationData, filtersData);

    // Transform the response to match expected API format
    const response = {
      success: true,
      data: result.posts,
      totalCount: result.pagination.total,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalCount: result.pagination.total,
        totalPages: result.pagination.pages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching blog posts:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch blog posts",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
