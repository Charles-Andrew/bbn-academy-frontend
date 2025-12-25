"use client";

import { AlertCircle, Image as ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageManager({
  images,
  onChange,
  files,
  onFilesChange,
  maxImages = 10,
  className,
}: ImageManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const addFile = useCallback(
    (file: File) => {
      setError(null);

      try {
        // Check file size
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size must be less than 10MB");
        }

        // Check file type
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          throw new Error("File must be an image or video");
        }

        const newFiles = [...files, file];
        onFilesChange(newFiles);
        toast.success(
          `${file.type.startsWith("video/") ? "Video" : "Image"} added successfully`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add file";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [files, onFilesChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length > 0) {
        const filesToAdd = acceptedFiles.slice(0, maxImages - files.length);
        if (filesToAdd.length < acceptedFiles.length) {
          toast.warning(
            `Only ${maxImages - files.length} files will be added (maximum ${maxImages} files)`,
          );
        }

        filesToAdd.forEach((file) => {
          addFile(file);
        });
      }
    },
    [addFile, files.length, maxImages],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    disabled: files.length >= maxImages,
  });

  const handleRemoveImage = (index: number) => {
    // Check if this is a newly added file or existing image
    if (index < files.length) {
      // Remove from files
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
      toast.success("File removed");
    } else {
      // Remove from existing images
      const imageIndex = index - files.length;
      const newImages = images.filter((_, i) => i !== imageIndex);
      onChange(newImages);
      toast.success("Image removed");
    }
  };

  const createFilePreview = (file: File): string => {
    if (file.type.startsWith("video/")) {
      return URL.createObjectURL(file);
    }
    return URL.createObjectURL(file);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    onFilesChange(newFiles);
  };

  // Total media count = existing images + new files
  const totalMediaCount = images.length + files.length;

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Engagement Images</Label>
      <p className="text-sm text-muted-foreground">
        Upload up to {maxImages} images to showcase your engagement. Files will
        be uploaded when you submit the form.
      </p>

      {/* New Files (not yet uploaded) */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            New Files ({files.length}) - Will be uploaded on submit
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => {
              const previewUrl = createFilePreview(file);
              const isVideo = file.type.startsWith("video/");

              return (
                <Card
                  key={`new-file-${file.name}-${file.size}-${index}`}
                  className="relative group border-blue-200 dark:border-blue-800"
                >
                  <CardContent className="p-2">
                    <div className="relative aspect-square">
                      {isVideo ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-full object-cover rounded-md"
                        >
                          <track kind="captions" />
                        </video>
                      ) : (
                        // biome-ignore lint/performance/noImgElement: File preview URLs are not suitable for Next.js Image optimization
                        <img
                          src={previewUrl}
                          alt={`New file ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                          className="mr-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {files.length > 1 && (
                          <div className="flex gap-1">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => moveFile(index, index - 1)}
                              >
                                ←
                              </Button>
                            )}
                            {index < files.length - 1 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => moveFile(index, index + 1)}
                              >
                                →
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground truncate">
                      {file.name}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Existing Images ({images.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => {
              // Use image URL as key, fallback to index if image is empty
              const cardKey = image || `existing-img-${index}`;
              return (
                <Card key={cardKey} className="relative group">
                  <CardContent className="p-2">
                    <div className="relative aspect-square">
                      {image.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video
                          src={image}
                          controls
                          className="w-full h-full object-cover rounded-md"
                        >
                          <track kind="captions" />
                        </video>
                      ) : (
                        // biome-ignore lint/performance/noImgElement: External image URLs may not be suitable for Next.js Image optimization
                        <img
                          src={image}
                          alt={`Engagement media ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveImage(files.length + index)
                          }
                          className="mr-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {images.length > 1 && (
                          <div className="flex gap-1">
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => moveImage(index, index - 1)}
                              >
                                ←
                              </Button>
                            )}
                            {index < images.length - 1 && (
                              <Button
                                type="button"
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {totalMediaCount < maxImages && (
        <div className="space-y-4">
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
              <div className="space-y-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {totalMediaCount === 0
                      ? "Add engagement images"
                      : "Add more images"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop images here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF, WebP, MP4, WebM up to 10MB each. Files will
                    be uploaded when you submit the form.
                  </p>
                </div>
                <Button type="button" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Images
                </Button>
              </div>
            </CardContent>
          </Card>

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
        {totalMediaCount} of {maxImages} images used
      </div>
    </div>
  );
}
