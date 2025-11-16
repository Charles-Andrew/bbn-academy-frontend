import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContactAttachment, ContactMessage } from "@/types/contact";

interface DatabaseMessage extends ContactMessage {
  contact_attachments?: ContactAttachment[];
}

// POST /api/admin/messages/search - Advanced search functionality
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      query,
      filters = {},
      pagination = {},
      sort = { field: "created_at", order: "desc" },
    } = body;

    const { page = 1, limit = 50 } = pagination;
    const { status, purpose, dateFrom, dateTo, hasAttachments } = filters;
    const offset = (page - 1) * limit;

    // Build base query
    let dbQuery = supabase.from("contact_messages").select(
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
    );

    // Apply text search if provided
    if (query?.trim()) {
      // Full-text search across multiple fields
      const searchTerm = query.trim();
      dbQuery = dbQuery.or(`
        full_name.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        message.ilike.%${searchTerm}%,
        purpose.ilike.%${searchTerm}%
      `);
    }

    // Apply filters
    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    if (purpose && purpose !== "all") {
      dbQuery = dbQuery.eq("purpose", purpose);
    }

    if (dateFrom) {
      dbQuery = dbQuery.gte("created_at", dateFrom);
    }

    if (dateTo) {
      dbQuery = dbQuery.lte("created_at", dateTo);
    }

    // Apply attachment filter
    if (hasAttachments === true) {
      dbQuery = dbQuery.not("contact_attachments", "is", null);
    } else if (hasAttachments === false) {
      dbQuery = dbQuery.is("contact_attachments", null);
    }

    // Apply sorting
    const sortField = sort.field || "created_at";
    const sortOrder = sort.order || "desc";
    dbQuery = dbQuery.order(sortField, { ascending: sortOrder === "asc" });

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: messages, error, count } = await dbQuery;

    if (error) {
      console.error("Error searching messages:", error);
      return NextResponse.json(
        { error: "Failed to search messages" },
        { status: 500 },
      );
    }

    // Transform data to include attachment count and highlight matches
    const transformedMessages =
      messages?.map((message: DatabaseMessage) => {
        const attachments = message.contact_attachments || [];

        // Highlight search term matches for UI display
        const highlightMatches = (text: string) => {
          if (!query || !query.trim()) return text;

          const regex = new RegExp(`(${query.trim()})`, "gi");
          return text.replace(regex, "<mark>$1</mark>");
        };

        return {
          id: message.id,
          full_name: message.full_name,
          email: message.email,
          purpose: message.purpose,
          message: message.message,
          status: message.status,
          created_at: message.created_at,
          attachments: attachments,
          attachment_count: attachments.length,
          // Add highlighted versions for UI display
          highlighted: {
            full_name: highlightMatches(message.full_name),
            email: highlightMatches(message.email),
            message: highlightMatches(message.message),
            purpose: highlightMatches(message.purpose),
          },
        };
      }) || [];

    // Generate search suggestions based on common terms
    const suggestions = await generateSearchSuggestions(supabase, query);

    return NextResponse.json({
      messages: transformedMessages,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      query: {
        text: query,
        filters,
        sort,
      },
      suggestions,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/admin/messages/search/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await generateSearchSuggestions(supabase, query.trim());

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 },
    );
  }
}

// Helper function to generate search suggestions
async function generateSearchSuggestions(
  supabase: SupabaseClient,
  query: string,
) {
  if (!query || query.trim().length < 2) return [];

  const searchTerm = query.trim();

  try {
    // Get name suggestions
    const { data: nameSuggestions } = await supabase
      .from("contact_messages")
      .select("full_name")
      .ilike("full_name", `%${searchTerm}%`)
      .limit(5);

    // Get email suggestions
    const { data: emailSuggestions } = await supabase
      .from("contact_messages")
      .select("email")
      .ilike("email", `%${searchTerm}%`)
      .limit(5);

    // Get purpose suggestions
    const { data: purposeSuggestions } = await supabase
      .from("contact_messages")
      .select("purpose")
      .ilike("purpose", `%${searchTerm}%`)
      .limit(5);

    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...(nameSuggestions?.map(
        (item: { full_name: string }) => item.full_name,
      ) || []),
      ...(emailSuggestions?.map((item: { email: string }) => item.email) || []),
      ...(purposeSuggestions?.map(
        (item: { purpose: string }) => item.purpose,
      ) || []),
    ];

    // Remove duplicates and limit to 10 suggestions
    const uniqueSuggestions = [...new Set(allSuggestions)]
      .filter(
        (suggestion, index, self) =>
          self.indexOf(suggestion) === index &&
          suggestion.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice(0, 10);

    return uniqueSuggestions;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}
