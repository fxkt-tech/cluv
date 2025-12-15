/**
 * TrimSupport.test.ts
 *
 * Tests for video trim support in shaders and SceneBuilder
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SceneBuilder } from "./SceneBuilder";
import type { Track, Clip } from "../../editor/types/timeline";
import { SceneManager } from "../scene/SceneManager";
import { ResourceLoader } from "./ResourceLoader";
import type { VideoTexture } from "../texture/VideoTexture";
import type { WebGLContextManager } from "../core/WebGLContext";

// Mock ResourceLoader
vi.mock("./ResourceLoader");

// Mock texture for testing
const createMockTexture = (): VideoTexture => {
  return {
    getTexture: vi.fn(() => null),
    getDuration: vi.fn(() => 10.0),
    getCurrentTime: vi.fn(() => 0),
    setCurrentTime: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    isPlaying: vi.fn(() => false),
    isReady: vi.fn(() => true),
    width: 1920,
    height: 1080,
    getVideoElement: vi.fn(() => null),
    update: vi.fn(),
    dispose: vi.fn(),
  } as unknown as VideoTexture;
};

describe("Trim Support", () => {
  let sceneManager: SceneManager;
  let resourceLoader: ResourceLoader;
  let contextManager: WebGLContextManager;
  let sceneBuilder: SceneBuilder;
  let mockTexture: VideoTexture;

  beforeEach(() => {
    // Create scene manager
    sceneManager = new SceneManager({
      width: 1920,
      height: 1080,
      frameRate: 30,
      backgroundColor: "#000000",
    });

    // Create mock resource loader
    mockTexture = createMockTexture();
    resourceLoader = {
      getTexture: vi.fn(() => mockTexture),
      loadVideo: vi.fn(),
      release: vi.fn(),
      getResourceInfo: vi.fn(),
      getStats: vi.fn(() => ({
        loadedCount: 1,
        totalSize: 1024,
        cacheHitRate: 1.0,
      })),
      clear: vi.fn(),
      dispose: vi.fn(),
    } as unknown as ResourceLoader;

    // Create mock context manager
    contextManager = {
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

    // Create scene builder
    sceneBuilder = new SceneBuilder(
      sceneManager,
      resourceLoader,
      contextManager,
      {
        canvasWidth: 1920,
        canvasHeight: 1080,
        debug: false,
      },
    );
  });

  describe("Uniform Setting", () => {
    it("should set trim uniforms on video nodes", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 5.0,
            trimStart: 2.0,
            trimEnd: 7.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      // Build scene at time 2.5 (2.5 seconds into the clip)
      const result = sceneBuilder.buildScene([track], 2.5);

      expect(result.visibleClipCount).toBe(1);
      expect(result.nodeCount).toBe(1);

      // Get the node and check uniforms
      const node = sceneBuilder.getNodeForClip("clip1");
      expect(node).toBeDefined();

      if (node) {
        const uniforms = node.getCustomUniforms();
        expect(uniforms).toHaveProperty("u_trimStart", 2.0);
        expect(uniforms).toHaveProperty("u_trimEnd", 7.0);
        expect(uniforms).toHaveProperty("u_clipTime", 2.5); // localTime
        expect(uniforms).toHaveProperty("u_clipDuration", 5.0);
      }
    });

    it("should update trim uniforms when clip time changes", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 1.0,
            duration: 4.0,
            trimStart: 1.0,
            trimEnd: 5.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      // Build scene at time 1.0 (start of clip)
      sceneBuilder.buildScene([track], 1.0);
      let node = sceneBuilder.getNodeForClip("clip1");
      let uniforms = node?.getCustomUniforms();
      expect(uniforms?.u_clipTime).toBe(0);

      // Build scene at time 3.0 (2 seconds into clip)
      sceneBuilder.buildScene([track], 3.0);
      node = sceneBuilder.getNodeForClip("clip1");
      uniforms = node?.getCustomUniforms();
      expect(uniforms?.u_clipTime).toBe(2.0);

      // Build scene at time 4.5 (3.5 seconds into clip)
      sceneBuilder.buildScene([track], 4.5);
      node = sceneBuilder.getNodeForClip("clip1");
      uniforms = node?.getCustomUniforms();
      expect(uniforms?.u_clipTime).toBe(3.5);
    });

    it("should handle clips with no trim (full video)", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 10.0,
            trimStart: 0,
            trimEnd: 10.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      sceneBuilder.buildScene([track], 5.0);
      const node = sceneBuilder.getNodeForClip("clip1");
      const uniforms = node?.getCustomUniforms();

      expect(uniforms?.u_trimStart).toBe(0);
      expect(uniforms?.u_trimEnd).toBe(10.0);
      expect(uniforms?.u_clipTime).toBe(5.0);
      expect(uniforms?.u_clipDuration).toBe(10.0);
    });
  });

  describe("Trim Edge Cases", () => {
    it("should handle trim at the very start of video", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 3.0,
            trimStart: 0,
            trimEnd: 3.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      sceneBuilder.buildScene([track], 0);
      const node = sceneBuilder.getNodeForClip("clip1");
      const uniforms = node?.getCustomUniforms();

      expect(uniforms?.u_trimStart).toBe(0);
      expect(uniforms?.u_clipTime).toBe(0);
    });

    it("should handle trim at the very end of video", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 2.0,
            trimStart: 8.0,
            trimEnd: 10.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      sceneBuilder.buildScene([track], 1.5);
      const node = sceneBuilder.getNodeForClip("clip1");
      const uniforms = node?.getCustomUniforms();

      expect(uniforms?.u_trimStart).toBe(8.0);
      expect(uniforms?.u_trimEnd).toBe(10.0);
      expect(uniforms?.u_clipTime).toBe(1.5);
    });

    it("should handle very small trim ranges", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 0.5,
            trimStart: 5.0,
            trimEnd: 5.5,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      sceneBuilder.buildScene([track], 0.25);
      const node = sceneBuilder.getNodeForClip("clip1");
      const uniforms = node?.getCustomUniforms();

      expect(uniforms?.u_trimStart).toBe(5.0);
      expect(uniforms?.u_trimEnd).toBe(5.5);
      expect(uniforms?.u_clipDuration).toBe(0.5);
      expect(uniforms?.u_clipTime).toBe(0.25);
    });
  });

  describe("Multiple Clips with Different Trims", () => {
    it("should handle multiple clips with different trim settings", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 2.0,
            trimStart: 0,
            trimEnd: 2.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
          {
            id: "clip2",
            type: "video",
            trackId: "track1",
            startTime: 2.0,
            duration: 3.0,
            trimStart: 5.0,
            trimEnd: 8.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video2.mp4",
          } as Clip,
        ],
      };

      // At time 1.0, only clip1 should be visible
      sceneBuilder.buildScene([track], 1.0);
      let node1 = sceneBuilder.getNodeForClip("clip1");
      let node2 = sceneBuilder.getNodeForClip("clip2");
      expect(node1).toBeDefined();
      expect(node2).toBeUndefined();

      let uniforms = node1?.getCustomUniforms();
      expect(uniforms?.u_trimStart).toBe(0);
      expect(uniforms?.u_trimEnd).toBe(2.0);
      expect(uniforms?.u_clipTime).toBe(1.0);

      // At time 3.5, only clip2 should be visible
      sceneBuilder.buildScene([track], 3.5);
      node1 = sceneBuilder.getNodeForClip("clip1");
      node2 = sceneBuilder.getNodeForClip("clip2");
      expect(node1).toBeDefined(); // Still exists, just not visible in layer
      expect(node2).toBeDefined();

      uniforms = node2?.getCustomUniforms();
      expect(uniforms?.u_trimStart).toBe(5.0);
      expect(uniforms?.u_trimEnd).toBe(8.0);
      expect(uniforms?.u_clipTime).toBe(1.5); // 3.5 - 2.0 = 1.5
    });
  });

  describe("Trim Calculations", () => {
    it("should calculate correct video time from trim and clip time", () => {
      // This test verifies the mathematical relationship:
      // videoTime = trimStart + clipTime
      // where clipTime is the time relative to the clip's start

      const testCases = [
        {
          trimStart: 2.0,
          trimEnd: 7.0,
          clipStartTime: 0,
          currentTime: 1.5,
          expectedClipTime: 1.5,
          expectedVideoTime: 3.5, // 2.0 + 1.5
        },
        {
          trimStart: 5.0,
          trimEnd: 10.0,
          clipStartTime: 2.0,
          currentTime: 4.0,
          expectedClipTime: 2.0,
          expectedVideoTime: 7.0, // 5.0 + 2.0
        },
        {
          trimStart: 0,
          trimEnd: 5.0,
          clipStartTime: 1.0,
          currentTime: 3.5,
          expectedClipTime: 2.5,
          expectedVideoTime: 2.5, // 0 + 2.5
        },
      ];

      for (const testCase of testCases) {
        const track: Track = {
          id: "track1",
          name: "Video Track",
          type: "video",
          order: 0,
          visible: true,
          locked: false,
          muted: false,
          clips: [
            {
              id: "clip1",
              type: "video",
              trackId: "track1",
              startTime: testCase.clipStartTime,
              duration: testCase.trimEnd - testCase.trimStart,
              trimStart: testCase.trimStart,
              trimEnd: testCase.trimEnd,
              position: { x: 0.5, y: 0.5 },
              scale: 1.0,
              rotation: 0,
              opacity: 1.0,
              resourceSrc: "video1.mp4",
            } as Clip,
          ],
        };

        sceneBuilder.buildScene([track], testCase.currentTime);
        const node = sceneBuilder.getNodeForClip("clip1");
        const uniforms = node?.getCustomUniforms();

        expect(uniforms?.u_clipTime).toBeCloseTo(testCase.expectedClipTime);
        expect(uniforms?.u_trimStart).toBe(testCase.trimStart);

        // Calculate expected video time (this would be done in app layer)
        const calculatedVideoTime =
          testCase.trimStart + testCase.expectedClipTime;
        expect(calculatedVideoTime).toBeCloseTo(testCase.expectedVideoTime);
      }
    });

    it("should handle trim duration calculation", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 0,
            duration: 5.0,
            trimStart: 3.0,
            trimEnd: 8.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      sceneBuilder.buildScene([track], 2.5);
      const node = sceneBuilder.getNodeForClip("clip1");
      const uniforms = node?.getCustomUniforms();

      // Trim duration = trimEnd - trimStart = 8.0 - 3.0 = 5.0
      const trimDuration = uniforms!.u_trimEnd - uniforms!.u_trimStart;
      expect(trimDuration).toBe(5.0);

      // Clip duration should match trim duration
      expect(uniforms?.u_clipDuration).toBe(5.0);
    });
  });

  describe("Trim Visibility", () => {
    it("should not render clip before its start time", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 5.0,
            duration: 3.0,
            trimStart: 2.0,
            trimEnd: 5.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      // Before clip starts
      const result = sceneBuilder.buildScene([track], 3.0);
      expect(result.visibleClipCount).toBe(0);
    });

    it("should not render clip after its end time", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 2.0,
            duration: 3.0,
            trimStart: 1.0,
            trimEnd: 4.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      // After clip ends (startTime + duration = 2.0 + 3.0 = 5.0)
      const result = sceneBuilder.buildScene([track], 5.0);
      expect(result.visibleClipCount).toBe(0);
    });

    it("should render clip exactly at boundary times", () => {
      const track: Track = {
        id: "track1",
        name: "Video Track",
        type: "video",
        order: 0,
        visible: true,
        locked: false,
        muted: false,
        clips: [
          {
            id: "clip1",
            type: "video",
            trackId: "track1",
            startTime: 2.0,
            duration: 3.0,
            trimStart: 1.0,
            trimEnd: 4.0,
            position: { x: 0.5, y: 0.5 },
            scale: 1.0,
            rotation: 0,
            opacity: 1.0,
            resourceSrc: "video1.mp4",
          } as Clip,
        ],
      };

      // Exactly at start
      let result = sceneBuilder.buildScene([track], 2.0);
      expect(result.visibleClipCount).toBe(1);

      // Just before end (exclusive end)
      result = sceneBuilder.buildScene([track], 4.999);
      expect(result.visibleClipCount).toBe(1);
    });
  });
});
