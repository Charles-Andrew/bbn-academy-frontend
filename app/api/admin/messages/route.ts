import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ContactAttachment, ContactMessage } from "@/types/contact";

interface DatabaseMessage extends ContactMessage {
  contact_attachments?: ContactAttachment[];
}

// GET /api/admin/messages - Fetch all messages with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const purpose = searchParams.get("purpose");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const offset = (page - 1) * limit;

    // Build query using admin client (bypasses RLS)
    let query = supabaseAdmin
      .from("contact_messages")
      .select(
        `
        *,
        contact_attachments (
          id,
          file_name,
          file_path,
          file_size,
          file_type,
          created_at
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (purpose && purpose !== "all") {
      query = query.eq("purpose", purpose);
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`,
      );
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    // Transform data to match ContactMessage type with attachments
    const transformedMessages: ContactMessage[] =
      messages?.map((message: DatabaseMessage) => ({
        id: message.id,
        full_name: message.full_name,
        email: message.email,
        purpose: message.purpose,
        message: message.message,
        status: message.status,
        created_at: message.created_at,
        attachments: message.contact_attachments || [],
      })) || [];

    return NextResponse.json({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/messages - Create a new message (admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { full_name, email, purpose, message, status = "unread" } = body;

    // Validate required fields
    if (!full_name || !email || !purpose || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data: newMessage, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        full_name,
        email,
        purpose,
        message,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Message created successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/messages - Update multiple messages (batch operations)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { messageIds, status } = body;

    if (!messageIds || !Array.isArray(messageIds) || !status) {
      return NextResponse.json(
        { error: "Missing required fields: messageIds array and status" },
        { status: 400 },
      );
    }

    const { data: updatedMessages, error } = await supabaseAdmin
      .from("contact_messages")
      .update({ status })
      .in("id", messageIds)
      .select();

    if (error) {
      console.error("Error updating messages:", error);
      return NextResponse.json(
        { error: "Failed to update messages" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Messages updated successfully",
      data: updatedMessages,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/messages - Delete multiple messages (batch operations)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const messageIds = searchParams.get("ids")?.split(",");

    if (!messageIds || messageIds.length === 0) {
      return NextResponse.json(
        { error: "No message IDs provided" },
        { status: 400 },
      );
    }

    // First, delete all attachments for these messages
    const { error: attachmentsError } = await supabaseAdmin
      .from("contact_attachments")
      .delete()
      .in("message_id", messageIds);

    if (attachmentsError) {
      console.error("Error deleting attachments:", attachmentsError);
    }

    // Then delete the messages
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .delete()
      .in("id", messageIds);

    if (error) {
      console.error("Error deleting messages:", error);
      return NextResponse.json(
        { error: "Failed to delete messages" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Messages deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
