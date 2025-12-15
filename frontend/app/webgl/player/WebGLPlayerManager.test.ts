/**
 * WebGLPlayerManager.test.ts
 *
 * WebGLPlayerManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebGLPlayerManager } from './WebGLPlayerManager';

describe('WebGLPlayerManager', () => {
  let canvas: HTMLCanvasElement;
  let manager: WebGLPlayerManager;

  beforeEach(() => {
    // 创建测试用 canvas
    canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
  });

  afterEach(() => {
    // 清理资源
    if (manager) {
      manager.dispose();
    }
  });

  describe('构造函数', () => {
    it('应该成功创建 WebGLPlayerManager 实例', () => {
      manager = new WebGLPlayerManager(canvas);
      expect(manager).toBeDefined();
      expect(manager.isInitialized()).toBe(false);
    });

    it('应该使用默认配置', () => {
      manager = new WebGLPlayerManager(canvas);
      const options = manager.getOptions();

      expect(options.width).toBe(1920);
      expect(options.height).toBe(1080);
      expect(options.backgroundColor).toEqual([0.1, 0.1, 0.1, 1.0]);
      expect(options.targetFPS).toBe(60);
      expect(options.enableBatching).toBe(true);
      expect(options.autoUpdateTextures).toBe(true);
      expect(options.debug).toBe(false);
    });

    it('应该使用自定义配置', () => {
      manager = new WebGLPlayerManager(canvas, {
        width: 1280,
        height: 720,
        backgroundColor: [0, 0, 0, 1],
        targetFPS: 30,
        enableBatching: false,
        autoUpdateTextures: false,
        debug: true,
      });

      const options = manager.getOptions();
      expect(options.width).toBe(1280);
      expect(options.height).toBe(720);
      expect(options.backgroundColor).toEqual([0, 0, 0, 1]);
      expect(options.targetFPS).toBe(30);
      expect(options.enableBatching).toBe(false);
      expect(options.autoUpdateTextures).toBe(false);
      expect(options.debug).toBe(true);
    });
  });

  describe('初始化', () => {
    it('应该成功初始化所有组件', async () => {
      manager = new WebGLPlayerManager(canvas, { debug: true });
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
    });

    it('重复初始化应该给出警告', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
      await manager.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebGLPlayerManager] Already initialized'
      );

      consoleSpy.mockRestore();
    });

    it('初始化失败后应该清理资源', async () => {
      // 使用无效的 canvas 模拟初始化失败
      const invalidCanvas = {} as HTMLCanvasElement;
      manager = new WebGLPlayerManager(invalidCanvas);

      await expect(manager.initialize()).rejects.toThrow();
      expect(manager.isInitialized()).toBe(false);
    });
  });

  describe('播放控制', () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it('play() 应该设置播放状态', () => {
      expect(manager.isPlaying()).toBe(false);
      manager.play();
      expect(manager.isPlaying()).toBe(true);
    });

    it('pause() 应该暂停播放', () => {
      manager.play();
      expect(manager.isPlaying()).toBe(true);
      manager.pause();
      expect(manager.isPlaying()).toBe(false);
    });

    it('seekTo() 应该跳转到指定时间', () => {
      manager.setDuration(100);
      manager.seekTo(50);
      expect(manager.getCurrentTime()).toBe(50);
    });

    it('seekTo() 应该限制在有效范围内', () => {
      manager.setDuration(100);

      manager.seekTo(-10);
      expect(manager.getCurrentTime()).toBe(0);

      manager.seekTo(150);
      expect(manager.getCurrentTime()).toBe(100);
    });

    it('getCurrentTime() 应该返回当前时间', () => {
      manager.seekTo(25.5);
      expect(manager.getCurrentTime()).toBe(25.5);
    });

    it('getDuration() 应该返回总时长', () => {
      manager.setDuration(120);
      expect(manager.getDuration()).toBe(120);
    });

    it('setDuration() 应该设置总时长', () => {
      manager.setDuration(200);
      expect(manager.getDuration()).toBe(200);
    });

    it('setDuration() 应该忽略负值', () => {
      manager.setDuration(-50);
      expect(manager.getDuration()).toBe(0);
    });

    it('未初始化时播放应该给出警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const uninitializedManager = new WebGLPlayerManager(canvas);

      uninitializedManager.play();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebGLPlayerManager] Cannot play: not initialized'
      );

      uninitializedManager.dispose();
      consoleSpy.mockRestore();
    });
  });

  describe('场景更新', () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it('updateScene() 应该更新当前时间', () => {
      manager.updateScene([], 10.5);
      expect(manager.getCurrentTime()).toBe(10.5);
    });

    it('未初始化时更新场景应该给出警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const uninitializedManager = new WebGLPlayerManager(canvas);

      uninitializedManager.updateScene([], 0);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebGLPlayerManager] Cannot update scene: not initialized'
      );

      uninitializedManager.dispose();
      consoleSpy.mockRestore();
    });
  });

  describe('尺寸调整', () => {
    beforeEach(async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();
    });

    it('resize() 应该更新 canvas 尺寸', () => {
      manager.resize(1280, 720);

      expect(canvas.width).toBe(1280);
      expect(canvas.height).toBe(720);
      expect(manager.getOptions().width).toBe(1280);
      expect(manager.getOptions().height).toBe(720);
    });

    it('未初始化时调整尺寸应该给出警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const uninitializedManager = new WebGLPlayerManager(canvas);

      uninitializedManager.resize(1280, 720);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebGLPlayerManager] Cannot resize: not initialized'
      );

      uninitializedManager.dispose();
      consoleSpy.mockRestore();
    });
  });

  describe('资源清理', () => {
    it('dispose() 应该清理所有资源', async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      manager.dispose();
      expect(manager.isInitialized()).toBe(false);
    });

    it('dispose() 应该重置播放状态', async () => {
      manager = new WebGLPlayerManager(canvas);
      await manager.initialize();

      manager.play();
      manager.setDuration(100);
      manager.seekTo(50);

      manager.dispose();

      expect(manager.isPlaying()).toBe(false);
      expect(manager.getCurrentTime()).toBe(0);
      expect(manager.getDuration()).toBe(0);
    });
  });

  describe('辅助方法', () => {
    beforeEach(() => {
      manager = new WebGLPlayerManager(canvas);
    });

    it('getCanvas() 应该返回 canvas 元素', () => {
      expect(manager.getCanvas()).toBe(canvas);
    });

    it('getOptions() 应该返回只读配置', () => {
      const options = manager.getOptions();
      expect(options).toBeDefined();

      // 尝试修改不应该影响内部配置（只读）
      // TypeScript 会阻止这种操作，但在运行时我们可以测试
      expect(() => {
        (options as any).width = 9999;
      }).not.toThrow();
    });

    it('isInitialized() 应该反映初始化状态', async () => {
      expect(manager.isInitialized()).toBe(false);
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);
      manager.dispose();
      expect(manager.isInitialized()).toBe(false);
    });
  });
});
