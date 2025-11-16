import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { blogMediaUploadSchema } from "@/lib/validations";
import type { BlogMedia } from "@/types/blog";

// Helper function to get media dimensions for images and videos
async function getMediaDimensions(
  file: File,
): Promise<{ width?: number; height?: number; duration?: number }> {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration),
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve({});
      video.src = URL.createObjectURL(file);
    } else {
      resolve({});
    }
  });
}

// Helper function to determine file type
function getFileType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("image/") ? "image" : "video";
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

    const formData = await request.formData();

    // Extract files from formData
    const _files: File[] = [];
    const fileEntries = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("file-"))
      .map(([, file]) => file as File);

    if (fileEntries.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const postId = formData.get("postId") as string;
    const altTexts = JSON.parse((formData.get("altTexts") as string) || "[]");
    const captions = JSON.parse((formData.get("captions") as string) || "[]");

    // Validate input
    const validationResult = blogMediaUploadSchema.safeParse({
      files: fileEntries,
      postId,
      altTexts,
      captions,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid files", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const uploadedMedia: BlogMedia[] = [];
    const errors: string[] = [];

    // Process each file
    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i];
      const altText = altTexts[i] || "";
      const caption = captions[i] || "";

      try {
        // Get media dimensions
        const dimensions = await getMediaDimensions(file);

        // Determine file type and storage path
        const fileType = getFileType(file.type);
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2);
        const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;

        // Organize files in storage by type and post
        const filePath = `blog-media/${fileType}s/${postId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("blog-media")
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: "31536000", // Cache for 1 year
            upsert: false,
          });

        if (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          errors.push(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        supabase.storage.from("blog-media").getPublicUrl(filePath);

        // Get the highest sort order for this post
        const { data: maxSortData } = await supabase
          .from("blog_media")
          .select("sort_order")
          .eq("post_id", postId)
          .order("sort_order", { ascending: false })
          .limit(1);

        const sortOrder = (maxSortData?.[0]?.sort_order || 0) + 1;

        // Insert media record into database
        const { data: mediaData, error: dbError } = await supabase
          .from("blog_media")
          .insert({
            post_id: postId,
            file_name: file.name,
            file_path: filePath,
            file_type: fileType,
            mime_type: file.type,
            file_size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            duration: dimensions.duration,
            alt_text: altText || null,
            caption: caption || null,
            is_featured: false,
            sort_order: sortOrder,
          })
          .select()
          .single();

        if (dbError) {
          console.error(
            `Error creating media record for ${file.name}:`,
            dbError,
          );
          // Clean up uploaded file
          await supabase.storage.from("blog-media").remove([filePath]);
          errors.push(`Failed to save metadata for ${file.name}`);
          continue;
        }

        uploadedMedia.push(mediaData);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push(`Failed to process ${file.name}`);
      }
    }

    if (uploadedMedia.length === 0) {
      return NextResponse.json(
        { error: "No files were successfully uploaded", details: errors },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedMedia.length} file(s)${
        errors.length > 0 ? ` with ${errors.length} error(s)` : ""
      }`,
    });
  } catch (error) {
    console.error("Error in blog media upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
