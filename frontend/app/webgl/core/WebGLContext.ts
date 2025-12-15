/**
 * WebGL Context Manager
 *
 * 负责创建和管理 WebGL 上下文，处理扩展和上下文丢失/恢复
 */

import {
  WebGLContextOptions,
  WebGLExtensions,
  WebGLVersion,
} from "../../types/webgl";
import {
  getExtension,
  getSupportedExtensions,
  getWebGLParameters,
} from "../utils/webgl-utils";

/**
 * 事件类型
 */
type ContextEventType = "contextlost" | "contextrestored" | "error";

/**
 * 事件回调
 */
type EventCallback = (event?: unknown) => void;

/**
 * WebGL 上下文管理器
 * 负责创建、配置和管理 WebGL 上下文
 */
export class WebGLContextManager {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private options: WebGLContextOptions;
  private extensions: Partial<WebGLExtensions> = {};
  private contextLost: boolean = false;
  private eventListeners: Map<ContextEventType, Set<EventCallback>> = new Map();
  private webglVersion: WebGLVersion = 1;

  /**
   * 构造函数
   * @param canvas Canvas 元素
   * @param options WebGL 上下文选项
   */
  constructor(canvas: HTMLCanvasElement, options: WebGLContextOptions = {}) {
    this.canvas = canvas;
    this.options = {
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      powerPreference: "default",
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      ...options,
    };

    this.initialize();
    this.setupEventListeners();
  }

  /**
   * 初始化 WebGL 上下文
   */
  private initialize(): void {
    try {
      // 优先尝试 WebGL 2.0
      this.gl = this.canvas.getContext(
        "webgl2",
        this.options,
      ) as WebGL2RenderingContext;

      if (this.gl) {
        this.webglVersion = 2;
        console.log("WebGL 2.0 context created");
      } else {
        // 降级到 WebGL 1.0
        this.gl = this.canvas.getContext(
          "webgl",
          this.options,
        ) as WebGLRenderingContext;

        if (!this.gl) {
          // 尝试实验性前缀
          this.gl = this.canvas.getContext(
            "experimental-webgl",
            this.options,
          ) as WebGLRenderingContext;
        }

        if (this.gl) {
          this.webglVersion = 1;
          console.log("WebGL 1.0 context created");
        } else {
          throw new Error("WebGL is not supported in this browser");
        }
      }

      // 初始化扩展
      this.initializeExtensions();

      // 打印 WebGL 信息
      this.logWebGLInfo();
    } catch (error) {
      console.error("Failed to initialize WebGL context:", error);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 初始化 WebGL 扩展
   */
  private initializeExtensions(): void {
    if (!this.gl) return;

    const gl = this.gl;

    // 各向异性过滤
    this.extensions.anisotropic =
      getExtension<EXT_texture_filter_anisotropic>(
        gl,
        "EXT_texture_filter_anisotropic",
      ) ||
      getExtension<EXT_texture_filter_anisotropic>(
        gl,
        "WEBKIT_EXT_texture_filter_anisotropic",
      ) ||
      getExtension<EXT_texture_filter_anisotropic>(
        gl,
        "MOZ_EXT_texture_filter_anisotropic",
      );

    // 浮点纹理
    this.extensions.floatTexture = getExtension<OES_texture_float>(
      gl,
      "OES_texture_float",
    );

    // 半浮点纹理
    this.extensions.halfFloatTexture = getExtension<OES_texture_half_float>(
      gl,
      "OES_texture_half_float",
    );

    // 标准导数
    this.extensions.derivatives = getExtension<OES_standard_derivatives>(
      gl,
      "OES_standard_derivatives",
    );

    // WebGL 1.0 特定扩展
    if (this.webglVersion === 1) {
      // VAO 扩展
      this.extensions.vao = getExtension<OES_vertex_array_object>(
        gl,
        "OES_vertex_array_object",
      );

      // 实例化扩展
      this.extensions.instanced = getExtension<ANGLE_instanced_arrays>(
        gl,
        "ANGLE_instanced_arrays",
      );
    }

    console.log("WebGL extensions initialized:", this.getLoadedExtensions());
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听上下文丢失
    this.canvas.addEventListener(
      "webglcontextlost",
      this.handleContextLost.bind(this),
      false,
    );

    // 监听上下文恢复
    this.canvas.addEventListener(
      "webglcontextrestored",
      this.handleContextRestored.bind(this),
      false,
    );
  }

  /**
   * 处理上下文丢失
   */
  private handleContextLost(event: Event): void {
    event.preventDefault();
    console.warn("WebGL context lost");

    this.contextLost = true;
    this.gl = null;
    this.extensions = {};

    this.emit("contextlost", event);
  }

  /**
   * 处理上下文恢复
   */
  private handleContextRestored(event: Event): void {
    console.log("WebGL context restored");

    this.contextLost = false;
    this.initialize();

    this.emit("contextrestored", event);
  }

  /**
   * 获取 WebGL 上下文
   */
  getContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return this.gl;
  }

  /**
   * 获取 Canvas 元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * 判断是否为 WebGL 2.0
   */
  isWebGL2(): boolean {
    return this.webglVersion === 2;
  }

  /**
   * 获取 WebGL 版本
   */
  getVersion(): WebGLVersion {
    return this.webglVersion;
  }

  /**
   * 判断上下文是否丢失
   */
  isContextLost(): boolean {
    return this.contextLost || (this.gl?.isContextLost() ?? true);
  }

  /**
   * 获取扩展
   * @param name 扩展名称
   * @returns 扩展对象
   */
  getExtension<T = unknown>(name: string): T | null {
    if (!this.gl) return null;
    return getExtension<T>(this.gl, name);
  }

  /**
   * 检查扩展是否支持
   * @param name 扩展名称
   * @returns 是否支持
   */
  hasExtension(name: string): boolean {
    if (!this.gl) return false;
    return getSupportedExtensions(this.gl).includes(name);
  }

  /**
   * 获取已加载的扩展
   */
  getLoadedExtensions(): string[] {
    return Object.entries(this.extensions)
      .filter(([, ext]) => ext !== null)
      .map(([name]) => name);
  }

  /**
   * 获取 WebGL 扩展对象
   */
  getExtensions(): Partial<WebGLExtensions> {
    return this.extensions;
  }

  /**
   * 获取 WebGL 参数信息
   */
  getParameters(): Record<string, unknown> {
    if (!this.gl) return {};
    return getWebGLParameters(this.gl);
  }

  /**
   * 获取最大纹理大小
   */
  getMaxTextureSize(): number {
    if (!this.gl) return 0;
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
  }

  /**
   * 获取最大纹理单元数
   */
  getMaxTextureUnits(): number {
    if (!this.gl) return 0;
    return this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
  }

  /**
   * 获取最大顶点属性数
   */
  getMaxVertexAttribs(): number {
    if (!this.gl) return 0;
    return this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS);
  }

  /**
   * 获取最大各向异性过滤值
   */
  getMaxAnisotropy(): number {
    if (!this.extensions.anisotropic) return 1;
    return (
      this.gl?.getParameter(
        this.extensions.anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT,
      ) ?? 1
    );
  }

  /**
   * 打印 WebGL 信息
   */
  private logWebGLInfo(): void {
    if (!this.gl) return;

    const params = this.getParameters();
    console.log("WebGL Info:", {
      version: `WebGL ${this.webglVersion}.0`,
      vendor: params.vendor,
      renderer: params.renderer,
      glslVersion: params.shadingLanguageVersion,
      maxTextureSize: params.maxTextureSize,
      maxTextureUnits: params.maxTextureUnits,
      maxVertexAttribs: params.maxVertexAttribs,
    });
  }

  /**
   * 注册事件监听器
   * @param event 事件类型
   * @param callback 回调函数
   */
  on(event: ContextEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param callback 回调函数
   */
  off(event: ContextEventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: ContextEventType, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 移除事件监听
    this.canvas.removeEventListener(
      "webglcontextlost",
      this.handleContextLost.bind(this),
    );
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.handleContextRestored.bind(this),
    );

    // 清空事件监听器
    this.eventListeners.clear();

    // 丢失上下文（如果支持）
    if (this.gl) {
      const loseContext =
        this.getExtension<WEBGL_lose_context>("WEBGL_lose_context");
      if (loseContext) {
        loseContext.loseContext();
      }
    }

    this.gl = null;
    this.extensions = {};
    this.contextLost = true;

    console.log("WebGL context manager destroyed");
  }
}

/**
 * 检查浏览器是否支持 WebGL
 * @returns 是否支持 WebGL
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * 获取 WebGL 版本
 * @returns WebGL 版本 (2, 1, 或 0 表示不支持)
 */
export function getWebGLVersion(): WebGLVersion | 0 {
  try {
    const canvas = document.createElement("canvas");
    if (canvas.getContext("webgl2")) {
      return 2;
    } else if (
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    ) {
      return 1;
    }
    return 0;
  } catch {
    return 0;
  }
}
