/**
 * PlayerArea Component
 * Central preview window with playback controls
 */

import { PLAYBACK_BUTTONS } from "../../constants/data";
import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  PlayIcon,
  PauseIcon,
  PreviousFrameIcon,
  NextFrameIcon,
} from "../../icons";

/**
 * PlayerArea 暴露的方法接口
 */
export interface PlayerAreaRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

interface PlayerAreaProps {
  playbackTime: string;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  videoSrc?: string | null;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  externalTime?: number; // 外部控制的时间
}

export const PlayerArea = forwardRef<PlayerAreaRef, PlayerAreaProps>(
  (
    {
      playbackTime,
      onPlayPause,
      onPrevious,
      onNext,
      videoSrc,
      onTimeUpdate,
      onDurationChange,
      externalTime,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const isSeeking = useRef(false);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      seekTo: (time: number) => {
        if (videoRef.current) {
          isSeeking.current = true;
          videoRef.current.currentTime = time;
          setTimeout(() => {
            isSeeking.current = false;
          }, 100);
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
      isPlaying: () => {
        return isPlaying;
      },
    }));

    useEffect(() => {
      if (videoRef.current && videoSrc) {
        videoRef.current.load();
      }
    }, [videoSrc]);

    // 外部时间控制
    useEffect(() => {
      if (
        externalTime !== undefined &&
        videoRef.current &&
        !isSeeking.current &&
        !isPlaying
      ) {
        const currentTime = videoRef.current.currentTime;
        const timeDiff = Math.abs(currentTime - externalTime);

        // 只有当差异超过 0.1 秒时才同步，避免循环更新
        if (timeDiff > 0.1) {
          videoRef.current.currentTime = externalTime;
        }
      }
    }, [externalTime, isPlaying]);

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
      if (videoRef.current && !isSeeking.current) {
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
        <div className="h-8 flex items-center justify-center gap-4 shrink-0 border-t border-editor-border bg-editor-bg">
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
  },
);

PlayerArea.displayName = "PlayerArea";
