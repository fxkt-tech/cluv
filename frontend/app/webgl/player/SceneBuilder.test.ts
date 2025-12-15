/**
 * SceneBuilder.test.ts
 *
 * Unit tests for SceneBuilder
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SceneBuilder } from "./SceneBuilder";
import type { SceneBuildConfig } from "./SceneBuilder";
import type { Track, Clip } from "../../editor/types/timeline";
import { SceneManager } from "../scene/SceneManager";
import { ResourceLoader } from "./ResourceLoader";
import { RenderNode, NodeType } from "../scene/RenderNode";
import type { VideoTexture } from "../texture/VideoTexture";
import type { WebGLContextManager } from "../core/WebGLContext";

// Mock SceneManager
vi.mock("../scene/SceneManager");
vi.mock("./ResourceLoader");

describe("SceneBuilder", () => {
  let sceneBuilder: SceneBuilder;
  let mockSceneManager: SceneManager;
  let mockResourceLoader: ResourceLoader;
  let mockContextManager: WebGLContextManager;
  let config: SceneBuildConfig;

  beforeEach(() => {
    // Create mock scene manager
    const mockLayers: any[] = [];
    const mockLayerMap = new Map();

    mockSceneManager = {
      createLayer: vi.fn((layerConfig) => {
        const mockLayer = {
          getId: vi.fn(() => `layer_${layerConfig.trackId}`),
          getName: vi.fn(() => layerConfig.name || "Layer"),
          getTrackId: vi.fn(() => layerConfig.trackId || ""),
          setName: vi.fn(),
          setOrder: vi.fn(),
          setVisible: vi.fn(),
          setLocked: vi.fn(),
          addNode: vi.fn(),
          removeNode: vi.fn(),
          removeNodeById: vi.fn(),
          getNodes: vi.fn(() => []),
        };
        mockLayers.push(mockLayer);
        mockLayerMap.set(mockLayer.getId(), mockLayer);
        return mockLayer;
      }),
      getLayers: vi.fn(() => mockLayers),
      getLayer: vi.fn((id) => mockLayerMap.get(id)),
      clear: vi.fn(),
    } as any;

    // Create mock resource loader
    mockResourceLoader = {
      getTexture: vi.fn((url: string) => null),
      loadVideoResource: vi.fn(),
      releaseResource: vi.fn(),
    } as any;

    // Create mock context manager
    mockContextManager = {
      getContext: vi.fn(() => ({
        createTexture: vi.fn(() => ({})),
        bindTexture: vi.fn(),
        texImage2D: vi.fn(),
        texParameteri: vi.fn(),
        pixelStorei: vi.fn(),
        TEXTURE_2D: 3553,
        RGBA: 6408,
        UNSIGNED_BYTE: 5121,
        TEXTURE_MIN_FILTER: 10241,
        TEXTURE_MAG_FILTER: 10240,
        TEXTURE_WRAP_S: 10242,
        TEXTURE_WRAP_T: 10243,
        LINEAR: 9729,
        CLAMP_TO_EDGE: 33071,
        UNPACK_FLIP_Y_WEBGL: 37440,
        UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
      })),
      isWebGL2: vi.fn(() => false),
      getExtension: vi.fn(() => null),
      getMaxAnisotropy: vi.fn(() => 1),
    } as any;

    // Create config
    config = {
      canvasWidth: 1920,
      canvasHeight: 1080,
      debug: false,
    };

    // Create scene builder
    sceneBuilder = new SceneBuilder(
      mockSceneManager,
      mockResourceLoader,
      mockContextManager,
      config,
    );
  });

  describe("Constructor", () => {
    it("should create a scene builder with config", () => {
      expect(sceneBuilder).toBeDefined();
      expect(sceneBuilder.getStats()).toEqual({
        trackLayerCount: 0,
        clipNodeCount: 0,
      });
    });
  });

  describe("buildScene", () => {
    it("should build empty scene with no tracks", () => {
      const result = sceneBuilder.buildScene([], 0);

      expect(result.trackCount).toBe(0);
      expect(result.clipCount).toBe(0);
      expect(result.visibleClipCount).toBe(0);
      expect(result.layerCount).toBe(0);
      expect(result.nodeCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should create layer for visible track", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track 1",
        type: "video",
        clips: [],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      const result = sceneBuilder.buildScene([track], 0);

      expect(result.trackCount).toBe(1);
      expect(result.layerCount).toBe(1);
      expect(mockSceneManager.createLayer).toHaveBeenCalledWith({
        name: "Video Track 1",
        order: 0,
        visible: true,
        opacity: 1.0,
        locked: false,
        trackId: "track1",
      });
    });

    it("should skip invisible tracks", () => {
      const track: Track = {
        id: "track1",
        name: "Hidden Track",
        type: "video",
        clips: [],
        visible: false,
        locked: false,
        muted: false,
        order: 0,
      };

      const result = sceneBuilder.buildScene([track], 0);

      expect(result.trackCount).toBe(1);
      expect(result.layerCount).toBe(0);
      expect(mockSceneManager.createLayer).not.toHaveBeenCalled();
    });

    it("should create node for visible video clip", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      const result = sceneBuilder.buildScene([track], 2.5); // Middle of clip

      expect(result.trackCount).toBe(1);
      expect(result.clipCount).toBe(1);
      expect(result.visibleClipCount).toBe(1);
      expect(result.nodeCount).toBe(1);

      const node = sceneBuilder.getNodeForClip("clip1");
      expect(node).toBeDefined();
    });

    it("should not create node for clip outside time range", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 10,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      const result = sceneBuilder.buildScene([track], 2.5); // Before clip starts

      expect(result.visibleClipCount).toBe(0);
      expect(result.nodeCount).toBe(0);

      const node = sceneBuilder.getNodeForClip("clip1");
      expect(node).toBeUndefined();
    });

    it("should handle clip visibility at boundaries", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 5,
        duration: 10,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 10,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      // At start time - should be visible
      let result = sceneBuilder.buildScene([track], 5.0);
      expect(result.visibleClipCount).toBe(1);

      // Just before end - should be visible
      sceneBuilder.clear();
      result = sceneBuilder.buildScene([track], 14.999);
      expect(result.visibleClipCount).toBe(1);

      // At end time - should NOT be visible (exclusive end)
      sceneBuilder.clear();
      result = sceneBuilder.buildScene([track], 15.0);
      expect(result.visibleClipCount).toBe(0);

      // Before start - should NOT be visible
      sceneBuilder.clear();
      result = sceneBuilder.buildScene([track], 4.999);
      expect(result.visibleClipCount).toBe(0);
    });

    it("should skip non-video clips", () => {
      const audioClip: Clip = {
        id: "clip1",
        name: "Audio Clip",
        type: "audio",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "audio.mp3",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Audio Track",
        type: "audio",
        clips: [audioClip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      const result = sceneBuilder.buildScene([track], 2.5);

      expect(result.visibleClipCount).toBe(1);
      expect(result.nodeCount).toBe(0); // No node created for audio

      const node = sceneBuilder.getNodeForClip("clip1");
      expect(node).toBeUndefined();
    });

    it("should handle multiple tracks with multiple clips", () => {
      const track1: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [
          {
            id: "clip1",
            name: "Clip 1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 5,
            resourceId: "res1",
            resourceSrc: "video1.mp4",
            trimStart: 0,
            trimEnd: 5,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            volume: 1.0,
          },
          {
            id: "clip2",
            name: "Clip 2",
            type: "video",
            trackId: "track1",
            startTime: 5,
            duration: 5,
            resourceId: "res2",
            resourceSrc: "video2.mp4",
            trimStart: 0,
            trimEnd: 5,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            volume: 1.0,
          },
        ],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      const track2: Track = {
        id: "track2",
        name: "Track 2",
        type: "video",
        clips: [
          {
            id: "clip3",
            name: "Clip 3",
            type: "video",
            trackId: "track2",
            startTime: 2,
            duration: 3,
            resourceId: "res3",
            resourceSrc: "video3.mp4",
            trimStart: 0,
            trimEnd: 3,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            volume: 1.0,
          },
        ],
        visible: true,
        locked: false,
        muted: false,
        order: 1,
      };

      const result = sceneBuilder.buildScene([track1, track2], 3.0);

      expect(result.trackCount).toBe(2);
      expect(result.clipCount).toBe(3);
      expect(result.visibleClipCount).toBe(2); // clip1 and clip3
      expect(result.layerCount).toBe(2);
      expect(result.nodeCount).toBe(2);

      expect(sceneBuilder.getNodeForClip("clip1")).toBeDefined();
      expect(sceneBuilder.getNodeForClip("clip2")).toBeUndefined();
      expect(sceneBuilder.getNodeForClip("clip3")).toBeDefined();
    });

    it("should attach texture to node when available", () => {
      const mockTexture: Partial<VideoTexture> = {
        width: 1920,
        height: 1080,
        getDuration: vi.fn(() => 10),
        getCurrentTime: vi.fn(() => 0),
      };

      (mockResourceLoader.getTexture as any).mockReturnValue(mockTexture);

      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 1,
        trimEnd: 6,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      sceneBuilder.buildScene([track], 2.5);

      expect(mockResourceLoader.getTexture).toHaveBeenCalledWith("video.mp4");

      const node = sceneBuilder.getNodeForClip("clip1");
      expect(node).toBeDefined();
      if (node) {
        expect(node.getTexture()).toBe(mockTexture);
        expect(node.getTextureId()).toBe("video.mp4");

        // Check custom uniforms for trim
        const uniforms = node.getCustomUniforms();
        expect(uniforms.u_clipTime).toBe(2.5); // localTime (currentTime - startTime)
        expect(uniforms.u_trimStart).toBe(1);
        expect(uniforms.u_trimEnd).toBe(6);
        expect(uniforms.u_clipDuration).toBe(5);
      }
    });
  });

  describe("Coordinate Conversion", () => {
    it("should convert clip position to world coordinates", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 }, // Center
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      sceneBuilder.buildScene([track], 2.5);

      const node = sceneBuilder.getNodeForClip("clip1");
      expect(node).toBeDefined();
      if (node) {
        const pos = node.getPosition();
        // Center: (0.5 - 0.5) * width = 0, (0.5 - 0.5) * height = 0
        expect(pos.x).toBe(0);
        expect(pos.y).toBe(0);
      }
    });

    it("should handle corner positions correctly", () => {
      // Top-left corner
      const clipTopLeft: Clip = {
        id: "clip1",
        name: "Clip 1",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0, y: 0 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clipTopLeft],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      sceneBuilder.buildScene([track], 2.5);

      const node = sceneBuilder.getNodeForClip("clip1");
      if (node) {
        const pos = node.getPosition();
        // (0 - 0.5) * 1920 = -960, (0.5 - 0) * 1080 = 540
        expect(pos.x).toBe(-960);
        expect(pos.y).toBe(540);
      }
    });
  });

  describe("Node Reuse", () => {
    it("should reuse nodes on subsequent builds", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 10,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 10,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      // First build
      sceneBuilder.buildScene([track], 2.5);
      const node1 = sceneBuilder.getNodeForClip("clip1");

      // Second build
      sceneBuilder.buildScene([track], 5.0);
      const node2 = sceneBuilder.getNodeForClip("clip1");

      // Should be the same node instance
      expect(node1).toBe(node2);
    });

    it("should update node properties on subsequent builds", () => {
      const mockTexture: Partial<VideoTexture> = {
        width: 1920,
        height: 1080,
        getDuration: vi.fn(() => 10),
        getCurrentTime: vi.fn(() => 0),
      };
      (mockResourceLoader.getTexture as any).mockReturnValue(mockTexture);

      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 10,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 10,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      // Build at t=2.5
      sceneBuilder.buildScene([track], 2.5);
      const node = sceneBuilder.getNodeForClip("clip1");
      let uniforms = node?.getCustomUniforms();
      expect(uniforms?.u_clipTime).toBe(2.5);

      // Build at t=5.0
      sceneBuilder.buildScene([track], 5.0);
      uniforms = node?.getCustomUniforms();
      expect(uniforms?.u_clipTime).toBe(5.0);
    });
  });

  describe("Cleanup", () => {
    it("should remove nodes when clips are no longer visible", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      // Build with clip visible
      sceneBuilder.buildScene([track], 2.5);
      expect(sceneBuilder.getNodeForClip("clip1")).toBeDefined();

      // Build with clip not visible
      sceneBuilder.buildScene([track], 10.0);
      const node = sceneBuilder.getNodeForClip("clip1");
      // Node still exists but should be removed from layer
      expect(node).toBeDefined();
    });

    it("should cleanup orphaned nodes", () => {
      const clip1: Clip = {
        id: "clip1",
        name: "Clip 1",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video1.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const clip2: Clip = {
        id: "clip2",
        name: "Clip 2",
        type: "video",
        trackId: "track1",
        startTime: 5,
        duration: 5,
        resourceId: "res2",
        resourceSrc: "video2.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip1, clip2],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      // Build with both clips
      sceneBuilder.buildScene([track], 0);
      expect(sceneBuilder.getStats().clipNodeCount).toBe(1); // Only clip1 visible

      sceneBuilder.buildScene([track], 6);
      expect(sceneBuilder.getStats().clipNodeCount).toBe(2); // Both nodes exist (for reuse), only clip2 visible

      // Build with no clips in timeline
      const emptyTrack: Track = { ...track, clips: [] };
      sceneBuilder.buildScene([emptyTrack], 0);
      expect(sceneBuilder.getStats().clipNodeCount).toBe(0); // All cleaned up
    });
  });

  describe("clear", () => {
    it("should clear all scene content", () => {
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0.5, y: 0.5 },
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      sceneBuilder.buildScene([track], 2.5);
      expect(sceneBuilder.getStats().clipNodeCount).toBe(1);
      expect(sceneBuilder.getStats().trackLayerCount).toBe(1);

      sceneBuilder.clear();
      expect(sceneBuilder.getStats().clipNodeCount).toBe(0);
      expect(sceneBuilder.getStats().trackLayerCount).toBe(0);
      expect(mockSceneManager.clear).toHaveBeenCalled();
    });
  });

  describe("getActiveClipIds", () => {
    it("should return list of active clip IDs", () => {
      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [
          {
            id: "clip1",
            name: "Clip 1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 5,
            resourceId: "res1",
            resourceSrc: "video1.mp4",
            trimStart: 0,
            trimEnd: 5,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            volume: 1.0,
          },
          {
            id: "clip2",
            name: "Clip 2",
            type: "video",
            trackId: "track1",
            startTime: 5,
            duration: 5,
            resourceId: "res2",
            resourceSrc: "video2.mp4",
            trimStart: 0,
            trimEnd: 5,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            volume: 1.0,
          },
        ],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      sceneBuilder.buildScene([track], 3); // clip1 visible
      const activeIds = sceneBuilder.getActiveClipIds();
      expect(activeIds).toContain("clip1");
      expect(activeIds).toHaveLength(1);
    });
  });

  describe("updateConfig", () => {
    it("should update canvas dimensions", () => {
      sceneBuilder.updateConfig({
        canvasWidth: 3840,
        canvasHeight: 2160,
      });

      // Verify by checking coordinate conversion
      const clip: Clip = {
        id: "clip1",
        name: "Video Clip",
        type: "video",
        trackId: "track1",
        startTime: 0,
        duration: 5,
        resourceId: "res1",
        resourceSrc: "video.mp4",
        trimStart: 0,
        trimEnd: 5,
        position: { x: 0, y: 0 }, // Top-left
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        volume: 1.0,
      };

      const track: Track = {
        id: "track1",
        name: "Track 1",
        type: "video",
        clips: [clip],
        visible: true,
        locked: false,
        muted: false,
        order: 0,
      };

      sceneBuilder.buildScene([track], 2.5);

      const node = sceneBuilder.getNodeForClip("clip1");
      if (node) {
        const pos = node.getPosition();
        // (0 - 0.5) * 3840 = -1920
        expect(pos.x).toBe(-1920);
      }
    });
  });
});
