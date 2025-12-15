/**
 * WebGLPlayerArea Component
 * Central preview window with WebGL-based playback and effects
 */

import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  PlayIcon,
  PauseIcon,
  PreviousFrameIcon,
  NextFrameIcon,
  KivaCutLogo,
} from "../../icons";
import { WebGLPlayerManager } from "../../../webgl/player/WebGLPlayerManager";
import { Track } from "../../types/timeline";
import { PLAYBACK_BUTTONS } from "../../constants/data";

/**
 * WebGLPlayerArea exposed methods interface
 */
export interface WebGLPlayerAreaRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  updateScene: (tracks: Track[]) => void;
  getPlayerManager: () => WebGLPlayerManager | null;
}

interface WebGLPlayerAreaProps {
  playbackTime: string;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  tracks?: Track[];
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  externalTime?: number; // External time control
  width?: number;
  height?: number;
  fps?: number;
}

export const WebGLPlayerArea = forwardRef<
  WebGLPlayerAreaRef,
  WebGLPlayerAreaProps
>(
  (
    {
      playbackTime,
      onPlayPause,
      onPrevious,
      onNext,
      tracks = [],
      onTimeUpdate,
      onDurationChange,
      externalTime,
      width = 1920,
      height = 1080,
      fps = 30,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerManagerRef = useRef<WebGLPlayerManager | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isSeeking = useRef(false);
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Initialize WebGL player
    useEffect(() => {
      if (!canvasRef.current) return;

      const initPlayer = async () => {
        try {
          const manager = new WebGLPlayerManager(canvasRef.current!, {
            width,
            height,
            backgroundColor: [0.1, 0.1, 0.1, 1.0],
            targetFPS: fps,
            enableBatching: true,
            autoUpdateTextures: true,
            debug: false,
          });

          await manager.initialize();
          playerManagerRef.current = manager;
          setIsInitialized(true);
          setError(null);

          // Set initial duration if available
          if (onDurationChange) {
            onDurationChange(manager.getDuration());
          }
        } catch (err) {
          console.error("Failed to initialize WebGL player:", err);
          setError(
            err instanceof Error ? err.message : "Failed to initialize player",
          );
        }
      };

      initPlayer();

      return () => {
        if (playerManagerRef.current) {
          playerManagerRef.current.dispose();
          playerManagerRef.current = null;
        }
        if (animationFrameRef.current !== undefined) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [width, height, fps, onDurationChange]);

    // Update scene when tracks change
    useEffect(() => {
      if (isInitialized && playerManagerRef.current) {
        try {
          playerManagerRef.current.updateScene(tracks, 0);
        } catch (err) {
          console.error("Failed to update scene:", err);
        }
      }
    }, [tracks, isInitialized]);

    // External time control
    useEffect(() => {
      if (
        externalTime !== undefined &&
        playerManagerRef.current &&
        !isSeeking.current &&
        !isPlaying
      ) {
        const currentTime = playerManagerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - externalTime);

        // Only sync if difference exceeds 0.1 seconds to avoid update loops
        if (timeDiff > 0.1) {
          playerManagerRef.current.seekTo(externalTime);
        }
      }
    }, [externalTime, isPlaying]);

    // Playback loop for time updates
    useEffect(() => {
      if (!isPlaying || !playerManagerRef.current) {
        if (animationFrameRef.current !== undefined) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = undefined;
        }
        return;
      }

      const updateLoop = () => {
        if (playerManagerRef.current && !isSeeking.current) {
          const currentTime = playerManagerRef.current.getCurrentTime();
          const duration = playerManagerRef.current.getDuration();

          onTimeUpdate?.(currentTime);

          // Stop at end
          if (currentTime >= duration) {
            setIsPlaying(false);
            playerManagerRef.current.pause();
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateLoop);
      };

      animationFrameRef.current = requestAnimationFrame(updateLoop);

      return () => {
        if (animationFrameRef.current !== undefined) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isPlaying, onTimeUpdate]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      play: () => {
        if (playerManagerRef.current) {
          playerManagerRef.current.play();
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (playerManagerRef.current) {
          playerManagerRef.current.pause();
          setIsPlaying(false);
        }
      },
      seekTo: (time: number) => {
        if (playerManagerRef.current) {
          isSeeking.current = true;
          playerManagerRef.current.seekTo(time);
          setTimeout(() => {
            isSeeking.current = false;
          }, 100);
        }
      },
      getCurrentTime: () => {
        return playerManagerRef.current?.getCurrentTime() || 0;
      },
      getDuration: () => {
        return playerManagerRef.current?.getDuration() || 0;
      },
      isPlaying: () => {
        return isPlaying;
      },
      updateScene: (tracks: Track[]) => {
        if (playerManagerRef.current) {
          playerManagerRef.current.updateScene(tracks, 0);
        }
      },
      getPlayerManager: () => {
        return playerManagerRef.current;
      },
    }));

    // Handle play/pause functionality
    const handlePlayPause = useCallback(() => {
      if (playerManagerRef.current) {
        if (isPlaying) {
          playerManagerRef.current.pause();
          setIsPlaying(false);
        } else {
          playerManagerRef.current.play();
          setIsPlaying(true);
        }
      }
      onPlayPause?.();
    }, [isPlaying, onPlayPause]);

    // Handle previous frame (go back 1 frame)
    const handlePrevious = useCallback(() => {
      if (playerManagerRef.current) {
        const frameTime = 1 / fps;
        const currentTime = playerManagerRef.current.getCurrentTime();
        playerManagerRef.current.seekTo(Math.max(0, currentTime - frameTime));
      }
      onPrevious?.();
    }, [fps, onPrevious]);

    // Handle next frame (go forward 1 frame)
    const handleNext = useCallback(() => {
      if (playerManagerRef.current) {
        const frameTime = 1 / fps;
        const currentTime = playerManagerRef.current.getCurrentTime();
        const duration = playerManagerRef.current.getDuration();
        playerManagerRef.current.seekTo(
          Math.min(duration, currentTime + frameTime),
        );
      }
      onNext?.();
    }, [fps, onNext]);

    // Handle canvas resize
    useEffect(() => {
      if (!canvasRef.current || !playerManagerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: containerWidth, height: containerHeight } =
            entry.contentRect;
          if (playerManagerRef.current) {
            playerManagerRef.current.resize(
              Math.floor(containerWidth),
              Math.floor(containerHeight),
            );
          }
        }
      });

      resizeObserver.observe(canvasRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [isInitialized]);

    const hasContent = tracks.length > 0;

    return (
      <main className="flex-1 flex flex-col relative min-w-0 bg-editor-bg">
        <div className="flex-1 flex items-center justify-center p-2">
          {/* WebGL Canvas */}
          {error ? (
            <div className="w-full h-full flex flex-col items-center justify-center rounded text-accent-red">
              <p className="mb-4">WebGL Player Error</p>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          ) : hasContent || isInitialized ? (
            <canvas
              ref={canvasRef}
              className="aspect-video max-w-full max-h-full shadow-lg border border-editor-border rounded"
              style={{
                imageRendering: "pixelated",
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded text-text-muted">
              <KivaCutLogo size={200} className="text-[#B22222]" />
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
              disabled={!isInitialized || !!error}
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
          {isInitialized && (
            <div className="text-xs text-text-muted ml-2">WebGL</div>
          )}
        </div>
      </main>
    );
  },
);

WebGLPlayerArea.displayName = "WebGLPlayerArea";
