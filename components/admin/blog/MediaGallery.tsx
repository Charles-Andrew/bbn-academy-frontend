"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Edit2,
  GripVertical,
  Image as ImageIcon,
  Pause,
  Play,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMediaPublicUrl } from "@/lib/media-client";
import type { BlogMedia } from "@/types/blog";

interface MediaGalleryProps {
  media: BlogMedia[];
  onMediaUpdate?: (mediaId: string, updates: Partial<BlogMedia>) => void;
  onMediaDelete?: (mediaId: string) => void;
  onMediaReorder?: (mediaIds: string[]) => void;
  editable?: boolean;
  className?: string;
}

export function MediaGallery({
  media,
  onMediaUpdate,
  onMediaDelete,
  onMediaReorder,
  editable = false,
  className = "",
}: MediaGalleryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    alt_text?: string;
    caption?: string;
  }>({});
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  const draggedItem = useRef<string | null>(null);
  const draggedOverItem = useRef<string | null>(null);

  // Sort media by sort_order
  const sortedMedia = [...media].sort((a, b) => a.sort_order - b.sort_order);

  const handleEdit = (mediaItem: BlogMedia) => {
    setEditingId(mediaItem.id);
    setEditForm({
      alt_text: mediaItem.alt_text || "",
      caption: mediaItem.caption || "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/admin/blogs/media/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update media");
      }

      const updatedMedia = await response.json();
      onMediaUpdate?.(editingId, updatedMedia);
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error updating media:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (mediaId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this media? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blogs/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete media");
      }

      onMediaDelete?.(mediaId);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const handleFeaturedToggle = async (mediaId: string) => {
    try {
      const mediaItem = media.find((m) => m.id === mediaId);
      if (!mediaItem) return;

      const response = await fetch(`/api/admin/blogs/media/${mediaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_featured: !mediaItem.is_featured }),
      });

      if (!response.ok) {
        throw new Error("Failed to update featured status");
      }

      const updatedMedia = await response.json();
      onMediaUpdate?.(mediaId, updatedMedia);
    } catch (error) {
      console.error("Error updating featured status:", error);
    }
  };

  const toggleVideoPlay = (mediaId: string) => {
    const videoElement = document.getElementById(
      `video-${mediaId}`,
    ) as HTMLVideoElement;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
      setPlayingVideos((prev) => new Set([...prev, mediaId]));
    } else {
      videoElement.pause();
      setPlayingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  };

  const _toggleVideoMute = (mediaId: string) => {
    const videoElement = document.getElementById(
      `video-${mediaId}`,
    ) as HTMLVideoElement;
    if (!videoElement) return;

    videoElement.muted = !videoElement.muted;
    setMutedVideos((prev) => {
      const newSet = new Set(prev);
      if (videoElement.muted) {
        newSet.add(mediaId);
      } else {
        newSet.delete(mediaId);
      }
      return newSet;
    });
  };

  const _handleDragStart = (e: React.DragEvent, mediaId: string) => {
    if (!editable) return;
    draggedItem.current = mediaId;
    e.dataTransfer.effectAllowed = "move";
  };

  const _handleDragOver = (e: React.DragEvent, mediaId: string) => {
    if (!editable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    draggedOverItem.current = mediaId;
  };

  const _handleDrop = async (e: React.DragEvent, mediaId: string) => {
    if (!editable || !draggedItem.current) return;

    e.preventDefault();

    const draggedIndex = sortedMedia.findIndex(
      (m) => m.id === draggedItem.current,
    );
    const dropIndex = sortedMedia.findIndex((m) => m.id === mediaId);

    if (draggedIndex === dropIndex) {
      draggedItem.current = null;
      draggedOverItem.current = null;
      return;
    }

    const newOrder = [...sortedMedia];
    const [draggedItemObj] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItemObj);

    const mediaIds = newOrder.map((m) => m.id);

    try {
      const response = await fetch("/api/admin/blogs/media/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: media[0]?.post_id,
          mediaIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder media");
      }

      onMediaReorder?.(mediaIds);
    } catch (error) {
      console.error("Error reordering media:", error);
    }

    draggedItem.current = null;
    draggedOverItem.current = null;
  };

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number | undefined | null) => {
    if (!seconds || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedMedia.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No media files yet
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Media is optional for blog posts. Add images or videos to enhance
              your content, or publish without any media.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedMedia.map((mediaItem) => {
            const publicUrl = getMediaPublicUrl(mediaItem.file_path);
            const isEditing = editingId === mediaItem.id;
            const isPlaying = playingVideos.has(mediaItem.id);
            const _isMuted = mutedVideos.has(mediaItem.id);
            const _isExpanded = expandedMedia === mediaItem.id;

            return (
              <motion.div
                key={mediaItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg overflow-hidden transition-all ${
                  mediaItem.is_featured
                    ? "border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                draggable={false}
              >
                <CardContent className="p-4">
                  {/* Featured Badge */}
                  {mediaItem.is_featured && (
                    <div className="flex items-center gap-1 mb-3 text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      <Star className="w-4 h-4 fill-current" />
                      Featured Media
                    </div>
                  )}

                  <div className="flex gap-4">
                    {/* Drag Handle */}
                    {editable && (
                      <div className="flex-shrink-0 flex items-center cursor-move">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    {/* Media Preview */}
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {mediaItem.file_type === "image" ? (
                        <Image
                          src={publicUrl}
                          alt={mediaItem.alt_text || mediaItem.file_name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() =>
                            setExpandedMedia(
                              expandedMedia === mediaItem.id
                                ? null
                                : mediaItem.id,
                            )
                          }
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            id={`video-${mediaItem.id}`}
                            src={publicUrl}
                            className="w-full h-full object-cover"
                            onPlay={() =>
                              setPlayingVideos(
                                (prev) => new Set([...prev, mediaItem.id]),
                              )
                            }
                            onPause={() =>
                              setPlayingVideos((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(mediaItem.id);
                                return newSet;
                              })
                            }
                            muted
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => toggleVideoPlay(mediaItem.id)}
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Media Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">
                            {mediaItem.file_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="capitalize">
                              {mediaItem.file_type || "Unknown"}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(mediaItem.file_size)}</span>
                            {mediaItem.duration && mediaItem.duration > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  {formatDuration(mediaItem.duration)}
                                </span>
                              </>
                            )}
                            {mediaItem.width && mediaItem.height && (
                              <>
                                <span>•</span>
                                <span>
                                  {mediaItem.width}×{mediaItem.height}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {editable && (
                            <>
                              <Button
                                variant={
                                  mediaItem.is_featured ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleFeaturedToggle(mediaItem.id)
                                }
                                title={
                                  mediaItem.is_featured
                                    ? "Remove from featured"
                                    : "Set as featured"
                                }
                                className={
                                  mediaItem.is_featured
                                    ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                                    : ""
                                }
                              >
                                <Star
                                  className={`w-4 h-4 ${mediaItem.is_featured ? "fill-current" : ""}`}
                                />
                                {mediaItem.is_featured ? "Featured" : "Feature"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(mediaItem)}
                                title="Edit media"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(mediaItem.id)}
                                title="Delete media"
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {!editable && mediaItem.is_featured && (
                            <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                              <Star className="w-4 h-4 fill-current" />
                              Featured
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit Form */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 pt-2 border-t"
                          >
                            <Input
                              placeholder="Alt text for accessibility..."
                              value={editForm.alt_text || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  alt_text: e.target.value,
                                }))
                              }
                              className="text-sm"
                            />
                            <Textarea
                              placeholder="Caption..."
                              value={editForm.caption || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  caption: e.target.value,
                                }))
                              }
                              className="text-sm resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSave}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Display Mode - Show alt text and caption */}
                      {!isEditing &&
                        (mediaItem.alt_text || mediaItem.caption) && (
                          <div className="text-sm space-y-1">
                            {mediaItem.alt_text && (
                              <div>
                                <span className="font-medium">Alt: </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {mediaItem.alt_text}
                                </span>
                              </div>
                            )}
                            {mediaItem.caption && (
                              <div>
                                <span className="font-medium">Caption: </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {mediaItem.caption}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Expanded Media Modal */}
      <AnimatePresence>
        {expandedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setExpandedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-10 right-0 text-white hover:text-gray-200"
                onClick={() => setExpandedMedia(null)}
              >
                <X className="w-4 h-4" />
              </Button>

              {(() => {
                const expandedMediaItem = media.find(
                  (m) => m.id === expandedMedia,
                );
                if (!expandedMediaItem) return null;

                const publicUrl = getMediaPublicUrl(
                  expandedMediaItem.file_path,
                );

                return expandedMediaItem.file_type === "image" ? (
                  <Image
                    src={publicUrl}
                    alt={
                      expandedMediaItem.alt_text || expandedMediaItem.file_name
                    }
                    width={800}
                    height={600}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                  />
                ) : (
                  <video
                    src={publicUrl}
                    controls
                    className="max-w-full max-h-[80vh] rounded-lg"
                    autoPlay
                    aria-label={`Video: ${expandedMediaItem.file_name}`}
                  >
                    <track
                      kind="captions"
                      src=""
                      label="English captions"
                      default
                    />
                    Your browser does not support the video element.
                  </video>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
