"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  X,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { VideoPlayer } from "@/components/ui/video-player";
import { getMediaPublicUrl } from "@/lib/media-client";
import type { BlogMedia } from "@/types/blog";

interface BlogMediaGalleryProps {
  media: BlogMedia[];
  className?: string;
  showThumbnails?: boolean;
  enableLightbox?: boolean;
  enableDownload?: boolean;
}

export function BlogMediaGallery({
  media,
  className = "",
  showThumbnails = true,
  enableLightbox = true,
  enableDownload = false,
}: BlogMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const currentMedia = media[currentIndex];
  const publicUrl = getMediaPublicUrl(currentMedia.file_path);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    if (enableLightbox) {
      setIsLightboxOpen(true);
    }
  };

  const handleMainMediaClick = () => {
    if (enableLightbox) {
      setIsLightboxOpen(true);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = currentMedia.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Media Display */}
      <div className="relative group">
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {currentMedia.file_type === "image" ? (
            <button
              type="button"
              className="relative w-full h-full cursor-pointer"
              onClick={handleMainMediaClick}
            >
              <Image
                src={publicUrl}
                alt={currentMedia.alt_text || currentMedia.file_name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority={currentIndex === 0}
              />

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2">
                  {enableLightbox && (
                    <button
                      type="button"
                      onClick={handleMainMediaClick}
                      className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 backdrop-blur-sm"
                      aria-label="Expand image"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  )}
                  {enableDownload && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 backdrop-blur-sm"
                      aria-label="Download media"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <VideoPlayer
              src={publicUrl}
              alt={currentMedia.alt_text || currentMedia.file_name}
              className="w-full h-full"
              controls={true}
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next media"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Media Counter */}
        {media.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded-full">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Media Info */}
      {(currentMedia.caption || currentMedia.alt_text) && (
        <div className="text-center space-y-1">
          {currentMedia.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {currentMedia.caption}
            </p>
          )}
          {currentMedia.alt_text && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Alt: {currentMedia.alt_text}
            </p>
          )}
        </div>
      )}

      {/* Thumbnail Gallery */}
      {showThumbnails && media.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {media.map((mediaItem, index) => {
            const thumbnailUrl = getMediaPublicUrl(mediaItem.file_path);
            const isActive = index === currentIndex;

            return (
              <button
                type="button"
                key={mediaItem.id}
                onClick={() => handleThumbnailClick(index)}
                className={`
                  relative aspect-video rounded-md overflow-hidden border-2 transition-all duration-200
                  ${
                    isActive
                      ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                `}
                aria-label={`View ${mediaItem.file_name}`}
              >
                {mediaItem.file_type === "image" ? (
                  <Image
                    src={thumbnailUrl}
                    alt={mediaItem.alt_text || mediaItem.file_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                ) : (
                  <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700">
                    <video
                      src={thumbnailUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 ring-2 ring-blue-500 rounded-md pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm"
                aria-label="Close lightbox"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation */}
              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Media Content */}
              <div className="relative w-full h-full flex items-center justify-center">
                {currentMedia.file_type === "image" ? (
                  <Image
                    src={publicUrl}
                    alt={currentMedia.alt_text || currentMedia.file_name}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <VideoPlayer
                    src={publicUrl}
                    alt={currentMedia.alt_text || currentMedia.file_name}
                    className="max-w-full max-h-full"
                    controls={true}
                    width="100%"
                    height="100%"
                  />
                )}
              </div>

              {/* Media Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{currentMedia.file_name}</h3>
                    <div className="text-sm opacity-75 space-x-4">
                      <span>{currentMedia.file_type}</span>
                      <span>{formatFileSize(currentMedia.file_size)}</span>
                      {currentMedia.duration && (
                        <span>{formatDuration(currentMedia.duration)}</span>
                      )}
                      {currentMedia.width && currentMedia.height && (
                        <span>
                          {currentMedia.width}×{currentMedia.height}
                        </span>
                      )}
                    </div>
                    {currentMedia.caption && (
                      <p className="text-sm mt-2">{currentMedia.caption}</p>
                    )}
                  </div>
                  {media.length > 1 && (
                    <div className="text-sm">
                      {currentIndex + 1} / {media.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
