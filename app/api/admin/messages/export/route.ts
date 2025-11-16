import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContactAttachment, ContactMessage } from "@/types/contact";

interface DatabaseMessage extends ContactMessage {
  contact_attachments?: ContactAttachment[];
  attachment_count?: number;
}

interface ExportAttachment {
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  download_url: string;
}

interface ExportMessage {
  id: string;
  full_name: string;
  email: string;
  purpose: string;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
  attachment_count?: number;
  attachments?: ExportAttachment[];
}

// POST /api/admin/messages/export - Export messages to CSV or JSON
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      format = "csv", // csv or json
      filters = {},
      includeAttachments = false,
      messageIds, // Optional: specific message IDs to export
    } = body;

    const { status, purpose, dateFrom, dateTo, search } = filters;

    // Build query
    let query = supabase
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
      .order("created_at", { ascending: false });

    // If specific message IDs provided, export only those
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query = query.in("id", messageIds);
    } else {
      // Apply filters
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (purpose && purpose !== "all") {
        query = query.eq("purpose", purpose);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }

      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`,
        );
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages for export" },
        { status: 500 },
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages found to export" },
        { status: 404 },
      );
    }

    // Transform data for export
    const exportData: ExportMessage[] = messages.map(
      (message: DatabaseMessage) => {
        const attachments = message.contact_attachments || [];

        const baseData = {
          id: message.id,
          full_name: message.full_name,
          email: message.email,
          purpose: message.purpose,
          message: message.message,
          status: message.status,
          created_at: message.created_at,
          attachment_count: attachments.length,
        };

        if (includeAttachments) {
          return {
            ...baseData,
            attachments: attachments.map((att: ContactAttachment) => ({
              file_name: att.file_name,
              file_size: att.file_size,
              file_type: att.file_type,
              created_at: att.created_at,
              download_url: att.file_path, // Note: In production, you'd generate signed URLs
            })),
          };
        }

        return baseData;
      },
    );

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `messages-export-${timestamp}`;

    let content: string;
    let contentType: string;
    let fileExtension: string;

    if (format === "json") {
      content = JSON.stringify(
        {
          export_info: {
            timestamp: new Date().toISOString(),
            total_messages: exportData.length,
            filters: filters,
            include_attachments: includeAttachments,
          },
          messages: exportData,
        },
        null,
        2,
      );
      contentType = "application/json";
      fileExtension = "json";
    } else {
      // CSV format
      content = convertToCSV(exportData, includeAttachments);
      contentType = "text/csv";
      fileExtension = "csv";
    }

    // Create response with file download
    const fullFilename = `${filename}.${fileExtension}`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fullFilename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Unexpected error during export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to convert data to CSV
function convertToCSV(
  data: ExportMessage[],
  includeAttachments: boolean,
): string {
  if (data.length === 0) return "No data to export";

  // Define CSV headers
  const headers = [
    "ID",
    "Full Name",
    "Email",
    "Purpose",
    "Status",
    "Message",
    "Created At",
    "Attachment Count",
  ];

  if (includeAttachments) {
    headers.push("Attachments");
  }

  // Convert each message to CSV row
  const csvRows = data.map((message) => {
    const row = [
      message.id,
      escapeCsvField(message.full_name),
      escapeCsvField(message.email),
      escapeCsvField(message.purpose),
      message.status,
      escapeCsvField(message.message),
      new Date(message.created_at).toISOString(),
      message.attachment_count || 0,
    ];

    if (includeAttachments && message.attachments) {
      const attachmentInfo = message.attachments
        .map(
          (att: ExportAttachment) =>
            `${att.file_name} (${formatFileSize(att.file_size)})`,
        )
        .join("; ");
      row.push(escapeCsvField(attachmentInfo));
    } else if (includeAttachments) {
      row.push("");
    }

    return row.join(",");
  });

  // Combine headers and rows
  return [headers.join(","), ...csvRows].join("\n");
}

// Helper function to escape CSV fields
function escapeCsvField(field: string): string {
  if (field == null) return "";

  // Convert to string if not already
  const stringField = String(field);

  // If field contains comma, newline, or quote, wrap in quotes and escape quotes
  if (
    stringField.includes(",") ||
    stringField.includes("\n") ||
    stringField.includes('"')
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// GET /api/admin/messages/export/templates - Get export templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "filters") {
      // Return common filter presets for export
      const filterTemplates = [
        {
          name: "All Messages",
          description: "Export all messages regardless of status",
          filters: {},
        },
        {
          name: "Unread Messages Only",
          description: "Export only unread messages",
          filters: { status: "unread" },
        },
        {
          name: "Last 30 Days",
          description: "Export messages from the last 30 days",
          filters: {
            dateFrom: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
        {
          name: "This Month",
          description: "Export messages from the current month",
          filters: {
            dateFrom: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1,
            ).toISOString(),
          },
        },
        {
          name: "Book Inquiries Only",
          description: "Export only book-related inquiries",
          filters: { purpose: "Book Inquiry" },
        },
        {
          name: "With Attachments",
          description: "Export only messages that have attachments",
          filters: { hasAttachments: true },
        },
      ];

      return NextResponse.json({ templates: filterTemplates });
    }

    return NextResponse.json(
      { error: "Invalid template type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error fetching export templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch export templates" },
      { status: 500 },
    );
  }
}
