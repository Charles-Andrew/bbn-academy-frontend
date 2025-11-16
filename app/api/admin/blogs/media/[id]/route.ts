import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { blogMediaMetadataSchema } from "@/lib/validations";

// GET - Retrieve media details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: mediaId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: media, error } = await supabase
      .from("blog_media")
      .select("*")
      .eq("id", mediaId)
      .single();

    if (error) {
      console.error("Error fetching media:", error);
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error in GET media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update media metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: mediaId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    // Validate input
    const validationResult = blogMediaMetadataSchema.safeParse({
      id: mediaId,
      ...body,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const updateData = validationResult.data;

    // If setting as featured, unset other featured media for this post
    if (updateData.is_featured) {
      const { data: currentMedia } = await supabase
        .from("blog_media")
        .select("post_id")
        .eq("id", mediaId)
        .single();

      if (currentMedia) {
        await supabase
          .from("blog_media")
          .update({ is_featured: false })
          .eq("post_id", currentMedia.post_id)
          .neq("id", mediaId);
      }
    }

    const { data: media, error } = await supabase
      .from("blog_media")
      .update({
        alt_text: updateData.alt_text,
        caption: updateData.caption,
        is_featured: updateData.is_featured,
        sort_order: updateData.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating media:", error);
      return NextResponse.json(
        { error: "Failed to update media" },
        { status: 500 },
      );
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error in PUT media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Remove media
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: mediaId } = await params;

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== "admin@bbnacademy.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get media details before deletion
    const { data: media, error: fetchError } = await supabase
      .from("blog_media")
      .select("*")
      .eq("id", mediaId)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("blog_media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      console.error("Error deleting media record:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete media" },
        { status: 500 },
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("blog-media")
      .remove([media.file_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Don't fail the request if storage deletion fails, but log it
      console.warn(`File ${media.file_path} was not deleted from storage`);
    }

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
