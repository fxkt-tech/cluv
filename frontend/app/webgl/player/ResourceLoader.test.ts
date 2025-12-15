/**
 * ResourceLoader.test.ts
 *
 * ResourceLoader 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ResourceLoader, ResourceLoadState } from "./ResourceLoader";
import type { TextureManager } from "../texture/TextureManager";
import type { VideoTexture } from "../texture/VideoTexture";
import type { Clip } from "../../editor/types/timeline";

// Helper function to create mock Clip
const createMockClip = (overrides: Partial<Clip> = {}): Clip => ({
  id: "clip-1",
  name: "Test Clip",
  type: "video",
  trackId: "track-1",
  startTime: 0,
  duration: 10,
  resourceId: "video-1",
  resourceSrc: "http://example.com/video.mp4",
  trimStart: 0,
  trimEnd: 10,
  position: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
  opacity: 1,
  volume: 1,
  ...overrides,
});

// Mock TextureManager
const createMockTextureManager = (): TextureManager => {
  const mockTexture = {
    getDuration: vi.fn().mockReturnValue(10.5),
    width: 1920,
    height: 1080,
    dispose: vi.fn(),
  } as unknown as VideoTexture;

  return {
    createVideoFromURL: vi.fn().mockResolvedValue({
      texture: mockTexture,
      cached: false,
      key: "video:test",
    }),
  } as unknown as TextureManager;
};

describe("ResourceLoader", () => {
  let loader: ResourceLoader;
  let mockTextureManager: TextureManager;

  beforeEach(() => {
    mockTextureManager = createMockTextureManager();
    loader = new ResourceLoader(mockTextureManager, false);
  });

  afterEach(() => {
    loader.dispose();
  });

  describe("构造函数", () => {
    it("应该成功创建 ResourceLoader 实例", () => {
      expect(loader).toBeDefined();
    });

    it("应该初始化统计信息为零", () => {
      const stats = loader.getStats();
      expect(stats.totalResources).toBe(0);
      expect(stats.loadedResources).toBe(0);
      expect(stats.loadingResources).toBe(0);
      expect(stats.errorResources).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });

    it("调试模式下应该输出日志", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const debugLoader = new ResourceLoader(mockTextureManager, true);

      expect(consoleSpy).toHaveBeenCalledWith("[ResourceLoader] Created");

      debugLoader.dispose();
      consoleSpy.mockRestore();
    });
  });

  describe("资源加载", () => {
    it("loadVideoTexture() 应该成功加载视频资源", async () => {
      const result = await loader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(result.success).toBe(true);
      expect(result.resource).toBeDefined();
      expect(result.resource?.id).toBe("video-1");
      expect(result.resource?.state).toBe(ResourceLoadState.LOADED);
    });

    it("加载成功后应该更新统计信息", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");

      const stats = loader.getStats();
      expect(stats.totalResources).toBe(1);
      expect(stats.loadedResources).toBe(1);
      expect(stats.loadingResources).toBe(0);
      expect(stats.cacheMisses).toBe(1);
    });

    it("加载成功后应该设置资源信息", async () => {
      const result = await loader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(result.resource?.duration).toBe(10.5);
      expect(result.resource?.width).toBe(1920);
      expect(result.resource?.height).toBe(1080);
      expect(result.resource?.texture).toBeDefined();
      expect(result.resource?.refCount).toBe(1);
    });

    it("重复加载同一资源应该使用缓存", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
      const result = await loader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(result.success).toBe(true);
      expect(result.resource?.refCount).toBe(2);

      const stats = loader.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it("加载失败时应该返回错误", async () => {
      const failTextureManager = {
        createVideoFromURL: vi.fn().mockResolvedValue({
          texture: null,
        }),
      } as unknown as TextureManager;

      const failLoader = new ResourceLoader(failTextureManager, false);

      const result = await failLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const stats = failLoader.getStats();
      expect(stats.errorResources).toBe(1);

      failLoader.dispose();
    });

    it("加载中的资源不应该重复加载", async () => {
      const slowTextureManager = {
        createVideoFromURL: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    texture: {
                      getDuration: () => 10,
                      width: 1920,
                      height: 1080,
                    },
                  }),
                100,
              ),
            ),
        ),
      } as unknown as TextureManager;

      const slowLoader = new ResourceLoader(slowTextureManager, false);

      const promise1 = slowLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );
      const result2 = await slowLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(result2.success).toBe(false);
      expect(result2.error).toContain("already loading");

      await promise1;
      slowLoader.dispose();
    });

    it("相同 URL 不同 ID 应该复用资源", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
      const result = await loader.loadVideoTexture(
        "video-2",
        "http://example.com/video.mp4",
      );

      expect(result.success).toBe(true);
      expect(result.resource?.id).toBe("video-2");

      const stats = loader.getStats();
      expect(stats.cacheHits).toBe(1);
    });
  });

  describe("预加载", () => {
    it("preloadResources() 应该加载多个资源", async () => {
      const clips: Clip[] = [
        createMockClip({
          id: "clip-1",
          resourceId: "video-1",
          resourceSrc: "http://example.com/video1.mp4",
        }),
        createMockClip({
          id: "clip-2",
          resourceId: "video-2",
          resourceSrc: "http://example.com/video2.mp4",
          startTime: 10,
        }),
      ];

      const results = await loader.preloadResources(clips);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      const stats = loader.getStats();
      expect(stats.loadedResources).toBe(2);
    });

    it("preloadResources() 应该过滤非视频资源", async () => {
      const clips: Clip[] = [
        createMockClip({
          id: "clip-1",
          resourceId: "video-1",
          resourceSrc: "http://example.com/video.mp4",
        }),
        createMockClip({
          id: "clip-2",
          resourceId: "audio-1",
          resourceSrc: "http://example.com/audio.mp3",
          type: "audio",
          trackId: "track-2",
        }),
      ];

      const results = await loader.preloadResources(clips);

      expect(results).toHaveLength(1);
      expect(results[0].resource?.id).toBe("video-1");
    });

    it("preloadResources() 应该忽略没有 resourceSrc 的资源", async () => {
      const clips: Clip[] = [
        createMockClip({
          id: "clip-1",
          resourceSrc: undefined,
        }),
      ];

      const results = await loader.preloadResources(clips);

      expect(results).toHaveLength(0);
    });
  });

  describe("资源访问", () => {
    beforeEach(async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
    });

    it("getResource() 应该返回资源信息", () => {
      const resource = loader.getResource("video-1");

      expect(resource).toBeDefined();
      expect(resource?.id).toBe("video-1");
    });

    it("getTexture() 应该返回视频纹理", () => {
      const texture = loader.getTexture("video-1");

      expect(texture).toBeDefined();
    });

    it("isLoaded() 应该返回正确的加载状态", () => {
      expect(loader.isLoaded("video-1")).toBe(true);
      expect(loader.isLoaded("video-2")).toBe(false);
    });

    it("getResourceIds() 应该返回所有资源 ID", () => {
      const ids = loader.getResourceIds();

      expect(ids).toContain("video-1");
      expect(ids).toHaveLength(1);
    });

    it("getLoadedResources() 应该返回所有已加载资源", () => {
      const resources = loader.getLoadedResources();

      expect(resources).toHaveLength(1);
      expect(resources[0].id).toBe("video-1");
    });
  });

  describe("资源释放", () => {
    beforeEach(async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
    });

    it("releaseResource() 应该减少引用计数", () => {
      loader.releaseResource("video-1");

      const resource = loader.getResource("video-1");
      expect(resource).toBeUndefined(); // 引用计数为 0 时自动卸载
    });

    it("releaseResource() 引用计数为 0 时应该自动卸载", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4"); // refCount = 2

      loader.releaseResource("video-1"); // refCount = 1
      expect(loader.getResource("video-1")).toBeDefined();

      loader.releaseResource("video-1"); // refCount = 0，自动卸载
      expect(loader.getResource("video-1")).toBeUndefined();
    });

    it("unloadResource() 应该卸载资源", () => {
      loader.unloadResource("video-1");

      expect(loader.getResource("video-1")).toBeUndefined();

      const stats = loader.getStats();
      expect(stats.totalResources).toBe(0);
      expect(stats.loadedResources).toBe(0);
    });

    it("pruneUnusedResources() 应该清理未使用资源", async () => {
      await loader.loadVideoTexture("video-2", "http://example.com/video2.mp4");

      loader.releaseResource("video-1");

      const prunedCount = loader.pruneUnusedResources();

      expect(prunedCount).toBe(1);
      expect(loader.getResource("video-1")).toBeUndefined();
      expect(loader.getResource("video-2")).toBeDefined();
    });

    it("dispose() 应该释放所有资源", async () => {
      await loader.loadVideoTexture("video-2", "http://example.com/video2.mp4");

      loader.dispose();

      expect(loader.getResourceCount()).toBe(0);

      const stats = loader.getStats();
      expect(stats.totalResources).toBe(0);
      expect(stats.loadedResources).toBe(0);
    });
  });

  describe("统计信息", () => {
    it("getStats() 应该返回统计信息", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4"); // cache hit

      const stats = loader.getStats();

      expect(stats.totalResources).toBe(1);
      expect(stats.loadedResources).toBe(1);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it("getCacheHitRate() 应该计算缓存命中率", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4"); // miss
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4"); // hit
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4"); // hit

      const hitRate = loader.getCacheHitRate();

      expect(hitRate).toBeCloseTo(2 / 3, 2);
    });

    it("getResourceCount() 应该返回资源数量", async () => {
      expect(loader.getResourceCount()).toBe(0);

      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
      expect(loader.getResourceCount()).toBe(1);

      await loader.loadVideoTexture("video-2", "http://example.com/video2.mp4");
      expect(loader.getResourceCount()).toBe(2);
    });

    it("resetStats() 应该重置统计信息", async () => {
      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");

      loader.resetStats();

      const stats = loader.getStats();
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.avgLoadTime).toBe(0);

      // 资源数量不应该重置
      expect(stats.totalResources).toBe(1);
      expect(stats.loadedResources).toBe(1);
    });

    it("printDebugInfo() 应该输出调试信息", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await loader.loadVideoTexture("video-1", "http://example.com/video.mp4");
      loader.printDebugInfo();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ResourceLoader] Debug Info:"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("错误处理", () => {
    it("加载失败时应该设置错误状态", async () => {
      const errorTextureManager = {
        createVideoFromURL: vi
          .fn()
          .mockRejectedValue(new Error("Network error")),
      } as unknown as TextureManager;

      const errorLoader = new ResourceLoader(errorTextureManager, false);

      const result = await errorLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");

      const resource = errorLoader.getResource("video-1");
      expect(resource?.state).toBe(ResourceLoadState.ERROR);
      expect(resource?.error).toBeDefined();

      errorLoader.dispose();
    });

    it("释放不存在的资源应该不报错", () => {
      expect(() => {
        loader.releaseResource("non-existent");
      }).not.toThrow();
    });

    it("卸载不存在的资源应该不报错", () => {
      expect(() => {
        loader.unloadResource("non-existent");
      }).not.toThrow();
    });
  });

  describe("调试模式", () => {
    it("调试模式下应该输出加载日志", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const debugLoader = new ResourceLoader(mockTextureManager, true);

      await debugLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Loading resource:"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Resource loaded:"),
      );

      debugLoader.dispose();
      consoleSpy.mockRestore();
    });

    it("调试模式下缓存命中应该输出日志", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const debugLoader = new ResourceLoader(mockTextureManager, true);

      await debugLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );
      await debugLoader.loadVideoTexture(
        "video-1",
        "http://example.com/video.mp4",
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cache hit for resource:"),
      );

      debugLoader.dispose();
      consoleSpy.mockRestore();
    });

    it("调试模式下预加载应该输出日志", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const debugLoader = new ResourceLoader(mockTextureManager, true);

      const clips: Clip[] = [createMockClip()];

      await debugLoader.preloadResources(clips);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Preloading"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Preload completed:"),
      );

      debugLoader.dispose();
      consoleSpy.mockRestore();
    });
  });
});
