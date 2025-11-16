import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { engagementImageUploadSchema } from "@/lib/validations";

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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const alt = (formData.get("alt") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validationResult = engagementImageUploadSchema.safeParse({
      file,
      alt,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid file", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `engagement-images/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("engagement-images")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600", // Cache for 1 hour
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("engagement-images").getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      fileName,
      size: file.size,
      type: file.type,
      alt: alt,
    });
  } catch (error) {
    console.error("Error in engagement image upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE endpoint for removing uploaded images
export async function DELETE(request: NextRequest) {
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
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 },
      );
    }

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from("engagement-images")
      .remove([path]);

    if (error) {
      console.error("Error deleting file:", error);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in engagement image delete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
