"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Upload,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BlogMedia } from "@/types/blog";

interface MediaUploaderProps {
  postId: string;
  onUploadComplete?: (media: BlogMedia[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  altText?: string;
  caption?: string;
}

export function MediaUploader({
  postId,
  onUploadComplete,
  onError,
  maxFiles = 10,
  className = "",
}: MediaUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Create preview for files
  const createPreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(""); // Videos don't need preview
      }
    });
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const remainingSlots = maxFiles - files.length;

      // Validate file sizes manually
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      for (const file of acceptedFiles) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (isVideo && file.size > 25 * 1024 * 1024) {
          oversizedFiles.push(
            `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
          );
        } else if (isImage && file.size > 10 * 1024 * 1024) {
          oversizedFiles.push(
            `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
          );
        } else {
          validFiles.push(file);
        }
      }

      // Show error for oversized files
      if (oversizedFiles.length > 0) {
        const message =
          oversizedFiles.length === 1
            ? `File too large: ${oversizedFiles[0]}`
            : `Files too large: ${oversizedFiles.join(", ")}`;
        onError?.(
          `${message}. Maximum sizes: 25MB for videos, 10MB for images.`,
        );
      }

      const filesToAdd = validFiles.slice(0, remainingSlots);

      // Handle dropzone file rejections
      if (fileRejections.length > 0) {
        const rejectedFiles = fileRejections
          .filter((rejection) =>
            rejection.errors.some((error) => error.code === "file-too-large"),
          )
          .map((rejection) => rejection.file.name);

        if (rejectedFiles.length > 0) {
          onError?.(
            `${rejectedFiles.join(", ")} - File(s) exceed size limits.`,
          );
        }
      }

      if (validFiles.length > remainingSlots) {
        onError?.(
          `Only ${remainingSlots} more file(s) can be added (max ${maxFiles})`,
        );
      }

      const filesWithPreviews = await Promise.all(
        filesToAdd.map(async (file) => {
          const preview = await createPreview(file);
          return {
            ...file,
            preview,
            altText: "",
            caption: "",
          };
        }),
      );

      setFiles((prev) => [...prev, ...filesWithPreviews]);
    },
    [files.length, maxFiles, createPreview, onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"],
      "video/*": [".mp4", ".webm", ".ogg", ".mov", ".quicktime"],
    },
    maxSize: 25 * 1024 * 1024, // 25MB for videos (images will be validated separately)
    maxFiles: maxFiles - files.length,
    disabled: isUploading || files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileMetadata = (
    index: number,
    field: "altText" | "caption",
    value: string,
  ) => {
    setFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, [field]: value } : file)),
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedCount(0);

    try {
      const formData = new FormData();

      // Add each file to formData with indexed keys
      files.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });

      // Add metadata
      formData.append("postId", postId);
      formData.append("altTexts", JSON.stringify(files.map((f) => f.altText)));
      formData.append("captions", JSON.stringify(files.map((f) => f.caption)));

      // Upload files
      const response = await fetch("/api/admin/blogs/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        setUploadedCount(result.uploadedMedia.length);

        // Clear files after successful upload
        setFiles([]);

        onUploadComplete?.(result.uploadedMedia);

        if (result.errors?.length > 0) {
          onError?.(
            `Upload completed with ${result.errors.length} error(s): ${result.errors.join(", ")}`,
          );
        }
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadedCount(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="w-6 h-6" />;
    if (file.type.startsWith("video/")) return <Video className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300 dark:border-gray-700"}
          ${isUploading || files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 dark:hover:border-gray-600"}
        `}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-gray-500 mb-2">or click to select files</p>
          <p className="text-xs text-gray-400">
            Supports images (JPEG, PNG, GIF, WebP, SVG) and videos (MP4, WebM,
            OGG, MOV)
          </p>
          <p className="text-xs text-gray-400">
            Max file size: 10MB (images) / 25MB (videos) • Max files: {maxFiles}
          </p>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Files to Upload ({files.length})
              </h3>
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                className="min-w-[100px]"
              >
                {isUploading ? "Uploading..." : `Upload ${files.length}`}
              </Button>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* File Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {file.preview ? (
                        <Image
                          src={file.preview}
                          alt={file.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 64px"
                        />
                      ) : (
                        getFileIcon(file)
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>

                      {/* Metadata Fields */}
                      <div className="mt-3 space-y-2">
                        <Input
                          placeholder="Alt text for accessibility..."
                          value={file.altText}
                          onChange={(e) =>
                            updateFileMetadata(index, "altText", e.target.value)
                          }
                          className="text-sm"
                          disabled={isUploading}
                        />
                        <Textarea
                          placeholder="Optional caption..."
                          value={file.caption}
                          onChange={(e) =>
                            updateFileMetadata(index, "caption", e.target.value)
                          }
                          className="text-sm resize-none"
                          rows={2}
                          disabled={isUploading}
                        />
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Success Message */}
            {uploadedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Successfully uploaded {uploadedCount} file(s)
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
