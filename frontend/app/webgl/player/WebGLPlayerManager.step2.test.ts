/**
 * WebGLPlayerManager.step2.test.ts
 *
 * 步骤2：渲染器和渲染循环集成测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebGLPlayerManager } from "./WebGLPlayerManager";

describe("WebGLPlayerManager - Step 2: Renderer Integration", () => {
  let canvas: HTMLCanvasElement;
  let manager: WebGLPlayerManager;

  beforeEach(() => {
    // 创建测试用 canvas
    canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
  });

  afterEach(() => {
    // 清理资源
    if (manager) {
      manager.dispose();
    }
  });

  describe("渲染器初始化", () => {
    it("初始化后应该创建渲染器实例", async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      const renderer = manager.getRenderer();
      expect(renderer).toBeDefined();
      expect(renderer).not.toBeNull();
    });

    it("初始化后应该创建渲染循环实例", async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      const renderLoop = manager.getRenderLoop();
      expect(renderLoop).toBeDefined();
      expect(renderLoop).not.toBeNull();
    });

    it("渲染循环初始时不应该运行", async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      const renderLoop = manager.getRenderLoop();
      const stats = renderLoop?.getStats();
      expect(stats?.isRunning).toBe(false);
    });

    it("应该使用配置选项创建渲染器", async () => {
      manager = new WebGLPlayerManager(canvas, {
        backgroundColor: [1, 0, 0, 1],
        enableBatching: false,
        autoUpdateTextures: false,
      });

      await manager.initialize();

      const renderer = manager.getRenderer();
      expect(renderer).toBeDefined();
    });

    it("应该使用配置的目标帧率创建渲染循环", async () => {
      manager = new WebGLPlayerManager(canvas, {
        targetFPS: 30,
      });

      await manager.initialize();

      const renderLoop = manager.getRenderLoop();
      expect(renderLoop).toBeDefined();
    });
  });

  describe("渲染循环控制", () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it("play() 应该启动渲染循环", () => {
      expect(manager.getRenderLoop()?.getStats().isRunning).toBe(false);

      manager.play();

      expect(manager.getRenderLoop()?.getStats().isRunning).toBe(true);
    });

    it("pause() 应该保持渲染循环运行（用于显示暂停帧）", () => {
      manager.play();
      expect(manager.getRenderLoop()?.getStats().isRunning).toBe(true);

      manager.pause();

      // 渲染循环仍然运行，但播放状态为 false
      expect(manager.getRenderLoop()?.getStats().isRunning).toBe(true);
      expect(manager.isPlaying()).toBe(false);
    });

    it("dispose() 应该停止渲染循环", () => {
      manager.play();
      expect(manager.getRenderLoop()?.getStats().isRunning).toBe(true);

      manager.dispose();

      // 渲染循环已清理
      expect(manager.getRenderLoop()).toBeNull();
    });

    it("多次 play() 不应该重复启动渲染循环", () => {
      manager.play();
      const firstState = manager.getRenderLoop()?.getStats().isRunning;

      manager.play();
      const secondState = manager.getRenderLoop()?.getStats().isRunning;

      expect(firstState).toBe(true);
      expect(secondState).toBe(true);
    });
  });

  describe("性能统计", () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it("getRendererStats() 应该返回渲染统计信息", () => {
      const stats = manager.getRendererStats();

      expect(stats).toBeDefined();
      expect(stats).not.toBeNull();

      if (stats) {
        expect(stats).toHaveProperty("drawCalls");
        expect(stats).toHaveProperty("nodesRendered");
        expect(stats).toHaveProperty("nodesCulled");
        expect(stats).toHaveProperty("triangles");
        expect(stats).toHaveProperty("renderTime");
      }
    });

    it("getRenderLoopStats() 应该返回渲染循环统计信息", () => {
      const stats = manager.getRenderLoopStats();

      expect(stats).toBeDefined();
      expect(stats).not.toBeNull();

      if (stats) {
        expect(stats).toHaveProperty("fps");
        expect(stats).toHaveProperty("frameTime");
        expect(stats).toHaveProperty("frameCount");
        expect(stats).toHaveProperty("totalTime");
        expect(stats).toHaveProperty("isRunning");
      }
    });

    it("初始状态下渲染统计应该为零", () => {
      const stats = manager.getRendererStats();

      expect(stats?.drawCalls).toBe(0);
      expect(stats?.nodesRendered).toBe(0);
      expect(stats?.nodesCulled).toBe(0);
      expect(stats?.triangles).toBe(0);
    });

    it("未初始化时获取统计信息应该返回 null", () => {
      const uninitializedManager = new WebGLPlayerManager(canvas);

      expect(uninitializedManager.getRendererStats()).toBeNull();
      expect(uninitializedManager.getRenderLoopStats()).toBeNull();

      uninitializedManager.dispose();
    });

    it("播放后帧数应该增加", async () => {
      manager.play();

      const initialStats = manager.getRenderLoopStats();
      const initialFrameCount = initialStats?.frameCount || 0;

      // 等待几帧
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatedStats = manager.getRenderLoopStats();
      const updatedFrameCount = updatedStats?.frameCount || 0;

      expect(updatedFrameCount).toBeGreaterThan(initialFrameCount);
    });
  });

  describe("时间更新", () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
      manager.setDuration(10);
    });

    it("播放时当前时间应该自动增加", async () => {
      const initialTime = manager.getCurrentTime();
      manager.play();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const currentTime = manager.getCurrentTime();
      expect(currentTime).toBeGreaterThan(initialTime);
    });

    it("暂停时当前时间应该停止增加", async () => {
      manager.play();

      await new Promise((resolve) => setTimeout(resolve, 50));

      manager.pause();
      const pauseTime = manager.getCurrentTime();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const laterTime = manager.getCurrentTime();
      // 允许很小的误差
      expect(Math.abs(laterTime - pauseTime)).toBeLessThan(0.1);
    });

    it("到达终点时应该自动暂停", async () => {
      manager.setDuration(0.1); // 设置很短的时长
      manager.seekTo(0);
      manager.play();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(manager.isPlaying()).toBe(false);
      expect(manager.getCurrentTime()).toBeCloseTo(0.1, 1);
    });

    it("seekTo() 应该在播放中正确跳转", async () => {
      manager.play();

      await new Promise((resolve) => setTimeout(resolve, 50));

      manager.seekTo(5);
      expect(manager.getCurrentTime()).toBe(5);
      expect(manager.isPlaying()).toBe(true);
    });
  });

  describe("手动渲染", () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it("renderFrame() 应该手动渲染一帧", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      manager = new WebGLPlayerManager(canvas, { debug: true });
      await manager.initialize();
      manager.renderFrame();

      // 在调试模式下应该输出日志
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Frame rendered at time:"),
        expect.any(Number),
      );

      consoleSpy.mockRestore();
    });

    it("未初始化时 renderFrame() 应该给出警告", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const uninitializedManager = new WebGLPlayerManager(canvas);

      uninitializedManager.renderFrame();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[WebGLPlayerManager] Cannot render frame: components not initialized",
      );

      uninitializedManager.dispose();
      consoleSpy.mockRestore();
    });

    it("暂停状态下应该能够手动渲染更新画面", () => {
      manager.pause();
      manager.seekTo(5);

      // 手动渲染应该不抛出错误
      expect(() => {
        manager.renderFrame();
      }).not.toThrow();
    });
  });

  describe("资源清理", () => {
    it("dispose() 应该清理渲染器和渲染循环", async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      expect(manager.getRenderer()).not.toBeNull();
      expect(manager.getRenderLoop()).not.toBeNull();

      manager.dispose();

      expect(manager.getRenderer()).toBeNull();
      expect(manager.getRenderLoop()).toBeNull();
    });

    it("dispose() 后获取统计信息应该返回 null", async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      manager.dispose();

      expect(manager.getRendererStats()).toBeNull();
      expect(manager.getRenderLoopStats()).toBeNull();
    });
  });

  describe("高级功能", () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it("getRenderer() 应该返回渲染器实例", () => {
      const renderer = manager.getRenderer();
      expect(renderer).toBeDefined();
      expect(renderer).not.toBeNull();
    });

    it("getRenderLoop() 应该返回渲染循环实例", () => {
      const renderLoop = manager.getRenderLoop();
      expect(renderLoop).toBeDefined();
      expect(renderLoop).not.toBeNull();
    });

    it("resize() 后渲染器应该继续工作", () => {
      manager.resize(1280, 720);
      manager.play();

      const stats = manager.getRenderLoop()?.getStats();
      expect(stats?.isRunning).toBe(true);
    });
  });

  describe("调试模式", () => {
    it("调试模式下应该输出渲染器初始化日志", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      manager = new WebGLPlayerManager(canvas, { debug: true });
      await manager.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Renderer and render loop initialized"),
      );

      consoleSpy.mockRestore();
    });

    it("调试模式下启动渲染循环应该输出日志", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      manager = new WebGLPlayerManager(canvas, { debug: true });
      await manager.initialize();

      manager.play();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[WebGLPlayerManager] Render loop started",
      );

      consoleSpy.mockRestore();
    });
  });
});
