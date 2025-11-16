import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") as string | undefined;
    const action = searchParams.get("action");
    const userEmail = searchParams.get("user_email");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const filters = {
      type,
      action,
      user_email: userEmail,
      date_from: dateFrom,
      date_to: dateTo,
      limit,
      offset,
    };

    const result = await logger.getLogs(filters);

    await logger.logSuccess(
      "logs_accessed",
      {
        filters_applied: Object.keys(filters).filter(
          (key) => filters[key as keyof typeof filters],
        ),
        results_returned: result.logs.length,
        total_results: result.total,
      },
      { id: "admin_user", email: "admin@example.com" }, // Update with actual user extraction
      request,
    );

    return NextResponse.json({
      logs: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);

    await logger.logError(
      "logs_fetch_failed",
      error instanceof Error ? error : "Unknown error",
      { request_url: request.url },
      { id: "admin_user", email: "admin@example.com" },
      request,
    );

    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(
      searchParams.get("older_than_days") || "30",
      10,
    );

    if (olderThanDays < 7) {
      return NextResponse.json(
        { error: "Cannot delete logs newer than 7 days" },
        { status: 400 },
      );
    }

    const deletedCount = await logger.deleteLogs(olderThanDays);

    await logger.logSuccess(
      "logs_deleted",
      {
        older_than_days: olderThanDays,
        deleted_count: deletedCount,
      },
      { id: "admin_user", email: "admin@example.com" },
      request,
    );

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      message: `Successfully deleted ${deletedCount} log entries older than ${olderThanDays} days`,
    });
  } catch (error) {
    console.error("Error deleting logs:", error);

    await logger.logError(
      "logs_deletion_failed",
      error instanceof Error ? error : "Unknown error",
      { request_url: request.url },
      { id: "admin_user", email: "admin@example.com" },
      request,
    );

    return NextResponse.json(
      { error: "Failed to delete logs" },
      { status: 500 },
    );
  }
}
