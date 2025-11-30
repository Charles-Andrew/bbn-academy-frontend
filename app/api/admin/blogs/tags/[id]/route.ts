import { type NextRequest, NextResponse } from "next/server";
import {
  deleteBlogTag,
  getBlogTags,
  updateBlogTag,
} from "@/lib/supabase/blog-server";
import { createClient } from "@/lib/supabase/server";
import { blogTagSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: tagId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    // Get all tags and find the specific one
    const tags = await getBlogTags();
    const tag = tags.find((t) => t.id === tagId);

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Error in admin blog tag GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: tagId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = blogTagSchema.parse(body);

    // Check if tag exists
    const tags = await getBlogTags();
    const existingTag = tags.find((t) => t.id === tagId);

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check if another tag has the same slug
    const tagWithSameSlug = tags.find(
      (t) => t.slug === validatedData.slug && t.id !== tagId,
    );
    if (tagWithSameSlug) {
      return NextResponse.json(
        { error: "A tag with this slug already exists" },
        { status: 409 },
      );
    }

    // Update blog tag
    const tag = await updateBlogTag(tagId, {
      name: validatedData.name,
      slug: validatedData.slug,
    });

    // Refresh cache

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Error in admin blog tag PUT:", error);

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: tagId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 },
      );
    }

    // Delete blog tag
    await deleteBlogTag(tagId);

    // Refresh cache

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin blog tag DELETE:", error);

    if (
      error instanceof Error &&
      error.message.includes("Cannot delete tag that is being used")
    ) {
      return NextResponse.json(
        { error: "Cannot delete tag that is being used by blog posts" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
