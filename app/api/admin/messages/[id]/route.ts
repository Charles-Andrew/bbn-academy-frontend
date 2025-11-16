import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/types/contact";

interface Params {
  params: Promise<{ id: string }>;
}

interface MessageUpdateData {
  status?: string;
  full_name?: string;
  email?: string;
  purpose?: string;
  message?: string;
}

// GET /api/admin/messages/[id] - Get a specific message with attachments
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: message, error } = await supabase
      .from("contact_messages")
      .select(`
        *,
        contact_attachments (
          id,
          file_name,
          file_path,
          file_size,
          file_type,
          created_at
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching message:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch message" },
        { status: 500 },
      );
    }

    // Transform data to match ContactMessage type
    const transformedMessage: ContactMessage = {
      id: message.id,
      full_name: message.full_name,
      email: message.email,
      purpose: message.purpose,
      message: message.message,
      status: message.status,
      created_at: message.created_at,
      attachments: message.contact_attachments || [],
    };

    return NextResponse.json({
      message: transformedMessage,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/messages/[id] - Update a specific message
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { status, full_name, email, purpose, message } = body;

    // Build update object with only provided fields
    const updateData: MessageUpdateData = {};
    if (status !== undefined) updateData.status = status;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (message !== undefined) updateData.message = message;

    const { data: updatedMessage, error } = await supabase
      .from("contact_messages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating message:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/messages/[id] - Delete a specific message and its attachments
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // First, get the message to check if it exists and get its attachments
    const { error: fetchError } = await supabase
      .from("contact_messages")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 },
        );
      }
      console.error("Error fetching message:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch message" },
        { status: 500 },
      );
    }

    // Get all attachments for this message to delete files from storage
    const { data: attachments, error: attachmentError } = await supabase
      .from("contact_attachments")
      .select("file_path")
      .eq("message_id", id);

    if (!attachmentError && attachments) {
      // Delete files from Supabase Storage
      for (const attachment of attachments) {
        try {
          await supabase.storage
            .from("contact-attachments")
            .remove([attachment.file_path]);
        } catch (storageError) {
          console.error(
            `Failed to delete file ${attachment.file_path}:`,
            storageError,
          );
          // Continue even if file deletion fails
        }
      }
    }

    // Delete attachments from database
    const { error: attachmentsError } = await supabase
      .from("contact_attachments")
      .delete()
      .eq("message_id", id);

    if (attachmentsError) {
      console.error("Error deleting attachments:", attachmentsError);
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting message:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
