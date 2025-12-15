/**
 * VideoSyncManager.ts
 *
 * Manages synchronization between timeline playback and underlying video elements.
 *
 * Responsibilities:
 * - Synchronize video element currentTime with clip time and trim bounds
 * - Handle play/pause state synchronization
 * - Throttle seek operations to avoid excessive updates
 * - Track visible clips and their video textures
 * - Support seek tolerance to avoid micro-seeks
 */

import type { VideoTexture } from "../texture/VideoTexture";
import type { Clip } from "../../editor/types/timeline";
import type { ResourceLoader } from "./ResourceLoader";

/**
 * Video sync configuration
 */
export interface VideoSyncConfig {
  /** Seek tolerance in seconds - don't seek if difference is less than this */
  seekTolerance?: number;
  /** Minimum time between seeks for the same video (ms) */
  seekThrottle?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Tracked video state
 */
interface VideoState {
  /** Video texture */
  texture: VideoTexture;
  /** Clip associated with this video */
  clip: Clip;
  /** Last synced video time */
  lastSyncedTime: number;
  /** Last seek timestamp (for throttling) */
  lastSeekTime: number;
  /** Is video playing */
  isPlaying: boolean;
}

/**
 * Video sync statistics
 */
export interface VideoSyncStats {
  /** Number of tracked videos */
  trackedVideos: number;
  /** Number of sync operations performed */
  syncCount: number;
  /** Number of seek operations performed */
  seekCount: number;
  /** Number of play operations performed */
  playCount: number;
  /** Number of pause operations performed */
  pauseCount: number;
  /** Number of skipped seeks (within tolerance) */
  skippedSeeks: number;
  /** Number of throttled seeks */
  throttledSeeks: number;
}

/**
 * VideoSyncManager - Synchronizes video playback with timeline
 */
export class VideoSyncManager {
  private resourceLoader: ResourceLoader;
  private config: Required<VideoSyncConfig>;

  // Tracked video states keyed by clip ID
  private videoStates = new Map<string, VideoState>();

  // Statistics
  private stats: VideoSyncStats = {
    trackedVideos: 0,
    syncCount: 0,
    seekCount: 0,
    playCount: 0,
    pauseCount: 0,
    skippedSeeks: 0,
    throttledSeeks: 0,
  };

  // Current player state
  private isPlayerPlaying = false;

  /**
   * Create VideoSyncManager
   */
  constructor(resourceLoader: ResourceLoader, config: VideoSyncConfig = {}) {
    this.resourceLoader = resourceLoader;
    this.config = {
      seekTolerance: config.seekTolerance ?? 0.1, // 100ms tolerance
      seekThrottle: config.seekThrottle ?? 50, // 50ms minimum between seeks
      debug: config.debug ?? false,
    };

    if (this.config.debug) {
      console.log("[VideoSyncManager] Created with config:", this.config);
    }
  }

  /**
   * Synchronize videos for visible clips at current time
   *
   * @param visibleClips - Array of currently visible clips
   * @param currentTime - Current timeline time in seconds
   * @param isPlaying - Whether player is currently playing
   */
  sync(visibleClips: Clip[], currentTime: number, isPlaying: boolean): void {
    this.stats.syncCount++;

    // Update player playing state
    const wasPlaying = this.isPlayerPlaying;
    this.isPlayerPlaying = isPlaying;

    if (this.config.debug && wasPlaying !== isPlaying) {
      console.log(
        `[VideoSyncManager] Player state changed: ${wasPlaying ? "playing" : "paused"} -> ${isPlaying ? "playing" : "paused"}`,
      );
    }

    // Track which clips are currently visible
    const visibleClipIds = new Set<string>();

    // Process each visible clip
    for (const clip of visibleClips) {
      if (clip.type !== "video" || !clip.resourceSrc) {
        continue;
      }

      visibleClipIds.add(clip.id);

      // Get video texture from resource loader
      const texture = this.resourceLoader.getTexture(clip.resourceSrc);
      if (!texture) {
        if (this.config.debug) {
          console.warn(
            `[VideoSyncManager] No texture found for clip ${clip.id} (${clip.resourceSrc})`,
          );
        }
        continue;
      }

      // Get or create video state
      let videoState = this.videoStates.get(clip.id);
      if (!videoState) {
        videoState = {
          texture,
          clip,
          lastSyncedTime: -1,
          lastSeekTime: 0,
          isPlaying: false,
        };
        this.videoStates.set(clip.id, videoState);
        this.stats.trackedVideos = this.videoStates.size;

        if (this.config.debug) {
          console.log(`[VideoSyncManager] Started tracking video for clip ${clip.id}`);
        }
      } else {
        // Update clip reference (might have changed)
        videoState.clip = clip;
      }

      // Synchronize this video
      this.syncVideo(videoState, currentTime);
    }

    // Clean up videos that are no longer visible
    this.cleanupInvisibleVideos(visibleClipIds);
  }

  /**
   * Synchronize a single video
   */
  private syncVideo(videoState: VideoState, currentTime: number): void {
    const { texture, clip, lastSyncedTime, lastSeekTime, isPlaying } = videoState;
    const video = texture.getVideo();

    if (!video) {
      if (this.config.debug) {
        console.warn(`[VideoSyncManager] No video element for clip ${clip.id}`);
      }
      return;
    }

    // Calculate clip-local time
    const localTime = currentTime - clip.startTime;

    // Calculate desired video time (with trim)
    const desiredVideoTime = clip.trimStart + localTime;

    // Clamp to trim bounds
    const clampedVideoTime = Math.max(
      clip.trimStart,
      Math.min(desiredVideoTime, clip.trimEnd),
    );

    // Check if we need to seek
    const currentVideoTime = video.currentTime;
    const timeDiff = Math.abs(currentVideoTime - clampedVideoTime);
    const needsSeek = timeDiff > this.config.seekTolerance;

    if (needsSeek) {
      // Check throttle
      const now = performance.now();
      const timeSinceLastSeek = now - lastSeekTime;

      if (timeSinceLastSeek < this.config.seekThrottle) {
        // Throttle this seek
        this.stats.throttledSeeks++;
        if (this.config.debug) {
          console.log(
            `[VideoSyncManager] Throttled seek for clip ${clip.id} (${timeSinceLastSeek.toFixed(2)}ms since last seek)`,
          );
        }
      } else {
        // Perform seek
        video.currentTime = clampedVideoTime;
        videoState.lastSyncedTime = clampedVideoTime;
        videoState.lastSeekTime = now;
        this.stats.seekCount++;

        if (this.config.debug) {
          console.log(
            `[VideoSyncManager] Seeked video for clip ${clip.id}: ${currentVideoTime.toFixed(3)}s -> ${clampedVideoTime.toFixed(3)}s (diff: ${timeDiff.toFixed(3)}s)`,
          );
        }
      }
    } else {
      // Within tolerance, skip seek
      if (timeDiff > 0) {
        this.stats.skippedSeeks++;
      }
    }

    // Synchronize play/pause state
    this.syncPlaybackState(videoState, video);
  }

  /**
   * Synchronize video play/pause state
   */
  private syncPlaybackState(videoState: VideoState, video: HTMLVideoElement): void {
    const shouldBePlaying = this.isPlayerPlaying;
    const isVideoPlaying = !video.paused;

    if (shouldBePlaying && !isVideoPlaying) {
      // Need to play
      video.play().catch((error) => {
        console.error(
          `[VideoSyncManager] Failed to play video for clip ${videoState.clip.id}:`,
          error,
        );
      });
      videoState.isPlaying = true;
      this.stats.playCount++;

      if (this.config.debug) {
        console.log(`[VideoSyncManager] Started playback for clip ${videoState.clip.id}`);
      }
    } else if (!shouldBePlaying && isVideoPlaying) {
      // Need to pause
      video.pause();
      videoState.isPlaying = false;
      this.stats.pauseCount++;

      if (this.config.debug) {
        console.log(`[VideoSyncManager] Paused playback for clip ${videoState.clip.id}`);
      }
    }
  }

  /**
   * Clean up videos that are no longer visible
   */
  private cleanupInvisibleVideos(visibleClipIds: Set<string>): void {
    const invisibleClipIds: string[] = [];

    for (const [clipId, videoState] of this.videoStates.entries()) {
      if (!visibleClipIds.has(clipId)) {
        invisibleClipIds.push(clipId);

        // Pause video when it becomes invisible
        const video = videoState.texture.getVideo();
        if (video && !video.paused) {
          video.pause();
          if (this.config.debug) {
            console.log(
              `[VideoSyncManager] Paused invisible video for clip ${clipId}`,
            );
          }
        }
      }
    }

    // Remove invisible videos from tracking
    for (const clipId of invisibleClipIds) {
      this.videoStates.delete(clipId);
      if (this.config.debug) {
        console.log(`[VideoSyncManager] Stopped tracking video for clip ${clipId}`);
      }
    }

    if (invisibleClipIds.length > 0) {
      this.stats.trackedVideos = this.videoStates.size;
    }
  }

  /**
   * Force seek all tracked videos (e.g., on user seek)
   */
  forceSeek(currentTime: number): void {
    if (this.config.debug) {
      console.log(
        `[VideoSyncManager] Force seeking all videos to time ${currentTime.toFixed(3)}s`,
      );
    }

    for (const [clipId, videoState] of this.videoStates.entries()) {
      const video = videoState.texture.getVideo();
      if (!video) {
        continue;
      }

      const { clip } = videoState;
      const localTime = currentTime - clip.startTime;
      const desiredVideoTime = clip.trimStart + localTime;
      const clampedVideoTime = Math.max(
        clip.trimStart,
        Math.min(desiredVideoTime, clip.trimEnd),
      );

      video.currentTime = clampedVideoTime;
      videoState.lastSyncedTime = clampedVideoTime;
      videoState.lastSeekTime = performance.now();
      this.stats.seekCount++;

      if (this.config.debug) {
        console.log(
          `[VideoSyncManager] Force seeked video for clip ${clipId} to ${clampedVideoTime.toFixed(3)}s`,
        );
      }
    }
  }

  /**
   * Pause all tracked videos
   */
  pauseAll(): void {
    if (this.config.debug) {
      console.log("[VideoSyncManager] Pausing all videos");
    }

    for (const videoState of this.videoStates.values()) {
      const video = videoState.texture.getVideo();
      if (video && !video.paused) {
        video.pause();
        videoState.isPlaying = false;
        this.stats.pauseCount++;
      }
    }

    this.isPlayerPlaying = false;
  }

  /**
   * Play all visible videos
   */
  playAll(): void {
    if (this.config.debug) {
      console.log("[VideoSyncManager] Playing all videos");
    }

    for (const videoState of this.videoStates.values()) {
      const video = videoState.texture.getVideo();
      if (video && video.paused) {
        video.play().catch((error) => {
          console.error(
            `[VideoSyncManager] Failed to play video for clip ${videoState.clip.id}:`,
            error,
          );
        });
        videoState.isPlaying = true;
        this.stats.playCount++;
      }
    }

    this.isPlayerPlaying = true;
  }

  /**
   * Get tracked video count
   */
  getTrackedVideoCount(): number {
    return this.videoStates.size;
  }

  /**
   * Get statistics
   */
  getStats(): Readonly<VideoSyncStats> {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      trackedVideos: this.videoStates.size,
      syncCount: 0,
      seekCount: 0,
      playCount: 0,
      pauseCount: 0,
      skippedSeeks: 0,
      throttledSeeks: 0,
    };

    if (this.config.debug) {
      console.log("[VideoSyncManager] Stats reset");
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VideoSyncConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    if (this.config.debug) {
      console.log("[VideoSyncManager] Config updated:", this.config);
    }
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    if (this.config.debug) {
      console.log("[VideoSyncManager] Disposing");
    }

    // Pause and clean up all videos
    this.pauseAll();
    this.videoStates.clear();
    this.stats.trackedVideos = 0;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const lines = [
      "[VideoSyncManager] Debug Info:",
      `  Tracked Videos: ${this.videoStates.size}`,
      `  Player Playing: ${this.isPlayerPlaying}`,
      `  Sync Count: ${this.stats.syncCount}`,
      `  Seek Count: ${this.stats.seekCount}`,
      `  Play Count: ${this.stats.playCount}`,
      `  Pause Count: ${this.stats.pauseCount}`,
      `  Skipped Seeks: ${this.stats.skippedSeeks}`,
      `  Throttled Seeks: ${this.stats.throttledSeeks}`,
      "",
      "  Video States:",
    ];

    for (const [clipId, videoState] of this.videoStates.entries()) {
      const video = videoState.texture.getVideo();
      lines.push(`    ${clipId}:`);
      lines.push(`      Playing: ${videoState.isPlaying}`);
      lines.push(
        `      Video Time: ${video?.currentTime.toFixed(3) ?? "N/A"}s`,
      );
      lines.push(
        `      Last Synced: ${videoState.lastSyncedTime.toFixed(3)}s`,
      );
      lines.push(`      Clip: ${videoState.clip.startTime.toFixed(3)}s - ${(videoState.clip.startTime + videoState.clip.duration).toFixed(3)}s`);
      lines.push(
        `      Trim: ${videoState.clip.trimStart.toFixed(3)}s - ${videoState.clip.trimEnd.toFixed(3)}s`,
      );
    }

    return lines.join("\n");
  }
}
