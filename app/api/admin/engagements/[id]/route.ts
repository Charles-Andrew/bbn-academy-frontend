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
    const body = await request.json();
    const { id } = await params;

    // Validate request body (allow partial updates)
    const validatedData = engagementSchema.partial().parse(body);

    const supabase = await createClient();

    const { data: engagement, error } = await supabase
      .from("engagements")
      .update({
        title: validatedData.title,
        slug: validatedData.slug,
        type: validatedData.type,
        description: validatedData.description,
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

    return NextResponse.json({ engagement });
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

    const { error } = await supabase.from("engagements").delete().eq("id", id);

    if (error) {
      console.error("Error deleting engagement:", error);
      return NextResponse.json(
        { error: "Failed to delete engagement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in engagement DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
