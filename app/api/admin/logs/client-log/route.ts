import { type NextRequest, NextResponse } from "next/server";
import { LogDatabase } from "@/lib/logging";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, details } = body;

    // Validate required fields
    if (!type || !action) {
      return NextResponse.json(
        { error: "Missing required fields: type, action" },
        { status: 400 },
      );
    }

    // Create server-side log entry using LogDatabase directly
    const logDb = new LogDatabase();
    const logId = await logDb.createLog({
      type,
      action,
      details: {
        ...details,
        source: "client_side",
        client_timestamp: details.timestamp,
        user_agent: request.headers.get("user-agent"),
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          request.headers.get("x-client-ip"),
      },
      context: {
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          request.headers.get("x-client-ip") ||
          undefined,
        user_agent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      log_id: logId,
      message: "Client log received successfully",
    });
  } catch (error) {
    console.error("Error processing client log:", error);

    return NextResponse.json(
      { error: "Failed to process client log" },
      { status: 500 },
    );
  }
}
