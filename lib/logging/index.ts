import { LogDatabase } from "./database";
import type { LogContext, LogDetails, LogFilters, LogOptions } from "./types";

export class Logger {
  private db: LogDatabase;

  constructor() {
    this.db = new LogDatabase();
  }

  private extractContext(request?: Request): LogContext {
    const context: LogContext = {};

    if (request) {
      context.ip_address = this.getClientIP(request);
      context.user_agent = request.headers.get("user-agent") || undefined;
    }

    return context;
  }

  private getClientIP(request: Request): string | undefined {
    // Try to get IP from various headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = request.headers.get("x-client-ip");

    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (clientIP) {
      return clientIP;
    }

    return undefined;
  }

  async logUserAction(
    action: string,
    details: LogDetails,
    user?: { id: string; email: string },
    request?: Request,
    options: LogOptions = {},
  ): Promise<string | null> {
    const context = this.extractContext(request);

    if (user) {
      context.user_id = user.id;
      context.user_email = user.email;
    }

    return this.db.createLog({
      type: "user_action",
      action,
      details,
      context:
        options.includeIpAddress === false
          ? { ...context, ip_address: undefined }
          : context,
    });
  }

  async logError(
    action: string,
    error: Error | string,
    details: LogDetails = {},
    user?: { id: string; email: string },
    request?: Request,
    options: LogOptions = {},
  ): Promise<string | null> {
    const context = this.extractContext(request);

    if (user) {
      context.user_id = user.id;
      context.user_email = user.email;
    }

    const errorMessage = typeof error === "string" ? error : error.message;
    const userFriendlyMessages: Record<string, string> = {
      book_creation_failed:
        "Failed to create book - please check your input and try again",
      contact_form_failed:
        "Failed to submit contact form - please try again later",
      file_upload_failed:
        "Failed to upload file - please check file size and format",
      auth_failed: "Authentication failed - please check your credentials",
      permission_denied:
        "Permission denied - you don't have access to this resource",
    };

    const errorDetails = {
      error_message: errorMessage,
      error_stack: typeof error === "object" ? error.stack : undefined,
      info: userFriendlyMessages[action] || `Error occurred: ${errorMessage}`,
      ...details,
    };

    return this.db.createLog({
      type: "error",
      action,
      details: errorDetails,
      context:
        options.includeIpAddress === false
          ? { ...context, ip_address: undefined }
          : context,
    });
  }

  async logSuccess(
    action: string,
    details: LogDetails,
    user?: { id: string; email: string },
    request?: Request,
    options: LogOptions = {},
  ): Promise<string | null> {
    const context = this.extractContext(request);

    if (user) {
      context.user_id = user.id;
      context.user_email = user.email;
    }

    return this.db.createLog({
      type: "success",
      action,
      details,
      context:
        options.includeIpAddress === false
          ? { ...context, ip_address: undefined }
          : context,
    });
  }

  async logSystem(
    action: string,
    details: LogDetails,
    request?: Request,
    options: LogOptions = {},
  ): Promise<string | null> {
    const context = this.extractContext(request);

    return this.db.createLog({
      type: "system",
      action,
      details,
      context:
        options.includeIpAddress === false
          ? { ...context, ip_address: undefined }
          : context,
    });
  }

  // Convenience methods for common actions
  async logContactFormSubmission(
    formData: {
      fullName: string;
      email: string;
      purpose: string;
      message: string;
    },
    request?: Request,
  ): Promise<string | null> {
    return this.logUserAction(
      "contact_form_submit",
      {
        full_name: formData.fullName,
        email: formData.email,
        purpose: formData.purpose,
        message_length: formData.message.length,
        has_files: false, // Will be updated if files are attached
        info: `${formData.fullName} (${formData.email}) submitted contact form for: ${formData.purpose}`,
      },
      { id: "anonymous", email: formData.email },
      request,
    );
  }

  async logBookOperation(
    operation: "created" | "updated" | "deleted",
    bookData: { id?: string; title: string; author?: string },
    user: { id: string; email: string },
    infoMessage?: string[],
  ): Promise<string | null> {
    const actionMessages = {
      created: `Created new book: ${bookData.title}`,
      updated: `Updated book: ${bookData.title}`,
      deleted: `Deleted book: ${bookData.title}`,
    };

    return this.logUserAction(
      `book_${operation}`,
      {
        book_id: bookData.id,
        book_title: bookData.title,
        book_author: bookData.author,
        info: infoMessage?.[0] || actionMessages[operation],
      },
      user,
    );
  }

  async logBlogOperation(
    operation: "created" | "updated" | "published" | "deleted",
    blogData: { id?: string; title: string; slug?: string },
    user: { id: string; email: string },
    changes?: string[],
  ): Promise<string | null> {
    return this.logUserAction(
      `blog_${operation}`,
      {
        blog_id: blogData.id,
        blog_title: blogData.title,
        blog_slug: blogData.slug,
        changes: changes || [],
      },
      user,
    );
  }

  async logMessageStatusChange(
    messageId: string,
    oldStatus: string,
    newStatus: string,
    user: { id: string; email: string },
  ): Promise<string | null> {
    return this.logUserAction(
      "message_status_changed",
      {
        message_id: messageId,
        old_status: oldStatus,
        new_status: newStatus,
      },
      user,
    );
  }

  async logFileUpload(
    fileName: string,
    fileSize: number,
    fileType: string,
    uploadType: "contact_attachment" | "book_cover" | "blog_image",
    user?: { id: string; email: string },
    request?: Request,
  ): Promise<string | null> {
    return this.logUserAction(
      "file_uploaded",
      {
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        upload_type: uploadType,
        file_size_mb: Math.round((fileSize / 1024 / 1024) * 100) / 100,
      },
      user || { id: "anonymous", email: "unknown@example.com" },
      request,
    );
  }

  async getStats() {
    return this.db.getLogStats();
  }

  async getLogs(filters: LogFilters) {
    return this.db.getLogs(filters);
  }

  async deleteLogs(olderThanDays: number) {
    return this.db.deleteLogs(olderThanDays);
  }
}

// Singleton instance
export const logger = new Logger();

export { clientLogger } from "./client";
export { LogDatabase } from "./database";
// Export types and utilities
export * from "./types";
