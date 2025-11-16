"use client";

import {
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  placeholder = "Upload an image",
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const uploadImage = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        // Check file size
        if (file.size > maxSize) {
          throw new Error(
            `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
          );
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("File must be an image");
        }

        const formData = new FormData();
        formData.append("file", file);

        // Add alt text (optional - you might want to add a separate input for this)
        formData.append("alt", file.name);

        // Create upload progress simulation
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const response = await fetch("/api/admin/blogs/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();
        onChange(data.url);
        toast.success("Image uploaded successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [maxSize, onChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length > 0) {
        uploadImage(acceptedFiles[0]);
      }
    },
    [uploadImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { "image/*": [] } : undefined,
    maxSize,
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleUrlChange = (url: string) => {
    onChange(url || null);
    setError(null);
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Featured Image</Label>

      {value ? (
        // Display existing image
        <Card>
          <CardContent className="p-4">
            <div className="relative group w-full h-48">
              <Image
                src={value}
                alt=""
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="image-url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image-url"
                  value={value}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => onChange(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Upload interface
        <div className="space-y-4">
          {/* Dropzone */}
          <Card
            {...getRootProps()}
            className={`border-2 border-dashed cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            <CardContent className="p-8 text-center">
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading image...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {uploadProgress}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">{placeholder}</p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop an image here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, WebP up to{" "}
                      {Math.round(maxSize / 1024 / 1024)}MB
                    </p>
                  </div>
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="image-url">Or enter image URL directly</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              onChange={(e) => handleUrlChange(e.target.value)}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
