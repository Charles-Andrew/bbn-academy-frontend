import { Calendar, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContactMessage } from "@/types/contact";

interface MessageCardProps {
  message: ContactMessage;
  viewMode: "list" | "grid";
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onStatusUpdate: (
    messageId: string,
    status: "unread" | "read" | "replied",
  ) => void;
}

const PURPOSE_COLORS = {
  "Book Inquiry":
    "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  "Writing Services":
    "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  Collaboration:
    "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800",
  "Speaking Engagement":
    "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  Other:
    "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
} as const;

const STATUS_COLORS = {
  unread: "destructive",
  read: "secondary",
  replied: "default",
} as const;

function getStatusText(status: string): string {
  switch (status) {
    case "unread":
      return "Unread";
    case "read":
      return "Read";
    case "replied":
      return "Replied";
    default:
      return status;
  }
}

function getPurposeColor(purpose: string): string {
  return (
    PURPOSE_COLORS[purpose as keyof typeof PURPOSE_COLORS] ||
    PURPOSE_COLORS.Other
  );
}

export function MessageCard({
  message,
  viewMode,
  isSelected,
  onSelect,
  onClick,
  onStatusUpdate: _onStatusUpdate,
}: MessageCardProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const isUnread = message.status === "unread";

  return (
    <Card
      className={cn(
        "group relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        "border border-border/50 hover:border-border",
        viewMode === "grid" && "h-full flex flex-col",
        isSelected && "ring-2 ring-primary/20 bg-primary/5 border-primary/30",
        isUnread && "border-l-4 border-l-lava-500 shadow-sm",
        !isUnread && "border-l-4 border-l-transparent",
      )}
    >
      {/* Selection Checkbox - Top-right positioning */}
      <div className="absolute top-3 right-3 z-10" style={{ right: "0.75rem" }}>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors",
            "bg-background hover:bg-muted border-muted-foreground/40 hover:border-primary",
            isSelected && "bg-primary border-primary text-primary-foreground",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-label={isSelected ? "Deselect message" : "Select message"}
        >
          {isSelected && (
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <title>Selected</title>
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      <CardContent
        className={cn(
          "p-4",
          viewMode === "grid" ? "flex-1 flex flex-col" : "relative",
        )}
      >
        <button
          type="button"
          onClick={onClick}
          className="h-full flex flex-col"
          aria-label="View message details"
        >
          {/* Header Section */}
          <div
            className={cn(
              "flex items-start justify-between mb-3",
              viewMode === "grid" ? "flex-col gap-2 pl-6" : "gap-3 pl-8",
            )}
          >
            {/* Name and Email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    "font-semibold text-foreground truncate",
                    viewMode === "list" ? "text-base" : "text-sm",
                  )}
                >
                  {message.full_name}
                </h3>
                {isUnread && (
                  <div className="w-2 h-2 bg-lava-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {message.email}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <Badge
                variant={
                  STATUS_COLORS[message.status as keyof typeof STATUS_COLORS] ||
                  "secondary"
                }
                className="text-xs font-medium"
              >
                {getStatusText(message.status)}
              </Badge>
            </div>
          </div>

          {/* Purpose Badge */}
          <div className="mb-3">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                getPurposeColor(message.purpose),
              )}
            >
              {message.purpose}
            </Badge>
          </div>

          {/* Message Content */}
          <div className="flex-1 mb-3">
            <p
              className={cn(
                "text-muted-foreground leading-relaxed",
                viewMode === "grid"
                  ? "text-sm line-clamp-3"
                  : "text-base line-clamp-2",
              )}
            >
              {message.message}
            </p>
          </div>

          {/* Attachments */}
          {hasAttachments && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Paperclip className="h-3 w-3" />
              <span>
                {message.attachments?.length || 0} attachment
                {(message.attachments?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Footer with Date Only */}
          <div
            className={cn(
              "flex items-center justify-end",
              "pt-3 border-t border-border/50 mt-auto",
              "text-xs text-muted-foreground",
            )}
          >
            {/* Date */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(message.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
