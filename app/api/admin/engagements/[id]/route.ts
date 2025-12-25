import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { engagementSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: engagement, error } = await supabase
      .from("engagements")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching engagement:", error);
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ engagement });
  } catch (error) {
    console.error("Error in engagement GET:", error);
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
    const formData = await request.formData();
    const { id } = await params;

    // Parse form data
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const featured = formData.get("featured") === "true";
    const imagesJson = formData.get("images") as string;

    // Parse existing images
    let existingImages: string[] = [];
    if (imagesJson) {
      try {
        existingImages = JSON.parse(imagesJson);
      } catch (e) {
        console.error("Error parsing images JSON:", e);
      }
    }

    // Handle file uploads
    const uploadedUrls: string[] = [];
    const files = formData.getAll("files") as File[];

    const supabase = await createClient();

    for (const file of files) {
      if (file && file.size > 0) {
        try {
          const fileData = Buffer.from(await file.arrayBuffer());
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

          const { error: uploadError } = await supabase.storage
            .from("engagement-media")
            .upload(fileName, fileData, {
              contentType: file.type,
              upsert: true,
            });

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("engagement-media")
            .getPublicUrl(fileName);

          uploadedUrls.push(publicUrlData.publicUrl);
        } catch (error) {
          console.error("Error processing file:", error);
        }
      }
    }

    // Combine existing and new images
    const allImages = [...existingImages, ...uploadedUrls];

    // Validate engagement data
    const engagementData = {
      title,
      slug: slug || null,
      type,
      description,
      date: date && date.trim() !== "" ? date : null,
      featured,
      images: allImages,
    };

    const validatedData = engagementSchema.parse(engagementData);

    const { data: engagement, error } = await supabase
      .from("engagements")
      .update({
        title: validatedData.title,
        slug: validatedData.slug,
        type: validatedData.type,
        description: validatedData.description,
        date: validatedData.date,
        featured: validatedData.featured,
        images: validatedData.images,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating engagement:", error);
      return NextResponse.json(
        { error: "Failed to update engagement", details: error.message },
        { status: 500 },
      );
    }

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      engagement,
      uploadedFiles: uploadedUrls.length,
    });
  } catch (error) {
    console.error("Error in engagement PUT:", error);

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
    const { id } = await params;

    // First, get the engagement to retrieve associated media files
    const { data: engagement, error: fetchError } = await supabase
      .from("engagements")
      .select("images")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching engagement for deletion:", fetchError);
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 },
      );
    }

    // Delete associated media files from storage
    if (engagement.images && engagement.images.length > 0) {
      const filePaths = engagement.images
        .filter((url: string) => url.includes("engagement-images/"))
        .map((url: string) => {
          // Extract file path from URL
          const urlParts = url.split("/engagement-images/");
          return urlParts.length > 1
            ? `engagement-images/${urlParts[1]}`
            : null;
        })
        .filter((path: string | null) => path !== null);

      if (filePaths.length > 0) {
        const { error: deleteStorageError } = await supabase.storage
          .from("engagement-media")
          .remove(filePaths);

        if (deleteStorageError) {
          console.error("Error deleting media files:", deleteStorageError);
          // Continue with engagement deletion even if media deletion fails
          // Log the error but don't fail the entire operation
        }
      }
    }

    // Now delete the engagement record
    const { error } = await supabase.from("engagements").delete().eq("id", id);

    if (error) {
      console.error("Error deleting engagement:", error);
      return NextResponse.json(
        { error: "Failed to delete engagement" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Engagement and associated media files deleted successfully",
    });
  } catch (error) {
    console.error("Error in engagement DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
