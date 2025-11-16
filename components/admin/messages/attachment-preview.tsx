"use client";

import {
  Archive,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Film,
  Loader2,
  Music,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { ContactAttachment } from "@/types/contact";

interface AttachmentPreviewProps {
  attachment: ContactAttachment;
  messageId: string;
}

export function AttachmentPreview({
  attachment,
  messageId: _messageId,
}: AttachmentPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return FileImage;
    }
    if (fileType.startsWith("video/")) {
      return Film;
    }
    if (fileType.startsWith("audio/")) {
      return Music;
    }
    if (fileType.includes("pdf") || fileType.includes("document")) {
      return FileText;
    }
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("tar")
    ) {
      return Archive;
    }
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getFileTypeLabel = (fileType: string): string => {
    if (fileType.startsWith("image/")) return "Image";
    if (fileType.startsWith("video/")) return "Video";
    if (fileType.startsWith("audio/")) return "Audio";
    if (fileType.includes("pdf")) return "PDF Document";
    if (fileType.includes("word")) return "Word Document";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "Spreadsheet";
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return "Presentation";
    if (fileType.includes("text")) return "Text File";
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("tar")
    )
      return "Archive";
    return "File";
  };

  const isPreviewable = (fileType: string): boolean => {
    return (
      fileType.startsWith("image/") ||
      fileType.startsWith("text/") ||
      fileType.includes("pdf")
    );
  };

  const handlePreview = async () => {
    if (!isPreviewable(attachment.file_type)) {
      // For non-previewable files, just download
      handleDownload();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate signed URL for the file
      const { data, error } = await supabase.storage
        .from("contact-attachments")
        .createSignedUrl(attachment.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      setPreviewUrl(data.signedUrl);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Error generating preview URL:", error);
      setError("Failed to load preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Generate signed URL for download
      const { data, error } = await supabase.storage
        .from("contact-attachments")
        .createSignedUrl(attachment.file_path, 3600);

      if (error) throw error;

      // Create download link
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("Failed to download file");
    }
  };

  const FileIcon = getFileIcon(attachment.file_type);

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <FileIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className="font-medium text-sm truncate"
                title={attachment.file_name}
              >
                {attachment.file_name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{getFileTypeLabel(attachment.file_type)}</span>
                <span>•</span>
                <span>{formatFileSize(attachment.file_size)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isPreviewable(attachment.file_type) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePreview}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-xs text-destructive">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">
                {attachment.file_name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {previewUrl && attachment.file_type.startsWith("image/") && (
              <div className="flex justify-center">
                <Image
                  src={previewUrl}
                  alt={attachment.file_name}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                />
              </div>
            )}

            {previewUrl && attachment.file_type.includes("pdf") && (
              <div className="h-[70vh]">
                <iframe
                  src={previewUrl}
                  title={attachment.file_name}
                  className="w-full h-full rounded-lg border"
                />
              </div>
            )}

            {previewUrl && attachment.file_type.startsWith("text/") && (
              <div className="bg-muted/30 rounded-lg p-4">
                <iframe
                  src={previewUrl}
                  title={attachment.file_name}
                  className="w-full h-[70vh] bg-background border rounded-lg p-4 font-mono text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {formatFileSize(attachment.file_size)} •{" "}
              {getFileTypeLabel(attachment.file_type)}
            </div>
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
