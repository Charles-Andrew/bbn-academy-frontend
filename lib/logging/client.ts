// Client-side logging for use in client components
// This version doesn't use server-side Supabase client

import type { LogDetails } from "./types";

export class ClientLogger {
  private logs: Array<{
    type: string;
    action: string;
    details: LogDetails;
    timestamp: string;
  }> = [];

  private async sendToServer(logData: {
    type: string;
    action: string;
    details: LogDetails;
  }) {
    try {
      await fetch("/api/admin/logs/client-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      // Silently fail if we can't send logs to server
      console.error("Failed to send log to server:", error);
    }
  }

  async logError(
    action: string,
    error: Error | string,
    details: LogDetails = {},
  ): Promise<void> {
    const logData = {
      type: "error",
      action,
      details: {
        error_message: typeof error === "string" ? error : error.message,
        error_stack: typeof error === "object" ? error.stack : undefined,
        ...details,
      },
    };

    // Store locally for immediate feedback
    this.logs.push({
      ...logData,
      timestamp: new Date().toISOString(),
    });

    // Try to send to server
    await this.sendToServer(logData);

    // Also log to console
    console.error(`[${logData.type.toUpperCase()}] ${action}:`, error, details);
  }

  async logUserAction(
    action: string,
    details: LogDetails,
  ): Promise<void> {
    const logData = {
      type: "user_action",
      action,
      details,
    };

    // Store locally
    this.logs.push({
      ...logData,
      timestamp: new Date().toISOString(),
    });

    // Send to server
    await this.sendToServer(logData);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[${logData.type.toUpperCase()}] ${action}:`, details);
    }
  }

  async logSuccess(
    action: string,
    details: LogDetails,
  ): Promise<void> {
    const logData = {
      type: "success",
      action,
      details,
    };

    // Store locally
    this.logs.push({
      ...logData,
      timestamp: new Date().toISOString(),
    });

    // Send to server
    await this.sendToServer(logData);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[${logData.type.toUpperCase()}] ${action}:`, details);
    }
  }

  getLocalLogs(): Array<{
    type: string;
    action: string;
    details: LogDetails;
    timestamp: string;
  }> {
    return [...this.logs];
  }

  clearLocalLogs(): void {
    this.logs = [];
  }
}

// Singleton instance
export const clientLogger = new ClientLogger();
