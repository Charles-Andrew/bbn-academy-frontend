"use client";

import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Upload, Video, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileWithPreview extends File {
  preview?: string;
}

interface SimpleFileUploaderProps {
  onFilesChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  className?: string;
}

export function SimpleFileUploader({
  onFilesChange,
  maxFiles = 10,
  className = "",
}: SimpleFileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

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
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - files.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      const filesWithPreviews = await Promise.all(
        filesToAdd.map(async (file) => {
          const preview = await createPreview(file);
          return {
            ...file,
            preview,
          };
        }),
      );

      const updatedFiles = [...files, ...filesWithPreviews];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, maxFiles, createPreview, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"],
      "video/*": [".mp4", ".webm", ".ogg", ".mov", ".quicktime"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB per file
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="w-6 h-6" />;
    if (file.type.startsWith("video/")) return <Video className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300 dark:border-gray-700"}
          ${files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 dark:hover:border-gray-600"}
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
            Max file size: 50MB • Max files: {maxFiles}
          </p>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Files Selected ({files.length})
            </h3>
          </div>

          {/* File Items */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt={`Preview of ${file.name}`}
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
                    <p className="text-sm text-gray-500">{file.type}</p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
