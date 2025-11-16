"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: number | string;
  height?: number | string;
}

export function VideoPlayer({
  src,
  poster,
  alt,
  className = "",
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  width = "100%",
  height = "auto",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (!loop) setIsPlaying(false);
      setCurrentTime(0);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [loop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      setIsMuted(false);
      setVolume(1);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <section
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      aria-label={`Video player: ${alt || "Video"}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        aria-label={alt}
      />

      {/* Loading Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Controls */}
      {controls && (
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
            >
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group">
                  <div
                    className="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white rounded-full top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{
                      left: `${progress}%`,
                      transform: `translateX(-50%) translateY(-50%)`,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Seek video"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/70 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:text-white/80 p-2"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>

                  {/* Restart */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restart}
                    className="text-white hover:text-white/80 p-2"
                    aria-label="Restart"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:text-white/80 p-2"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="w-20 hidden sm:block">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) =>
                          handleVolumeChange(Number(e.target.value))
                        }
                        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                        aria-label="Volume"
                      />
                    </div>
                  </div>

                  {/* Playback Speed */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="text-white hover:text-white/80 p-2 text-xs"
                      aria-label="Playback speed"
                    >
                      {playbackSpeed}×
                    </Button>
                    <AnimatePresence>
                      {showSpeedMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full mb-2 left-0 bg-black/90 rounded-lg p-2 min-w-[80px]"
                        >
                          {speeds.map((speed) => (
                            <button
                              type="button"
                              key={speed}
                              onClick={() => {
                                setPlaybackSpeed(speed);
                                setShowSpeedMenu(false);
                              }}
                              className={`block w-full text-left px-2 py-1 text-xs text-white hover:bg-white/10 rounded ${
                                speed === playbackSpeed ? "bg-white/20" : ""
                              }`}
                            >
                              {speed}×
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:text-white/80 p-2"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Overlay for mobile */}
      <button
        type="button"
        className="absolute inset-0 lg:hidden"
        onClick={togglePlay}
        aria-label="Toggle play/pause"
      />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </section>
  );
}
