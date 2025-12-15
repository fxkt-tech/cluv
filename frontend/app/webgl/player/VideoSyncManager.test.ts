/**
 * VideoSyncManager.test.ts
 *
 * Tests for video synchronization manager
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { VideoSyncManager } from "./VideoSyncManager";
import type { ResourceLoader } from "./ResourceLoader";
import type { VideoTexture } from "../texture/VideoTexture";
import type { Clip } from "../../editor/types/timeline";

// Mock VideoTexture
class MockVideoTexture {
  private video: HTMLVideoElement;
  private _width: number;
  private _height: number;

  constructor(width = 1920, height = 1080) {
    this._width = width;
    this._height = height;
    this.video = document.createElement("video");

    // Mock read-only properties
    Object.defineProperty(this.video, "duration", {
      value: 10,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(this.video, "paused", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock play method
    this.video.play = vi.fn().mockResolvedValue(undefined);

    this.video.currentTime = 0;
  }

  getVideo(): HTMLVideoElement {
    return this.video;
  }

  getDuration(): number {
    return this.video.duration;
  }

  getCurrentTime(): number {
    return this.video.currentTime;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }
}

// Mock ResourceLoader
class MockResourceLoader {
  private textures = new Map<string, VideoTexture>();

  addTexture(resourceId: string, texture: VideoTexture): void {
    this.textures.set(resourceId, texture);
  }

  getTexture(resourceId: string): VideoTexture | undefined {
    return this.textures.get(resourceId);
  }
}

// Helper to create test clip
function createTestClip(
  id: string,
  startTime: number,
  duration: number,
  trimStart = 0,
  trimEnd?: number,
): Clip {
  return {
    id,
    name: `Clip ${id}`,
    type: "video",
    trackId: "track1",
    resourceId: id,
    resourceSrc: `video_${id}.mp4`,
    startTime,
    duration,
    trimStart,
    trimEnd: trimEnd ?? trimStart + duration,
    position: { x: 0.5, y: 0.5 },
    scale: 1.0,
    rotation: 0,
    opacity: 1.0,
    volume: 1.0,
  };
}

describe("VideoSyncManager", () => {
  let resourceLoader: MockResourceLoader;
  let videoSyncManager: VideoSyncManager;

  beforeEach(() => {
    resourceLoader = new MockResourceLoader();
    videoSyncManager = new VideoSyncManager(
      resourceLoader as unknown as ResourceLoader,
      {
        seekTolerance: 0.1,
        seekThrottle: 50,
        debug: false,
      },
    );
  });

  describe("Basic Synchronization", () => {
    it("should synchronize video time for a visible clip", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();

      // Sync at timeline time 2s (should seek video to 2s)
      videoSyncManager.sync([clip], 2.0, false);

      expect(video.currentTime).toBeCloseTo(2.0, 1);
    });

    it("should apply trim offset to video time", () => {
      // Clip starts at 0s, duration 3s, but trim is [2s, 5s]
      const clip = createTestClip("clip1", 0, 3, 2, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();

      // At timeline time 0s, video should be at trim start (2s)
      videoSyncManager.sync([clip], 0.0, false);
      expect(video.currentTime).toBeCloseTo(2.0, 1);

      // At timeline time 1.5s, video should be at 3.5s (trimStart + localTime)
      // Use forceSeek to bypass tolerance
      videoSyncManager.forceSeek(1.5);
      expect(video.currentTime).toBeCloseTo(3.5, 1);

      // At timeline time 2.5s, video should be at 4.5s
      videoSyncManager.forceSeek(2.5);
      expect(video.currentTime).toBeCloseTo(4.5, 1);
    });

    it("should clamp video time to trim bounds", () => {
      const clip = createTestClip("clip1", 0, 5, 2, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();

      // Try to seek before trim start
      videoSyncManager.sync([clip], -1.0, false);
      expect(video.currentTime).toBeCloseTo(2.0, 1); // clamped to trimStart

      // Try to seek after trim end (localTime 3 = videoTime 5, clamped to 5)
      // Use forceSeek to bypass tolerance
      videoSyncManager.forceSeek(3.0);
      expect(video.currentTime).toBeCloseTo(5.0, 1); // clamped to trimEnd
    });

    it("should handle clips with offset start times", () => {
      // Clip starts at 5s on timeline
      const clip = createTestClip("clip1", 5, 3, 0, 3);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();

      // At timeline time 5s (clip start), video should be at 0s
      videoSyncManager.sync([clip], 5.0, false);
      expect(video.currentTime).toBeCloseTo(0.0, 1);

      // At timeline time 7s, video should be at 2s (localTime = 7 - 5 = 2)
      videoSyncManager.sync([clip], 7.0, false);
      expect(video.currentTime).toBeCloseTo(2.0, 1);
    });
  });

  describe("Seek Tolerance", () => {
    it("should skip seeks within tolerance", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      video.currentTime = 2.0;

      // Seek to 2.05s (within 0.1s tolerance) - should be skipped
      videoSyncManager.sync([clip], 2.05, false);
      expect(video.currentTime).toBeCloseTo(2.0, 1); // unchanged

      const stats = videoSyncManager.getStats();
      expect(stats.skippedSeeks).toBeGreaterThan(0);
    });

    it("should perform seeks outside tolerance", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      video.currentTime = 2.0;

      // Seek to 3.0s (outside 0.1s tolerance) - should perform seek
      videoSyncManager.sync([clip], 3.0, false);
      expect(video.currentTime).toBeCloseTo(3.0, 1);

      const stats = videoSyncManager.getStats();
      expect(stats.seekCount).toBeGreaterThan(0);
    });
  });

  describe("Play/Pause Synchronization", () => {
    it("should play video when player is playing", async () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      const playSpy = vi.spyOn(video, "play").mockResolvedValue();

      // Sync with isPlaying = true
      videoSyncManager.sync([clip], 1.0, true);

      // Wait a bit for async play call
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(playSpy).toHaveBeenCalled();
    });

    it("should pause video when player is paused", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      const pauseSpy = vi.spyOn(video, "pause");

      // First sync as playing
      vi.spyOn(video, "play").mockResolvedValue();
      videoSyncManager.sync([clip], 1.0, true);

      // Mock video as playing
      Object.defineProperty(video, "paused", { value: false, writable: true });

      // Then sync as paused
      videoSyncManager.sync([clip], 1.5, false);

      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  describe("Multiple Clips", () => {
    it("should synchronize multiple visible clips", () => {
      const clip1 = createTestClip("clip1", 0, 5, 0, 5);
      const clip2 = createTestClip("clip2", 2, 3, 1, 4);

      const texture1 = new MockVideoTexture();
      const texture2 = new MockVideoTexture();

      resourceLoader.addTexture(
        clip1.resourceSrc!,
        texture1 as unknown as VideoTexture,
      );
      resourceLoader.addTexture(
        clip2.resourceSrc!,
        texture2 as unknown as VideoTexture,
      );

      const video1 = texture1.getVideo();
      const video2 = texture2.getVideo();

      // At timeline 3s:
      // - clip1: localTime = 3, videoTime = 3
      // - clip2: localTime = 1, videoTime = 2 (trimStart 1 + localTime 1)
      videoSyncManager.sync([clip1, clip2], 3.0, false);

      expect(video1.currentTime).toBeCloseTo(3.0, 1);
      expect(video2.currentTime).toBeCloseTo(2.0, 1);
    });

    it("should stop tracking clips that become invisible", () => {
      const clip1 = createTestClip("clip1", 0, 5, 0, 5);
      const clip2 = createTestClip("clip2", 2, 3, 0, 3);

      const texture1 = new MockVideoTexture();
      const texture2 = new MockVideoTexture();

      resourceLoader.addTexture(
        clip1.resourceSrc!,
        texture1 as unknown as VideoTexture,
      );
      resourceLoader.addTexture(
        clip2.resourceSrc!,
        texture2 as unknown as VideoTexture,
      );

      // Both clips visible
      videoSyncManager.sync([clip1, clip2], 3.0, false);
      expect(videoSyncManager.getTrackedVideoCount()).toBe(2);

      // Only clip1 visible
      videoSyncManager.sync([clip1], 1.0, false);
      expect(videoSyncManager.getTrackedVideoCount()).toBe(1);

      // No clips visible
      videoSyncManager.sync([], 10.0, false);
      expect(videoSyncManager.getTrackedVideoCount()).toBe(0);
    });

    it("should pause invisible videos", () => {
      const clip1 = createTestClip("clip1", 0, 5, 0, 5);
      const texture1 = new MockVideoTexture();
      resourceLoader.addTexture(
        clip1.resourceSrc!,
        texture1 as unknown as VideoTexture,
      );

      const video1 = texture1.getVideo();
      const pauseSpy = vi.spyOn(video1, "pause");

      // Mock video as playing
      Object.defineProperty(video1, "paused", { value: false, writable: true });

      // Make clip visible first
      videoSyncManager.sync([clip1], 2.0, true);

      // Now remove from visible clips (becomes invisible)
      videoSyncManager.sync([], 10.0, true);

      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  describe("Force Seek", () => {
    it("should force seek all tracked videos immediately", () => {
      const clip1 = createTestClip("clip1", 0, 5, 0, 5);
      const clip2 = createTestClip("clip2", 2, 3, 1, 4);

      const texture1 = new MockVideoTexture();
      const texture2 = new MockVideoTexture();

      resourceLoader.addTexture(
        clip1.resourceSrc!,
        texture1 as unknown as VideoTexture,
      );
      resourceLoader.addTexture(
        clip2.resourceSrc!,
        texture2 as unknown as VideoTexture,
      );

      const video1 = texture1.getVideo();
      const video2 = texture2.getVideo();

      // Track both clips
      videoSyncManager.sync([clip1, clip2], 1.0, false);

      // Force seek to timeline 4s
      videoSyncManager.forceSeek(4.0);

      // clip1: localTime = 4, videoTime = 4
      // clip2: localTime = 2, videoTime = 3 (trimStart 1 + localTime 2)
      expect(video1.currentTime).toBeCloseTo(4.0, 1);
      expect(video2.currentTime).toBeCloseTo(3.0, 1);
    });

    it("should bypass seek tolerance on force seek", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      video.currentTime = 2.0;

      videoSyncManager.sync([clip], 2.0, false);

      // Force seek to 2.05s (within tolerance, but should still seek)
      videoSyncManager.forceSeek(2.05);

      expect(video.currentTime).toBeCloseTo(2.05, 1);
    });
  });

  describe("Batch Operations", () => {
    it("should pause all videos", () => {
      const clip1 = createTestClip("clip1", 0, 5, 0, 5);
      const clip2 = createTestClip("clip2", 2, 3, 0, 3);

      const texture1 = new MockVideoTexture();
      const texture2 = new MockVideoTexture();

      resourceLoader.addTexture(
        clip1.resourceSrc!,
        texture1 as unknown as VideoTexture,
      );
      resourceLoader.addTexture(
        clip2.resourceSrc!,
        texture2 as unknown as VideoTexture,
      );

      const video1 = texture1.getVideo();
      const video2 = texture2.getVideo();

      const pauseSpy1 = vi.spyOn(video1, "pause");
      const pauseSpy2 = vi.spyOn(video2, "pause");

      // Mock videos as playing
      Object.defineProperty(video1, "paused", { value: false, writable: true });
      Object.defineProperty(video2, "paused", { value: false, writable: true });

      // Track clips
      videoSyncManager.sync([clip1, clip2], 3.0, true);

      // Pause all
      videoSyncManager.pauseAll();

      expect(pauseSpy1).toHaveBeenCalled();
      expect(pauseSpy2).toHaveBeenCalled();
    });

    it("should play all videos", async () => {
      const clip1 = createTestClip("clip1", 0, 5, 0, 5);
      const clip2 = createTestClip("clip2", 2, 3, 0, 3);

      const texture1 = new MockVideoTexture();
      const texture2 = new MockVideoTexture();

      resourceLoader.addTexture(
        clip1.resourceSrc!,
        texture1 as unknown as VideoTexture,
      );
      resourceLoader.addTexture(
        clip2.resourceSrc!,
        texture2 as unknown as VideoTexture,
      );

      const video1 = texture1.getVideo();
      const video2 = texture2.getVideo();

      const playSpy1 = vi.spyOn(video1, "play").mockResolvedValue();
      const playSpy2 = vi.spyOn(video2, "play").mockResolvedValue();

      // Track clips
      videoSyncManager.sync([clip1, clip2], 3.0, false);

      // Play all
      videoSyncManager.playAll();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(playSpy1).toHaveBeenCalled();
      expect(playSpy2).toHaveBeenCalled();
    });
  });

  describe("Statistics", () => {
    it("should track sync operations", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      videoSyncManager.sync([clip], 1.0, false);
      videoSyncManager.sync([clip], 2.0, false);
      videoSyncManager.sync([clip], 3.0, false);

      const stats = videoSyncManager.getStats();
      expect(stats.syncCount).toBe(3);
      expect(stats.trackedVideos).toBe(1);
    });

    it("should track seek operations", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      video.currentTime = 0;

      // Perform seeks outside tolerance using forceSeek to ensure they happen
      videoSyncManager.sync([clip], 0.0, false);
      videoSyncManager.forceSeek(1.5); // Force seek
      videoSyncManager.forceSeek(3.0); // Force seek

      const stats = videoSyncManager.getStats();
      expect(stats.seekCount).toBeGreaterThanOrEqual(2); // First and subsequent seeks
    });

    it("should reset statistics", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      videoSyncManager.sync([clip], 1.0, false);
      videoSyncManager.sync([clip], 2.0, false);

      let stats = videoSyncManager.getStats();
      expect(stats.syncCount).toBeGreaterThan(0);

      videoSyncManager.resetStats();

      stats = videoSyncManager.getStats();
      expect(stats.syncCount).toBe(0);
      expect(stats.seekCount).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing texture gracefully", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      // Don't add texture to resource loader

      expect(() => {
        videoSyncManager.sync([clip], 1.0, false);
      }).not.toThrow();

      expect(videoSyncManager.getTrackedVideoCount()).toBe(0);
    });

    it("should handle missing video element gracefully", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = {
        getVideo: () => null,
        getDuration: () => 10,
        width: 1920,
        height: 1080,
      };
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      expect(() => {
        videoSyncManager.sync([clip], 1.0, false);
      }).not.toThrow();
    });

    it("should handle non-video clips", () => {
      const imageClip: Clip = {
        ...createTestClip("clip1", 0, 5, 0, 5),
        type: "image",
      };

      expect(() => {
        videoSyncManager.sync([imageClip], 1.0, false);
      }).not.toThrow();

      expect(videoSyncManager.getTrackedVideoCount()).toBe(0);
    });

    it("should handle zero duration clips", () => {
      const clip = createTestClip("clip1", 0, 0, 0, 0);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      expect(() => {
        videoSyncManager.sync([clip], 0.0, false);
      }).not.toThrow();
    });
  });

  describe("Configuration", () => {
    it("should use custom seek tolerance", () => {
      const manager = new VideoSyncManager(
        resourceLoader as unknown as ResourceLoader,
        {
          seekTolerance: 0.5, // Large tolerance
          seekThrottle: 50,
          debug: false,
        },
      );

      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      video.currentTime = 2.0;

      // Seek to 2.4s (within 0.5s tolerance) - should be skipped
      manager.sync([clip], 2.4, false);
      expect(video.currentTime).toBeCloseTo(2.0, 1);

      const stats = manager.getStats();
      expect(stats.skippedSeeks).toBeGreaterThan(0);
    });

    it("should allow config updates", () => {
      videoSyncManager.updateConfig({
        seekTolerance: 0.5,
      });

      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      const video = texture.getVideo();
      video.currentTime = 2.0;

      // With new tolerance, this should be skipped
      videoSyncManager.sync([clip], 2.4, false);
      expect(video.currentTime).toBeCloseTo(2.0, 1);
    });
  });

  describe("Disposal", () => {
    it("should clean up on dispose", () => {
      const clip = createTestClip("clip1", 0, 5, 0, 5);
      const texture = new MockVideoTexture();
      resourceLoader.addTexture(
        clip.resourceSrc!,
        texture as unknown as VideoTexture,
      );

      // Mock the video play method
      const video = texture.getVideo();
      vi.spyOn(video, "play").mockResolvedValue();

      videoSyncManager.sync([clip], 1.0, true);
      expect(videoSyncManager.getTrackedVideoCount()).toBe(1);

      videoSyncManager.dispose();
      expect(videoSyncManager.getTrackedVideoCount()).toBe(0);

      const stats = videoSyncManager.getStats();
      expect(stats.trackedVideos).toBe(0);
    });
  });
});
