import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/messages-test - Simple test endpoint to check database access
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log("🔍 Testing database access...");

    // Test basic connection
    const {
      data: messages,
      error,
      count,
    } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5);

    console.log("Database query result:", {
      messageCount: messages?.length || 0,
      totalCount: count,
      error: error?.message,
      sampleData: messages?.[0],
    });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database access successful",
      data: {
        messageCount: messages?.length || 0,
        totalCount: count,
        messages: messages || [],
      },
      debug: {
        timestamp: new Date().toISOString(),
        serverTime: new Date().toLocaleString(),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
