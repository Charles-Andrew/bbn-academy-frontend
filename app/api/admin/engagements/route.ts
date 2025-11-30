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
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    // Apply sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "title",
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
    const formData = await request.formData();

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
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("engagement-media")
            .upload(fileName, fileData, {
              contentType: file.type,
              upsert: true
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

    // Validate engagement data (excluding files for now)
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
      .insert({
        title: validatedData.title,
        slug: validatedData.slug,
        type: validatedData.type,
        description: validatedData.description,
        date: validatedData.date,
        featured: validatedData.featured,
        images: validatedData.images,
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

    return NextResponse.json({ 
      engagement,
      uploadedFiles: uploadedUrls.length 
    }, { status: 201 });
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
