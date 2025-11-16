import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { blogMediaReorderSchema } from "@/lib/validations";

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

    // Validate input
    const validationResult = blogMediaReorderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const { postId, mediaIds } = validationResult.data;

    // Update sort orders in a transaction
    const updates = mediaIds.map((mediaId, index) =>
      supabase
        .from("blog_media")
        .update({ sort_order: index })
        .eq("id", mediaId)
        .eq("post_id", postId),
    );

    // Execute all updates
    const results = await Promise.all(updates);

    // Check for any errors
    const hasErrors = results.some((result) => result.error);
    if (hasErrors) {
      console.error("Error updating media order:");
      return NextResponse.json(
        { error: "Failed to update media order" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Media order updated successfully",
    });
  } catch (error) {
    console.error("Error in media reordering:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
