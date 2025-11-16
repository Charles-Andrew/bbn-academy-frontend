"use client";

import {
  Calendar,
  Mail,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ContactAttachment, ContactMessage } from "@/types/contact";
import { AttachmentPreview } from "./attachment-preview";

interface MessageDetailModalProps {
  message: ContactMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (
    messageId: string,
    status: "unread" | "read" | "replied",
  ) => void;
  onReply?: (messageId: string, replyText: string) => void;
}

export function MessageDetailModal({
  message,
  isOpen,
  onClose,
  onStatusUpdate,
  onReply,
}: MessageDetailModalProps) {
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [activeTab, setActiveTab] = useState<"message" | "attachments">(
    "message",
  );

  useEffect(() => {
    if (isOpen && message) {
      setReplyText("");
      setActiveTab(
        message.attachments && message.attachments.length > 0
          ? "message"
          : "message",
      );
    }
  }, [isOpen, message]);

  if (!message) return null;

  const getStatusText = (status: string): string => {
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
  };

  const getStatusVariant = (
    status: string,
  ): "destructive" | "secondary" | "default" => {
    switch (status) {
      case "unread":
        return "destructive";
      case "read":
        return "secondary";
      case "replied":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleStatusUpdate = (status: "unread" | "read" | "replied") => {
    onStatusUpdate(message.id, status);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !onReply) return;

    setIsSendingReply(true);
    try {
      await onReply(message.id, replyText);
      setReplyText("");
      handleStatusUpdate("replied");
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleReplyViaEmail = () => {
    const subject = encodeURIComponent(`Re: ${message.purpose}`);
    const body = encodeURIComponent(
      `\n\n--- Original Message ---\nFrom: ${message.full_name} <${message.email}>\nDate: ${new Date(message.created_at).toLocaleString()}\n\n${message.message}`,
    );
    window.open(`mailto:${message.email}?subject=${subject}&body=${body}`);
  };

  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Message Details
          </DialogTitle>
          <DialogDescription>
            View and manage message details and attachments
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Message Header */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{message.full_name}</span>
                  </div>
                  <Badge variant={getStatusVariant(message.status)}>
                    {getStatusText(message.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${message.email}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {message.email}
                  </a>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(message.created_at).toLocaleDateString()}
                </div>
                <div>{new Date(message.created_at).toLocaleTimeString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Purpose:</span>
                <span className="text-muted-foreground">{message.purpose}</span>
              </div>
              {hasAttachments && (
                <div className="flex items-center gap-1 text-sm">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {message.attachments?.length || 0} attachment
                    {(message.attachments?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {hasAttachments && (
            <div className="flex gap-1 mb-4 bg-muted/30 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("message")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === "message"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("attachments")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === "attachments"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Paperclip className="h-4 w-4" />
                Attachments ({message.attachments?.length || 0})
              </button>
            </div>
          )}

          {/* Content */}
          <div className="space-y-6">
            {activeTab === "message" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Message Content
                  </h3>
                  <div className="bg-background border rounded-lg p-4">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {message.message}
                    </p>
                  </div>
                </div>

                {/* Reply Section */}
                {onReply && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Quick Reply</h3>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your reply here..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[100px] sm:min-h-[120px] resize-none"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || isSendingReply}
                          className="flex items-center justify-center gap-2 h-10"
                        >
                          <Send className="h-4 w-4" />
                          {isSendingReply ? "Sending..." : "Send Reply"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleReplyViaEmail}
                          className="flex items-center justify-center gap-2 h-10"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            Reply via Email
                          </span>
                          <span className="sm:hidden">Email</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "attachments" && hasAttachments && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                <div className="grid gap-4">
                  {(message.attachments || []).map(
                    (attachment: ContactAttachment) => (
                      <AttachmentPreview
                        key={attachment.id}
                        attachment={attachment}
                        messageId={message.id}
                      />
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <div className="flex gap-1 flex-wrap">
              <Button
                size="sm"
                variant={message.status === "unread" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("unread")}
                className="text-xs h-8 px-3"
              >
                Unread
              </Button>
              <Button
                size="sm"
                variant={message.status === "read" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("read")}
                className="text-xs h-8 px-3"
              >
                Read
              </Button>
              <Button
                size="sm"
                variant={message.status === "replied" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("replied")}
                className="text-xs h-8 px-3"
              >
                Replied
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleReplyViaEmail}
            className="text-xs h-8 px-3"
            size="sm"
          >
            <Reply className="h-3.5 w-3.5 mr-1.5" />
            Email Reply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
