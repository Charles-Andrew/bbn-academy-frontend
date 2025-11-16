"use client";

import { File, FileText, Image, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { Button } from "./button";
import { Card } from "./card";

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
  value?: File[];
  className?: string;
}

interface FileError {
  code: string;
  message: string;
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) {
    return <Image className="w-4 h-4" />;
  } else if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.type.includes("document")
  ) {
    return <FileText className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export function FileUpload({
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "text/plain": [".txt"],
    "text/csv": [".csv"],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5,
  onFilesChange,
  value = [],
  className = "",
}: FileUploadProps) {
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError("");

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (
          rejection.errors.some((e: FileError) => e.code === "file-too-large")
        ) {
          setError(
            `File "${rejection.file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`,
          );
        } else if (
          rejection.errors.some(
            (e: FileError) => e.code === "file-invalid-type",
          )
        ) {
          setError(`File "${rejection.file.name}" has an unsupported type.`);
        } else if (
          rejection.errors.some((e: FileError) => e.code === "too-many-files")
        ) {
          setError(`You can only upload a maximum of ${maxFiles} files.`);
        } else {
          setError(`File "${rejection.file.name}" was rejected.`);
        }
        return;
      }

      const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [value, maxFiles, maxSize, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - value.length,
    multiple: maxFiles > 1,
  });

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setError("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <Card
              key={`file-${file.name}-${file.size}`}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-muted-foreground">{getFileIcon(file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <Card
          {...getRootProps()}
          className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary hover:bg-muted/25"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-muted-foreground mb-2">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum {maxFiles} files • {formatFileSize(maxSize)} per file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: Images (JPEG, PNG, GIF, WebP), Documents (PDF,
                  Word), Text files
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
