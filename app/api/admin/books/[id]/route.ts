import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: book, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }
      
      console.error("Error fetching book:", error);
      return NextResponse.json(
        { error: "Failed to fetch book" },
        { status: 500 }
      );
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error in book GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = bookSchema.parse(body);
    
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: book, error } = await supabase
      .from("books")
      .update({
        title: validatedData.title,
        description: validatedData.description,
        cover_image: validatedData.coverImage,
        author: validatedData.author,
        genre: validatedData.genre,
        published_at: validatedData.publishedAt,
        isbn: validatedData.isbn,
        price: validatedData.price,
        purchase_url: validatedData.purchaseUrl,
        tags: validatedData.tags,
        featured: validatedData.featured,
        content: validatedData.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }
      
      console.error("Error updating book:", error);
      return NextResponse.json(
        { error: "Failed to update book" },
        { status: 500 }
      );
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error in book PUT:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }
      
      console.error("Error deleting book:", error);
      return NextResponse.json(
        { error: "Failed to delete book" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in book DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}