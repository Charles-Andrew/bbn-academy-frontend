"use client";

import { CheckSquare, Eye, EyeOff, Mail, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ContactMessage } from "@/types/contact";

interface BatchActionsProps {
  messages: ContactMessage[];
  selectedMessageIds: string[];
  onSelectAll: () => void;
  onSelectNone: () => void;
  onToggleSelection: (messageId: string) => void;
  onBatchStatusUpdate: (
    messageIds: string[],
    status: "unread" | "read" | "replied",
  ) => void;
  onBatchDelete: (messageIds: string[]) => void;
}

export function BatchActions({
  messages,
  selectedMessageIds,
  onSelectAll: _onSelectAll,
  onSelectNone,
  onToggleSelection: _onToggleSelection,
  onBatchStatusUpdate,
  onBatchDelete,
}: BatchActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const hasSelection = selectedMessageIds.length > 0;
  const _allSelected =
    messages.length > 0 && selectedMessageIds.length === messages.length;
  const _someSelected =
    selectedMessageIds.length > 0 &&
    selectedMessageIds.length < messages.length;

  const handleBatchStatusUpdate = async (
    status: "unread" | "read" | "replied",
  ) => {
    if (!hasSelection) return;

    setIsActionLoading(true);
    try {
      await onBatchStatusUpdate(selectedMessageIds, status);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!hasSelection) return;

    setIsActionLoading(true);
    try {
      await onBatchDelete(selectedMessageIds);
      setIsDeleteDialogOpen(false);
      onSelectNone();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBatchReply = () => {
    if (!hasSelection) return;

    const emails = messages
      .filter((msg) => selectedMessageIds.includes(msg.id))
      .map((msg) => msg.email)
      .filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates

    if (emails.length === 1) {
      window.open(`mailto:${emails[0]}`);
    } else {
      const subject = encodeURIComponent("Response to your inquiry");
      const body = encodeURIComponent(
        "Dear valued contact,\n\nThank you for reaching out to BBN Academy.\n\n",
      );
      window.open(`mailto:${emails.join(",")}?subject=${subject}&body=${body}`);
    }
  };

  return (
    <>
      {/* Selection Controls */}
      <div className="flex items-center justify-end gap-4 p-2 bg-muted/30 rounded-lg">
        {hasSelection && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectNone}
              disabled={isActionLoading}
            >
              Clear Selection
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isActionLoading}
                  className="min-w-[120px]"
                >
                  {isActionLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Actions ({selectedMessageIds.length})
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Status Actions */}
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  Update Status
                </div>
                <DropdownMenuItem
                  onClick={() => handleBatchStatusUpdate("unread")}
                  disabled={isActionLoading}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Mark as Unread
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBatchStatusUpdate("read")}
                  disabled={isActionLoading}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBatchStatusUpdate("replied")}
                  disabled={isActionLoading}
                  className="flex items-center gap-2"
                >
                  <Reply className="h-4 w-4" />
                  Mark as Replied
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Other Actions */}
                <DropdownMenuItem
                  onClick={handleBatchReply}
                  disabled={isActionLoading}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Reply via Email
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Dangerous Actions */}
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {selectedMessageIds.length} selected message
              {selectedMessageIds.length !== 1 ? "s" : ""} and all associated
              attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </div>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete {selectedMessageIds.length} Message
                  {selectedMessageIds.length !== 1 ? "s" : ""}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
