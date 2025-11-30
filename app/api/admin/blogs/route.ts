import { type NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import {
  calculateReadingTime,
  createBlogPost,
  generateUniqueSlug,
  getBlogPosts,
} from "@/lib/supabase/blog-server";
import { createClient } from "@/lib/supabase/server";
import {
  blogFiltersSchema,
  blogPostSchema,
  paginationSchema,
} from "@/lib/validations";

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

    // Parse and validate query parameters
    const paginationData = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });

    const filtersData = blogFiltersSchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "all",
      author: searchParams.get("author") || undefined,
      tags: searchParams.get("tags")
        ? searchParams.get("tags")?.split(",")
        : undefined,
      featured: searchParams.get("featured")
        ? searchParams.get("featured") === "true"
        : undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const result = await getBlogPosts(paginationData, filtersData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in admin blogs GET:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.message },
        { status: 400 },
      );
    }

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

    const contentType = request.headers.get("content-type");
    let validatedData: z.infer<typeof blogPostSchema>;
    interface UploadedFile {
      name: string;
      path: string;
      public_url: string;
      size: number;
      type: string;
    }
    const uploadedFiles: UploadedFile[] = [];
    let featuredMediaUrl: string | null = null;
    let featuredMediaType: "image" | "video" | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Handle form data with files
      const formData = await request.formData();

      // Extract post data from form fields
      const rawAuthorId = formData.get("authorId") as string;
      const rawReadingTime = formData.get("readingTime") as string;

      const readingTime =
        rawReadingTime &&
        !Number.isNaN(parseInt(rawReadingTime, 10)) &&
        parseInt(rawReadingTime, 10) > 0
          ? parseInt(rawReadingTime, 10)
          : 1;

      // Handle featured media upload first
      const featuredMediaFile = formData.get("featuredMedia") as File;
      console.log("Featured media file from FormData:", featuredMediaFile);
      console.log("Featured media file size:", featuredMediaFile?.size);
      console.log("Featured media file name:", featuredMediaFile?.name);

      if (featuredMediaFile && featuredMediaFile.size > 0) {
        // Validate file size based on type
        const isVideo = featuredMediaFile.type.startsWith("video/");
        const isImage = featuredMediaFile.type.startsWith("image/");

        if (isVideo && featuredMediaFile.size > 25 * 1024 * 1024) {
          return NextResponse.json(
            {
              error: "Video file too large",
              details: `Video file size ${(featuredMediaFile.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of 25MB`,
            },
            { status: 400 },
          );
        }

        if (isImage && featuredMediaFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            {
              error: "Image file too large",
              details: `Image file size ${(featuredMediaFile.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of 10MB`,
            },
            { status: 400 },
          );
        }
        const fileExt = featuredMediaFile.name.split(".").pop();
        const fileName = `featured-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const storageBucket = "blog-media"; // Use dedicated blog-media bucket for both images and videos
        const filePath = `blog-media/${fileName}`;

        console.log("Uploading featured media to:", filePath);
        console.log("File type:", featuredMediaFile.type);
        console.log("File extension:", fileExt);
        console.log("Storage bucket:", storageBucket);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(filePath, featuredMediaFile, {
            cacheControl: "3600",
            upsert: false,
          });

        console.log("Upload result:", { uploadData, uploadError });

        if (uploadError) {
          console.error("Featured media upload error:", uploadError);
        } else {
          console.log("Featured media uploaded successfully:", filePath);
          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

          featuredMediaUrl = publicUrl;
          featuredMediaType = featuredMediaFile.type.startsWith("image/")
            ? "image"
            : "video";
        }
      } else {
        console.log("No featured media file found or file size is 0");
      }

      const postData: z.infer<typeof blogPostSchema> & { authorId?: string } = {
        title: formData.get("title") as string,
        slug: formData.get("slug") as string,
        excerpt: formData.get("excerpt") as string,
        content: formData.get("content") as string,
        featured: formData.get("featured") === "true",
        isPublished: formData.get("isPublished") === "true",
        publishedAt: formData.get("publishedAt") as string,
        readingTime,
        tags: formData.get("tags")
          ? JSON.parse(formData.get("tags") as string)
          : [],
      };

      // Only include authorId if it's not empty (it's optional but not nullable in schema)
      if (rawAuthorId && rawAuthorId.trim() !== "") {
        postData.authorId = rawAuthorId;
      }

      // Validate post data
      validatedData = blogPostSchema.parse(postData);

      // Handle additional file uploads
      const files = formData.getAll("files") as File[];
      if (files.length > 0) {
        for (const file of files) {
          if (file.size > 0) {
            // Upload file to Supabase Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `blog-media/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("blog-media")
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (uploadError) {
              console.error("File upload error:", uploadError);
              continue;
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage.from("blog-media").getPublicUrl(filePath);

            // Store file metadata in database (we'll associate with post after creation)
            uploadedFiles.push({
              name: file.name,
              path: filePath,
              public_url: publicUrl,
              size: file.size,
              type: file.type,
            });
          }
        }
      }
    } else {
      // Handle JSON data (no files)
      const body = await request.json();
      validatedData = blogPostSchema.parse(body);
    }

    // Generate unique slug if not provided or ensure uniqueness if provided
    let slug = validatedData.slug;
    if (!slug || slug.trim() === "") {
      // Generate slug from title
      slug = await generateUniqueSlug(validatedData.title);
    } else {
      // User provided a slug - ensure it's properly formatted and unique
      // Clean up the slug first
      slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Ensure uniqueness by adding numbers if needed
      slug = await generateUniqueSlug(slug);
    }

    // Calculate reading time if not provided
    const readingTime =
      validatedData.readingTime ||
      (await calculateReadingTime(validatedData.content));

    // Set author to current admin user if not provided
    const authorId = validatedData.authorId || user.id;

    // Prepare post data
    const postData = {
      title: validatedData.title,
      slug,
      excerpt: validatedData.excerpt,
      content: validatedData.content,
      featured: validatedData.featured || false,
      featured_media_url: featuredMediaUrl || null,
      featured_media_type: featuredMediaType as "image" | "video" | null,
      author_id: authorId,
      published_at:
        validatedData.isPublished && validatedData.publishedAt
          ? new Date(validatedData.publishedAt).toISOString()
          : validatedData.isPublished
            ? new Date().toISOString()
            : null,
      is_published: validatedData.isPublished,
      reading_time: readingTime,
    };

    // Process tags
    const tagIds: string[] = [];
    if (validatedData.tags && validatedData.tags.length > 0) {
      // For now, we'll handle tag names and create/get them as needed
      // In a more complete implementation, you might want to separate tag creation from post creation
      for (const tagName of validatedData.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        // Try to find existing tag
        const { data: existingTag } = await supabase
          .from("blog_tags")
          .select("id")
          .eq("slug", tagSlug)
          .single();

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          // Create new tag
          const { data: newTag } = await supabase
            .from("blog_tags")
            .insert({
              name: tagName,
              slug: tagSlug,
            })
            .select("id")
            .single();

          if (newTag) {
            tagIds.push(newTag.id);
          }
        }
      }
    }

    // Create blog post
    const post = await createBlogPost(postData, tagIds);

    // Associate uploaded files with the post
    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        await supabase.from("blog_media").insert({
          post_id: post.id,
          file_name: file.name,
          file_path: file.path,
          file_url: file.public_url,
          file_size: file.size,
          file_type: file.type,
          alt_text: "", // No alt text required as per user request
          caption: "", // No caption required as per user request
          is_featured: false, // Can be updated later if needed
          sort_order: 0,
        });
      }
    }

    return NextResponse.json({ post, uploadedFiles }, { status: 201 });
  } catch (error) {
    console.error("Error in admin blogs POST:", error);

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
