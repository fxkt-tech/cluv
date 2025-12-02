/**
 * PlayerArea Component
 * Central preview window with playback controls
 */

import { PLAYBACK_BUTTONS } from "../constants/data";
import { useRef, useEffect, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  PreviousFrameIcon,
  NextFrameIcon,
} from "./icons/PlayerIcons";

interface PlayerAreaProps {
  playbackTime: string;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  videoSrc?: string | null;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export function PlayerArea({
  playbackTime,
  onPlayPause,
  onPrevious,
  onNext,
  videoSrc,
  onTimeUpdate,
  onDurationChange,
}: PlayerAreaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
    }
  }, [videoSrc]);

  // Handle play/pause functionality
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
    onPlayPause?.();
  };

  // Handle previous frame (go back 1/30 second)
  const handlePrevious = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime - 1 / 30,
      );
    }
    onPrevious?.();
  };

  // Handle next frame (go forward 1/30 second)
  const handleNext = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration || 0;
      videoRef.current.currentTime = Math.min(
        duration,
        videoRef.current.currentTime + 1 / 30,
      );
    }
    onNext?.();
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  // Handle play/pause state changes
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Handle duration change
  const handleLoadedMetadata = () => {
    setIsPlaying(false);
    if (videoRef.current && videoRef.current.duration) {
      onDurationChange?.(videoRef.current.duration);
    }
  };
  return (
    <main className="flex-1 flex flex-col relative min-w-0 bg-editor-bg">
      <div className="flex-1 flex items-center justify-center p-2">
        {/* Video Player */}
        {videoSrc ? (
          <video
            ref={videoRef}
            className="aspect-video max-w-full max-h-full shadow-lg border border-editor-border rounded"
            src={videoSrc}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onLoadedMetadata={handleLoadedMetadata}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded text-text-muted">
            {"预览窗口"}
          </div>
        )}
      </div>

      {/* Player Controls */}
      <div className="h-12 flex items-center justify-center gap-4 shrink-0 border-t border-editor-border bg-editor-bg">
        {PLAYBACK_BUTTONS.map((btn) => (
          <button
            key={btn.action}
            onClick={
              btn.action === "play"
                ? handlePlayPause
                : btn.action === "previous"
                  ? handlePrevious
                  : handleNext
            }
            className="transition-colors text-lg text-text-secondary hover:text-text-fg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={btn.label}
            disabled={!videoSrc}
          >
            {btn.action === "play" ? (
              isPlaying ? (
                <PauseIcon size={20} />
              ) : (
                <PlayIcon size={20} />
              )
            ) : btn.action === "previous" ? (
              <PreviousFrameIcon size={20} />
            ) : (
              <NextFrameIcon size={20} />
            )}
          </button>
        ))}
        <div className="text-xs font-mono ml-4 text-accent-cyan">
          {playbackTime}
        </div>
      </div>
    </main>
  );
}
