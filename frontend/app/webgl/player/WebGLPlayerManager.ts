/**
 * WebGLPlayerManager.ts
 *
 * WebGL Player 管理器核心类
 * - 封装 WebGL 初始化和生命周期管理
 * - 管理所有 WebGL 组件（context, shader, texture, geometry, scene, renderer）
 * - 提供与原 Player 兼容的播放控制接口
 * - 处理场景更新和渲染
 */

import { WebGLContextManager } from "../core/WebGLContext";
import { ShaderManager, BUILTIN_SHADERS } from "../shader";
import { TextureManager } from "../texture";
import { GeometryManager } from "../geometry";
import { SceneManager } from "../scene/SceneManager";
import { Camera } from "../scene/Camera";
import { WebGLRenderer } from "../renderer/WebGLRenderer";
import { RenderLoop } from "../renderer/RenderLoop";
import type { RenderStats } from "../renderer/WebGLRenderer";
import type { RenderLoopStats } from "../renderer/RenderLoop";
import { ResourceLoader } from "./ResourceLoader";
import type { ResourceLoaderStats, ResourceInfo } from "./ResourceLoader";
import { SceneBuilder } from "./SceneBuilder";
import type { SceneBuildConfig, SceneBuildResult } from "./SceneBuilder";
import { VideoSyncManager } from "./VideoSyncManager";
import type { VideoSyncConfig, VideoSyncStats } from "./VideoSyncManager";
import type { Track, Clip } from "../../editor/types/timeline";

/**
 * WebGL Player 配置选项
 */
export interface WebGLPlayerOptions {
  /**
   * Canvas 宽度
   * @default canvas.width
   */
  width?: number;

  /**
   * Canvas 高度
   * @default canvas.height
   */
  height?: number;

  /**
   * 背景颜色 [r, g, b, a]
   * @default [0.1, 0.1, 0.1, 1.0]
   */
  backgroundColor?: [number, number, number, number];

  /**
   * 目标帧率
   * @default 60
   */
  targetFPS?: number;

  /**
   * 是否启用批量渲染优化
   * @default true
   */
  enableBatching?: boolean;

  /**
   * 是否自动更新视频纹理
   * @default true
   */
  autoUpdateTextures?: boolean;

  /**
   * 是否启用调试模式
   * @default false
   */
  debug?: boolean;
}

/**
 * WebGL Player 状态
 */
interface PlayerState {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 是否已初始化 */
  isInitialized: boolean;
}

/**
 * WebGL Player 管理器
 *
 * 核心功能：
 * - 初始化和管理所有 WebGL 组件
 * - 提供播放控制接口（play, pause, seek）
 * - 处理场景更新和渲染
 * - 管理资源生命周期
 */
export class WebGLPlayerManager {
  // Canvas 元素
  private canvas: HTMLCanvasElement;

  // 配置选项
  private options: Required<WebGLPlayerOptions>;

  // WebGL 组件
  private contextManager: WebGLContextManager | null = null;
  private shaderManager: ShaderManager | null = null;
  private textureManager: TextureManager | null = null;
  private geometryManager: GeometryManager | null = null;
  private sceneManager: SceneManager | null = null;
  private camera: Camera | null = null;

  // 渲染组件（步骤2新增）
  private renderer: WebGLRenderer | null = null;
  private renderLoop: RenderLoop | null = null;

  // 资源加载器（步骤3新增）
  private resourceLoader: ResourceLoader | null = null;

  // 场景构建器（步骤4新增）
  private sceneBuilder: SceneBuilder | null = null;

  // 视频同步管理器（步骤6新增）
  private videoSyncManager: VideoSyncManager | null = null;

  // 当前可见的 clips（用于视频同步）
  private visibleClips: Clip[] = [];

  // 播放器状态
  private state: PlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isInitialized: false,
  };

  /**
   * 创建 WebGL Player 管理器
   * @param canvas - Canvas 元素
   * @param options - 配置选项
   */
  constructor(canvas: HTMLCanvasElement, options: WebGLPlayerOptions = {}) {
    this.canvas = canvas;

    // 合并默认配置
    this.options = {
      width: options.width ?? canvas.width,
      height: options.height ?? canvas.height,
      backgroundColor: options.backgroundColor ?? [0.1, 0.1, 0.1, 1.0],
      targetFPS: options.targetFPS ?? 60,
      enableBatching: options.enableBatching ?? true,
      autoUpdateTextures: options.autoUpdateTextures ?? true,
      debug: options.debug ?? false,
    };

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Created with options:", this.options);
    }
  }

  /**
   * 初始化 WebGL Player
   *
   * 初始化步骤：
   * 1. 创建 WebGL 上下文
   * 2. 初始化 Shader 管理器并注册内置 shader
   * 3. 初始化纹理管理器
   * 4. 初始化几何体管理器并创建单位矩形
   * 5. 创建场景管理器和相机
   * 6. 设置初始背景色
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.warn("[WebGLPlayerManager] Already initialized");
      return;
    }

    try {
      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Initializing...");
      }

      // 1. 创建 WebGL 上下文
      this.contextManager = new WebGLContextManager(this.canvas, {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
      });

      const gl = this.contextManager.getContext();
      if (!gl) {
        throw new Error("Failed to create WebGL context");
      }

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] WebGL context created");
      }

      // 2. 初始化 Shader 管理器并注册内置 shader
      this.shaderManager = new ShaderManager(this.contextManager);

      // 注册基础 shader
      this.shaderManager.register(BUILTIN_SHADERS.BASE as any);

      // 注册视频 shader
      this.shaderManager.register(BUILTIN_SHADERS.VIDEO as any);

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Shaders registered:", [
          "base",
          "video",
        ]);
      }

      // 3. 初始化纹理管理器
      this.textureManager = new TextureManager(this.contextManager);

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Texture manager created");
      }

      // 4. 初始化几何体管理器并创建单位矩形
      this.geometryManager = new GeometryManager(this.contextManager);

      // 预创建单位矩形（延迟创建，首次调用 getUnitQuad 时创建）
      this.geometryManager.getUnitQuad();

      if (this.options.debug) {
        console.log(
          "[WebGLPlayerManager] Geometry manager created, unit quad ready",
        );
      }

      // 5. 创建场景管理器和相机
      this.sceneManager = new SceneManager({
        width: this.options.width,
        height: this.options.height,
        frameRate: this.options.targetFPS,
        backgroundColor: this.rgbaToHex(this.options.backgroundColor),
      });

      this.camera = Camera.create2D(this.options.width, this.options.height);

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Scene manager and camera created");
      }

      // 6. 设置初始背景色并清空画布
      const [r, g, b, a] = this.options.backgroundColor;
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // 7. 初始化渲染器（步骤2）
      this.initializeRenderer();

      if (this.options.debug) {
        console.log(
          "[WebGLPlayerManager] Renderer and render loop initialized",
        );
      }

      // 8. 初始化资源加载器（步骤3）
      this.resourceLoader = new ResourceLoader(
        this.textureManager,
        this.options.debug,
      );

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Resource loader initialized");
      }

      // 9. 初始化场景构建器（步骤4）
      this.sceneBuilder = new SceneBuilder(
        this.sceneManager,
        this.resourceLoader,
        this.contextManager,
        {
          canvasWidth: this.options.width,
          canvasHeight: this.options.height,
          debug: this.options.debug,
        },
      );

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] SceneBuilder created");
      }

      // 步骤6：创建视频同步管理器
      this.videoSyncManager = new VideoSyncManager(this.resourceLoader, {
        seekTolerance: 0.1,
        seekThrottle: 50,
        debug: this.options.debug,
      });

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] VideoSyncManager created");
      }

      // 标记为已初始化
      this.state.isInitialized = true;

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Initialization complete");
      }
    } catch (error) {
      console.error("[WebGLPlayerManager] Initialization failed:", error);
      this.dispose();
      throw error;
    }
  }

  /**
   * 释放所有资源
   */
  dispose(): void {
    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Disposing...");
    }

    // 停止渲染循环
    this.stopRenderLoop();

    // 按相反顺序释放资源
    if (this.videoSyncManager) {
      this.videoSyncManager.dispose();
      this.videoSyncManager = null;
    }

    if (this.sceneBuilder) {
      this.sceneBuilder.dispose();
      this.sceneBuilder = null;
    }

    if (this.resourceLoader) {
      this.resourceLoader.dispose();
      this.resourceLoader = null;
    }

    this.renderLoop = null;
    this.renderer = null;
    this.camera = null;
    this.sceneManager = null;

    if (this.geometryManager) {
      this.geometryManager.disposeAll();
      this.geometryManager = null;
    }

    if (this.textureManager) {
      this.textureManager.disposeAll();
      this.textureManager = null;
    }

    if (this.shaderManager) {
      this.shaderManager.disposeAll();
      this.shaderManager = null;
    }

    if (this.contextManager) {
      // WebGLContextManager 可能没有 dispose 方法，如果有则调用
      this.contextManager = null;
    }

    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isInitialized: false,
    };

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Disposed");
    }
  }

  // ==================== 渲染器和渲染循环（步骤2）====================

  /**
   * 初始化渲染器和渲染循环
   */
  private initializeRenderer(): void {
    if (
      !this.contextManager ||
      !this.shaderManager ||
      !this.textureManager ||
      !this.geometryManager ||
      !this.sceneManager ||
      !this.camera
    ) {
      throw new Error(
        "Cannot initialize renderer: required components not initialized",
      );
    }

    // 创建渲染器
    this.renderer = new WebGLRenderer(
      this.contextManager,
      this.shaderManager,
      this.textureManager,
      this.geometryManager,
      {
        clearColor: this.options.backgroundColor,
        enableBatching: this.options.enableBatching,
        autoUpdateTextures: this.options.autoUpdateTextures,
        autoClear: true,
        enableDepthTest: false,
        enableCullFace: false,
        enableFrustumCulling: false,
      },
    );

    // 创建渲染循环
    this.renderLoop = new RenderLoop(
      {
        onUpdate: (deltaTime: number, totalTime: number) => {
          this.handleUpdate(deltaTime, totalTime);
        },
        onRender: (
          deltaTime: number,
          totalTime: number,
          interpolation: number,
        ) => {
          this.handleRender(deltaTime, totalTime, interpolation);
        },
      },
      {
        targetFPS: this.options.targetFPS,
        fixedTimeStep: false,
        autoStart: false, // 手动控制启动
      },
    );

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Renderer created:", {
        clearColor: this.options.backgroundColor,
        enableBatching: this.options.enableBatching,
        autoUpdateTextures: this.options.autoUpdateTextures,
      });
      console.log("[WebGLPlayerManager] Render loop created:", {
        targetFPS: this.options.targetFPS,
      });
    }
  }

  /**
   * 更新回调（每帧调用）
   */
  private handleUpdate(deltaTime: number, totalTime: number): void {
    // 如果正在播放，更新当前时间
    if (this.state.isPlaying) {
      this.state.currentTime += deltaTime;

      // 检查是否到达终点
      if (
        this.state.currentTime >= this.state.duration &&
        this.state.duration > 0
      ) {
        this.state.currentTime = this.state.duration;
        this.pause();
      }

      // 更新场景图（如果有活动的 tracks）
      // 注意：这里假设 tracks 数据会通过其他方式提供
      // 实际使用时，应该在外部调用 updateScene()
    }

    // 步骤6：同步视频纹理时间
    if (this.videoSyncManager) {
      this.videoSyncManager.sync(
        this.visibleClips,
        this.state.currentTime,
        this.state.isPlaying,
      );
    }
  }

  /**
   * 渲染回调（每帧调用）
   */
  private handleRender(
    deltaTime: number,
    totalTime: number,
    interpolation: number,
  ): void {
    if (!this.renderer || !this.sceneManager || !this.camera) {
      return;
    }

    // 执行渲染
    this.renderer.render(
      this.sceneManager,
      this.camera,
      this.state.currentTime,
    );
  }

  /**
   * 启动渲染循环
   */
  private startRenderLoop(): void {
    if (!this.renderLoop) {
      console.warn(
        "[WebGLPlayerManager] Cannot start render loop: not initialized",
      );
      return;
    }

    const stats = this.renderLoop.getStats();
    if (!stats.isRunning) {
      this.renderLoop.start();

      if (this.options.debug) {
        console.log("[WebGLPlayerManager] Render loop started");
      }
    }
  }

  /**
   * 停止渲染循环
   */
  private stopRenderLoop(): void {
    if (this.renderLoop) {
      const stats = this.renderLoop.getStats();
      if (stats.isRunning) {
        this.renderLoop.stop();

        if (this.options.debug) {
          console.log("[WebGLPlayerManager] Render loop stopped");
        }
      }
    }
  }

  /**
   * 获取渲染器统计信息
   */
  getRendererStats(): RenderStats | null {
    return this.renderer ? this.renderer.getStats() : null;
  }

  /**
   * 获取渲染循环统计信息
   */
  getRenderLoopStats(): RenderLoopStats | null {
    return this.renderLoop ? this.renderLoop.getStats() : null;
  }

  // ==================== 资源加载（步骤3）====================

  /**
   * 加载视频资源
   * @param resourceId - 资源 ID
   * @param url - 视频 URL
   */
  async loadVideoResource(resourceId: string, url: string): Promise<boolean> {
    if (!this.resourceLoader) {
      console.warn(
        "[WebGLPlayerManager] Cannot load resource: resource loader not initialized",
      );
      return false;
    }

    const result = await this.resourceLoader.loadVideoTexture(resourceId, url);

    if (this.options.debug) {
      if (result.success) {
        console.log(
          `[WebGLPlayerManager] Loaded resource: ${resourceId} from ${url}`,
        );
      } else {
        console.error(
          `[WebGLPlayerManager] Failed to load resource: ${resourceId}`,
          result.error,
        );
      }
    }

    return result.success;
  }

  /**
   * 获取视频纹理
   * @param resourceId - 资源 ID
   */
  getVideoTexture(resourceId: string) {
    return this.resourceLoader?.getTexture(resourceId);
  }

  /**
   * 获取资源信息
   * @param resourceId - 资源 ID
   */
  getResourceInfo(resourceId: string): ResourceInfo | undefined {
    return this.resourceLoader?.getResource(resourceId);
  }

  /**
   * 释放资源
   * @param resourceId - 资源 ID
   */
  releaseResource(resourceId: string): void {
    if (this.resourceLoader) {
      this.resourceLoader.releaseResource(resourceId);

      if (this.options.debug) {
        console.log(`[WebGLPlayerManager] Released resource: ${resourceId}`);
      }
    }
  }

  /**
   * 获取资源加载器统计信息
   */
  getResourceLoaderStats(): ResourceLoaderStats | null {
    return this.resourceLoader ? this.resourceLoader.getStats() : null;
  }

  /**
   * 获取资源加载器实例（用于高级操作）
   */
  getResourceLoader(): ResourceLoader | null {
    return this.resourceLoader;
  }

  // ==================== 播放控制接口 ====================

  /**
   * 播放
   */
  play(): void {
    if (!this.state.isInitialized) {
      console.warn("[WebGLPlayerManager] Cannot play: not initialized");
      return;
    }

    this.state.isPlaying = true;

    // 启动渲染循环
    this.startRenderLoop();

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Play");
    }
  }

  /**
   * 暂停
   */
  pause(): void {
    this.state.isPlaying = false;

    // 注意：不停止渲染循环，继续渲染当前帧
    // 这样可以在暂停时仍然看到画面

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Pause");
    }
  }

  /**
   * 跳转到指定时间
   * @param time - 目标时间（秒）
   */
  seekTo(time: number): void {
    if (!this.state.isInitialized) {
      console.warn("[WebGLPlayerManager] Cannot seek: not initialized");
      return;
    }

    this.state.currentTime = Math.max(0, Math.min(time, this.state.duration));

    // Force immediate seek for all videos
    if (this.videoSyncManager) {
      this.videoSyncManager.forceSeek(this.state.currentTime);
    }

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Seek to:", this.state.currentTime);
    }
  }

  /**
   * 获取当前播放时间
   * @returns 当前时间（秒）
   */
  getCurrentTime(): number {
    return this.state.currentTime;
  }

  /**
   * 获取总时长
   * @returns 总时长（秒）
   */
  getDuration(): number {
    return this.state.duration;
  }

  /**
   * 获取播放状态
   * @returns 是否正在播放
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * 设置总时长
   * @param duration - 总时长（秒）
   */
  setDuration(duration: number): void {
    this.state.duration = Math.max(0, duration);

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Duration set to:", this.state.duration);
    }
  }

  // ==================== 场景更新 ====================

  /**
   * 更新场景
   *
   * 根据 Timeline 的 tracks 和当前时间更新场景内容
   * 使用 SceneBuilder 将 Timeline 数据转换为 WebGL Scene
   *
   * @param tracks - Timeline 轨道列表
   * @param currentTime - 当前时间（秒）
   */
  updateScene(tracks: Track[], currentTime: number): SceneBuildResult | null {
    if (!this.state.isInitialized || !this.sceneManager || !this.sceneBuilder) {
      console.warn("[WebGLPlayerManager] Cannot update scene: not initialized");
      return null;
    }

    this.state.currentTime = currentTime;

    // 步骤6：计算当前可见的 clips（用于视频同步）
    this.visibleClips = this.getVisibleClips(tracks, currentTime);

    // 使用 SceneBuilder 将 Timeline 转换为 Scene
    const result = this.sceneBuilder.buildScene(tracks, currentTime);

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Scene updated:", {
        trackCount: result.trackCount,
        clipCount: result.clipCount,
        visibleClipCount: result.visibleClipCount,
        layerCount: result.layerCount,
        nodeCount: result.nodeCount,
        currentTime,
      });

      if (result.errors.length > 0) {
        console.warn(
          "[WebGLPlayerManager] Scene update errors:",
          result.errors,
        );
      }
    }

    return result;
  }

  /**
   * 获取当前时间可见的所有 clips
   */
  private getVisibleClips(tracks: Track[], currentTime: number): Clip[] {
    const visibleClips: Clip[] = [];

    for (const track of tracks) {
      if (!track.visible) {
        continue;
      }

      for (const clip of track.clips) {
        const clipEndTime = clip.startTime + clip.duration;
        const isVisible =
          currentTime >= clip.startTime && currentTime < clipEndTime;

        if (isVisible) {
          visibleClips.push(clip);
        }
      }
    }

    return visibleClips;
  }

  /**
   * 获取场景构建器实例（用于高级操作）
   */
  getSceneBuilder(): SceneBuilder | null {
    return this.sceneBuilder;
  }

  /**
   * 获取视频同步管理器
   */
  getVideoSyncManager(): VideoSyncManager | null {
    return this.videoSyncManager;
  }

  /**
   * 获取视频同步统计
   */
  getVideoSyncStats(): VideoSyncStats | null {
    return this.videoSyncManager?.getStats() ?? null;
  }

  // ==================== 辅助方法 ====================

  /**
   * 将 RGBA 数组转换为十六进制颜色字符串
   * @param rgba - RGBA 数组 [r, g, b, a]
   * @returns 十六进制颜色字符串 #RRGGBB
   */
  private rgbaToHex(rgba: [number, number, number, number]): string {
    const [r, g, b] = rgba;
    const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * 获取初始化状态
   * @returns 是否已初始化
   */
  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  /**
   * 获取 Canvas 元素
   * @returns Canvas 元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * 获取配置选项
   * @returns 配置选项
   */
  getOptions(): Readonly<Required<WebGLPlayerOptions>> {
    return this.options;
  }

  /**
   * 调整 Canvas 大小
   * @param width - 新宽度
   * @param height - 新高度
   */
  resize(width: number, height: number): void {
    if (!this.state.isInitialized) {
      console.warn("[WebGLPlayerManager] Cannot resize: not initialized");
      return;
    }

    // 更新配置
    this.options.width = width;
    this.options.height = height;

    // 更新 Canvas 尺寸
    this.canvas.width = width;
    this.canvas.height = height;

    // 更新相机
    if (this.camera) {
      this.camera = Camera.create2D(width, height);
    }

    // 更新场景管理器尺寸
    if (this.sceneManager) {
      this.sceneManager.setDimensions(width, height);
    }

    // 更新场景构建器配置
    if (this.sceneBuilder) {
      this.sceneBuilder.updateConfig({
        canvasWidth: width,
        canvasHeight: height,
      });
    }

    // 更新 WebGL 视口
    if (this.contextManager) {
      const gl = this.contextManager.getContext();
      if (gl) {
        gl.viewport(0, 0, width, height);
      }
    }

    if (this.options.debug) {
      console.log("[WebGLPlayerManager] Resized to:", { width, height });
    }
  }

  /**
   * 获取渲染器实例（用于高级操作）
   */
  getRenderer(): WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * 获取渲染循环实例（用于高级操作）
   */
  getRenderLoop(): RenderLoop | null {
    return this.renderLoop;
  }

  /**
   * 强制渲染一帧（用于暂停时更新画面）
   */
  renderFrame(): void {
    if (!this.renderer || !this.sceneManager || !this.camera) {
      console.warn(
        "[WebGLPlayerManager] Cannot render frame: components not initialized",
      );
      return;
    }

    this.renderer.render(
      this.sceneManager,
      this.camera,
      this.state.currentTime,
    );

    if (this.options.debug) {
      console.log(
        "[WebGLPlayerManager] Frame rendered at time:",
        this.state.currentTime,
      );
    }
  }
}
