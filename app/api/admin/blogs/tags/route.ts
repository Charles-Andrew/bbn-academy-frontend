import { type NextRequest, NextResponse } from "next/server";
import { createBlogTag, getBlogTags } from "@/lib/supabase/blog-server";
import { createClient } from "@/lib/supabase/server";
import { blogTagSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let tags = await getBlogTags();

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      tags = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchLower) ||
          tag.slug.toLowerCase().includes(searchLower),
      );
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error in admin blog tags GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedData = blogTagSchema.parse(body);

    // Check if tag with same slug already exists
    const { data: existingTag } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", validatedData.slug)
      .single();

    if (existingTag) {
      return NextResponse.json(
        { error: "A tag with this slug already exists" },
        { status: 409 },
      );
    }

    // Create blog tag
    const tag = await createBlogTag({
      name: validatedData.name,
      slug: validatedData.slug,
    });

    // Refresh cache

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Error in admin blog tags POST:", error);

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
