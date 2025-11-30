"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import Next.js Image to avoid hydration issues
const DynamicImage = dynamic(
  () =>
    import("next/image").then((mod) => {
      // Create a wrapper component that handles onError
      const ImageWithErrorHandling = ({
        src,
        alt,
        className,
        onError,
        ...props
      }: React.ComponentProps<typeof mod.default> & {
        onError?: () => void;
      }) => (
        <mod.default
          src={src}
          alt={alt}
          className={className}
          onError={onError}
          {...props}
        />
      );
      return { default: ImageWithErrorHandling };
    }),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted animate-pulse" />,
  },
);

interface FeaturedMediaProps {
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  title: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
}

export function FeaturedMedia({
  mediaUrl,
  mediaType,
  title,
  className = "",
  autoPlay = false,
  muted = true,
  loop = false,
  poster,
}: FeaturedMediaProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!mediaUrl) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-muted ${className}`}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted-foreground/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Media placeholder"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">
            {mediaType === "video" ? "Featured Video" : "Featured Image"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {mediaType === "video"
              ? "Article featured video will appear here"
              : "Article featured image will appear here"}
          </p>
        </div>
      </div>
    );
  }

  if (mediaType === "image" && imageError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-muted ${className}`}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Image load error"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">
            Failed to load image
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            The featured image could not be loaded
          </p>
        </div>
      </div>
    );
  }

  if (mediaType === "video" && videoError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-muted ${className}`}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Video load error"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">
            Failed to load video
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            The featured video could not be loaded
          </p>
        </div>
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <video
          src={mediaUrl}
          className="w-full h-full object-cover"
          controls
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          poster={poster}
          onError={() => setVideoError(true)}
          preload="metadata"
          suppressHydrationWarning={true}
        >
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
          <svg
            className="w-3 h-3 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-label="Video icon"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Video
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <DynamicImage
        src={mediaUrl}
        alt={title}
        className={`w-full h-full object-cover`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false}
        onError={() => setImageError(true)}
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          role="img"
          aria-label="Image icon"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
        Image
      </div>
    </div>
  );
}
