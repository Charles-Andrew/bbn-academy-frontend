"use client"

import * as React from "react"
import { Trash2, Archive, Check, Reply } from "lucide-react"

import { Button } from "@/components/ui/button"

// Example usage for admin message management
interface AdminMessageActionsProps {
  messageId: string
  messageStatus: "unread" | "read" | "replied"
  onDelete?: (id: string) => Promise<void>
  onArchive?: (id: string) => Promise<void>
  onMarkRead?: (id: string) => Promise<void>
  onReply?: (id: string) => void
}

export function AdminMessageActions({
  messageId,
  messageStatus,
  onDelete,
  onArchive,
  onMarkRead,
  onReply,
}: AdminMessageActionsProps) {
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleDelete = async () => {
    if (!onDelete) return
    setLoading("delete")
    try {
      await onDelete(messageId)
    } finally {
      setLoading(null)
    }
  }

  const handleArchive = async () => {
    if (!onArchive) return
    setLoading("archive")
    try {
      await onArchive(messageId)
    } finally {
      setLoading(null)
    }
  }

  const handleMarkRead = async () => {
    if (!onMarkRead) return
    setLoading("read")
    try {
      await onMarkRead(messageId)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Mark as Read */}
      {messageStatus === "unread" && onMarkRead && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleMarkRead()}
          disabled={loading === "read"}
        >
          <Check className="mr-2 h-4 w-4" />
          Mark Read
        </Button>
      )}

      {/* Reply */}
      {onReply && (
        <Button size="sm" variant="outline" onClick={() => onReply(messageId)}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </Button>
      )}

      {/* Archive */}
      {onArchive && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleArchive()}
          disabled={loading === "archive"}
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      )}

      {/* Delete */}
      {onDelete && (
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => handleDelete()}
          disabled={loading === "delete"}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  )
}