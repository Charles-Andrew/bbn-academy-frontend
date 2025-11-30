import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";

export async function GET(request: NextRequest) {
  try {
    const stats = await logger.getStats();

    await logger.logSuccess(
      "log_stats_accessed",
      { stats_generated: true, user_type: "admin" },
      { id: "admin_user", email: "admin@bbn-academy.com" }, // Admin user from admin dashboard
      request,
    );

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching log stats:", error);

    await logger.logError(
      "log_stats_fetch_failed",
      error instanceof Error ? error : "Unknown error",
      { request_url: request.url, user_type: "admin" },
      { id: "admin_user", email: "admin@bbn-academy.com" },
      request,
    );

    return NextResponse.json(
      { error: "Failed to fetch log statistics" },
      { status: 500 },
    );
  }
}
