"use client";

import {
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Plus,
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

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageManager({
  images,
  onChange,
  maxImages = 10,
  className,
}: ImageManagerProps) {
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
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size must be less than 10MB");
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("File must be an image");
        }

        const formData = new FormData();
        formData.append("file", file);
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

        const response = await fetch("/api/admin/engagements/upload", {
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
        const newImages = [...images, data.url];
        onChange(newImages);
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
    [images, onChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length > 0) {
        const filesToAdd = acceptedFiles.slice(0, maxImages - images.length);
        if (filesToAdd.length < acceptedFiles.length) {
          toast.warning(
            `Only ${maxImages - images.length} images will be uploaded (maximum ${maxImages} images)`,
          );
        }

        filesToAdd.forEach((file) => {
          uploadImage(file);
        });
      }
    },
    [uploadImage, images.length, maxImages],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    disabled: images.length >= maxImages,
  });

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    toast.success("Image removed");
  };

  const handleAddUrl = (url: string) => {
    if (url && images.length < maxImages) {
      const newImages = [...images, url];
      onChange(newImages);
      toast.success("Image added");
    } else if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Engagement Images</Label>
      <p className="text-sm text-muted-foreground">
        Add up to {maxImages} images to showcase your engagement
      </p>

      {/* Existing Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={`image-${image.slice(-8)}`} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <Image
                    src={image}
                    alt=""
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                      className="mr-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {images.length > 1 && (
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => moveImage(index, index - 1)}
                          >
                            ←
                          </Button>
                        )}
                        {index < images.length - 1 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => moveImage(index, index + 1)}
                          >
                            →
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <Input
                    value={image}
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[index] = e.target.value;
                      onChange(newImages);
                    }}
                    placeholder="Image URL"
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div className="space-y-4">
          <Card
            {...getRootProps()}
            className={`border-2 border-dashed cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
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
                    <p className="text-lg font-medium">
                      {images.length === 0
                        ? "Add engagement images"
                        : "Add more images"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop images here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, WebP up to 10MB each
                    </p>
                  </div>
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="image-url">Or add image URL directly</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddUrl((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.getElementById(
                    "image-url",
                  ) as HTMLInputElement;
                  handleAddUrl(input.value);
                  input.value = "";
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        {images.length} of {maxImages} images used
      </div>
    </div>
  );
}
