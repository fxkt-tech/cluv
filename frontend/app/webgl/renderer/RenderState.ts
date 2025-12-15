/**
 * RenderState.ts
 *
 * WebGL 渲染状态管理器
 * - 状态缓存（避免冗余状态切换）
 * - 混合模式应用
 * - 深度测试管理
 * - 模板测试管理
 * - 裁剪管理
 * - 视口管理
 */

import type { WebGLContextManager } from "../core/WebGLContext";
import { BlendMode } from "../scene/RenderNode";

/**
 * 混合模式配置
 */
interface BlendConfig {
  enabled: boolean;
  srcRGB: number;
  dstRGB: number;
  srcAlpha: number;
  dstAlpha: number;
  equationRGB: number;
  equationAlpha: number;
}

/**
 * 深度测试配置
 */
interface DepthConfig {
  enabled: boolean;
  func: number;
  writable: boolean;
  range: [number, number];
}

/**
 * 模板测试配置
 */
interface StencilConfig {
  enabled: boolean;
  func: number;
  ref: number;
  mask: number;
  fail: number;
  zfail: number;
  zpass: number;
}

/**
 * 裁剪配置
 */
interface ScissorConfig {
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 视口配置
 */
interface ViewportConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 面剔除配置
 */
interface CullFaceConfig {
  enabled: boolean;
  mode: number; // FRONT, BACK, FRONT_AND_BACK
}

/**
 * 渲染状态管理器
 * 缓存 WebGL 状态，避免冗余的状态切换调用
 */
export class RenderState {
  private contextWrapper: WebGLContextManager;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;

  // 状态缓存
  private currentBlend: BlendConfig;
  private currentDepth: DepthConfig;
  private currentStencil: StencilConfig;
  private currentScissor: ScissorConfig;
  private currentViewport: ViewportConfig;
  private currentCullFace: CullFaceConfig;
  private currentClearColor: [number, number, number, number];
  private currentProgram: WebGLProgram | null = null;
  private currentFramebuffer: WebGLFramebuffer | null = null;

  // 统计信息
  private stats = {
    stateChanges: 0,
    blendModeChanges: 0,
    programChanges: 0,
    framebufferBinds: 0,
  };

  constructor(contextWrapper: WebGLContextManager) {
    this.contextWrapper = contextWrapper;
    const gl = contextWrapper.getContext();
    if (!gl) {
      throw new Error("RenderState: Failed to get WebGL context");
    }
    this.gl = gl;

    // 初始化默认状态
    this.currentBlend = {
      enabled: false,
      srcRGB: this.gl.ONE,
      dstRGB: this.gl.ZERO,
      srcAlpha: this.gl.ONE,
      dstAlpha: this.gl.ZERO,
      equationRGB: this.gl.FUNC_ADD,
      equationAlpha: this.gl.FUNC_ADD,
    };

    this.currentDepth = {
      enabled: false,
      func: this.gl.LESS,
      writable: true,
      range: [0, 1],
    };

    this.currentStencil = {
      enabled: false,
      func: this.gl.ALWAYS,
      ref: 0,
      mask: 0xff,
      fail: this.gl.KEEP,
      zfail: this.gl.KEEP,
      zpass: this.gl.KEEP,
    };

    this.currentScissor = {
      enabled: false,
      x: 0,
      y: 0,
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
    };

    this.currentViewport = {
      x: 0,
      y: 0,
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
    };

    this.currentCullFace = {
      enabled: false,
      mode: this.gl.BACK,
    };

    this.currentClearColor = [0, 0, 0, 1];

    // 应用初始状态到 WebGL 上下文
    this.reset();
  }

  /**
   * 重置所有状态到默认值
   */
  reset(): void {
    const gl = this.gl;

    // 禁用混合
    gl.disable(gl.BLEND);

    // 禁用深度测试
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);

    // 禁用模板测试
    gl.disable(gl.STENCIL_TEST);

    // 禁用裁剪
    gl.disable(gl.SCISSOR_TEST);

    // 禁用面剔除
    gl.disable(gl.CULL_FACE);

    // 设置清除颜色
    gl.clearColor(0, 0, 0, 1);

    // 设置视口
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 清空绑定
    this.currentProgram = null;
    this.currentFramebuffer = null;
  }

  /**
   * 设置混合模式
   */
  setBlendMode(mode: BlendMode): void {
    const config = this.getBlendConfig(mode);
    this.setBlend(config);
  }

  /**
   * 设置自定义混合配置
   */
  setBlend(config: Partial<BlendConfig>): void {
    const gl = this.gl;
    const current = this.currentBlend;

    // 启用/禁用混合
    if (config.enabled !== undefined && config.enabled !== current.enabled) {
      if (config.enabled) {
        gl.enable(gl.BLEND);
      } else {
        gl.disable(gl.BLEND);
      }
      current.enabled = config.enabled;
      this.stats.stateChanges++;
      this.stats.blendModeChanges++;
    }

    if (config.enabled === false) {
      return;
    }

    // 混合函数
    let needsBlendFunc = false;
    if (config.srcRGB !== undefined && config.srcRGB !== current.srcRGB) {
      current.srcRGB = config.srcRGB;
      needsBlendFunc = true;
    }
    if (config.dstRGB !== undefined && config.dstRGB !== current.dstRGB) {
      current.dstRGB = config.dstRGB;
      needsBlendFunc = true;
    }
    if (config.srcAlpha !== undefined && config.srcAlpha !== current.srcAlpha) {
      current.srcAlpha = config.srcAlpha;
      needsBlendFunc = true;
    }
    if (config.dstAlpha !== undefined && config.dstAlpha !== current.dstAlpha) {
      current.dstAlpha = config.dstAlpha;
      needsBlendFunc = true;
    }

    if (needsBlendFunc) {
      gl.blendFuncSeparate(
        current.srcRGB,
        current.dstRGB,
        current.srcAlpha,
        current.dstAlpha,
      );
      this.stats.stateChanges++;
    }

    // 混合方程
    let needsBlendEquation = false;
    if (
      config.equationRGB !== undefined &&
      config.equationRGB !== current.equationRGB
    ) {
      current.equationRGB = config.equationRGB;
      needsBlendEquation = true;
    }
    if (
      config.equationAlpha !== undefined &&
      config.equationAlpha !== current.equationAlpha
    ) {
      current.equationAlpha = config.equationAlpha;
      needsBlendEquation = true;
    }

    if (needsBlendEquation) {
      gl.blendEquationSeparate(current.equationRGB, current.equationAlpha);
      this.stats.stateChanges++;
    }
  }

  /**
   * 根据混合模式获取 WebGL 混合配置
   */
  private getBlendConfig(mode: BlendMode): BlendConfig {
    const gl = this.gl;

    switch (mode) {
      case "normal":
        // 标准 Alpha 混合: result = src * srcAlpha + dst * (1 - srcAlpha)
        return {
          enabled: true,
          srcRGB: gl.SRC_ALPHA,
          dstRGB: gl.ONE_MINUS_SRC_ALPHA,
          srcAlpha: gl.ONE,
          dstAlpha: gl.ONE_MINUS_SRC_ALPHA,
          equationRGB: gl.FUNC_ADD,
          equationAlpha: gl.FUNC_ADD,
        };

      case "add":
        // 加法混合: result = src + dst
        return {
          enabled: true,
          srcRGB: gl.SRC_ALPHA,
          dstRGB: gl.ONE,
          srcAlpha: gl.ONE,
          dstAlpha: gl.ONE,
          equationRGB: gl.FUNC_ADD,
          equationAlpha: gl.FUNC_ADD,
        };

      case "multiply":
        // 乘法混合: result = src * dst
        return {
          enabled: true,
          srcRGB: gl.DST_COLOR,
          dstRGB: gl.ONE_MINUS_SRC_ALPHA,
          srcAlpha: gl.DST_ALPHA,
          dstAlpha: gl.ONE_MINUS_SRC_ALPHA,
          equationRGB: gl.FUNC_ADD,
          equationAlpha: gl.FUNC_ADD,
        };

      case "screen":
        // 滤色混合: result = 1 - (1 - src) * (1 - dst)
        return {
          enabled: true,
          srcRGB: gl.ONE,
          dstRGB: gl.ONE_MINUS_SRC_COLOR,
          srcAlpha: gl.ONE,
          dstAlpha: gl.ONE_MINUS_SRC_ALPHA,
          equationRGB: gl.FUNC_ADD,
          equationAlpha: gl.FUNC_ADD,
        };

      case "overlay":
        // Overlay 需要在 shader 中实现，这里使用近似的混合模式
        return {
          enabled: true,
          srcRGB: gl.SRC_ALPHA,
          dstRGB: gl.ONE,
          srcAlpha: gl.ONE,
          dstAlpha: gl.ONE,
          equationRGB: gl.FUNC_ADD,
          equationAlpha: gl.FUNC_ADD,
        };

      default:
        // 默认使用 normal 模式
        return this.getBlendConfig(BlendMode.NORMAL);
    }
  }

  /**
   * 设置深度测试
   */
  setDepth(config: Partial<DepthConfig>): void {
    const gl = this.gl;
    const current = this.currentDepth;

    // 启用/禁用深度测试
    if (config.enabled !== undefined && config.enabled !== current.enabled) {
      if (config.enabled) {
        gl.enable(gl.DEPTH_TEST);
      } else {
        gl.disable(gl.DEPTH_TEST);
      }
      current.enabled = config.enabled;
      this.stats.stateChanges++;
    }

    // 深度测试函数
    if (config.func !== undefined && config.func !== current.func) {
      gl.depthFunc(config.func);
      current.func = config.func;
      this.stats.stateChanges++;
    }

    // 深度写入
    if (config.writable !== undefined && config.writable !== current.writable) {
      gl.depthMask(config.writable);
      current.writable = config.writable;
      this.stats.stateChanges++;
    }

    // 深度范围
    if (config.range !== undefined) {
      const [near, far] = config.range;
      if (near !== current.range[0] || far !== current.range[1]) {
        gl.depthRange(near, far);
        current.range = [near, far];
        this.stats.stateChanges++;
      }
    }
  }

  /**
   * 设置模板测试
   */
  setStencil(config: Partial<StencilConfig>): void {
    const gl = this.gl;
    const current = this.currentStencil;

    // 启用/禁用模板测试
    if (config.enabled !== undefined && config.enabled !== current.enabled) {
      if (config.enabled) {
        gl.enable(gl.STENCIL_TEST);
      } else {
        gl.disable(gl.STENCIL_TEST);
      }
      current.enabled = config.enabled;
      this.stats.stateChanges++;
    }

    if (!current.enabled) {
      return;
    }

    // 模板函数
    let needsStencilFunc = false;
    if (config.func !== undefined && config.func !== current.func) {
      current.func = config.func;
      needsStencilFunc = true;
    }
    if (config.ref !== undefined && config.ref !== current.ref) {
      current.ref = config.ref;
      needsStencilFunc = true;
    }
    if (config.mask !== undefined && config.mask !== current.mask) {
      current.mask = config.mask;
      needsStencilFunc = true;
    }

    if (needsStencilFunc) {
      gl.stencilFunc(current.func, current.ref, current.mask);
      this.stats.stateChanges++;
    }

    // 模板操作
    let needsStencilOp = false;
    if (config.fail !== undefined && config.fail !== current.fail) {
      current.fail = config.fail;
      needsStencilOp = true;
    }
    if (config.zfail !== undefined && config.zfail !== current.zfail) {
      current.zfail = config.zfail;
      needsStencilOp = true;
    }
    if (config.zpass !== undefined && config.zpass !== current.zpass) {
      current.zpass = config.zpass;
      needsStencilOp = true;
    }

    if (needsStencilOp) {
      gl.stencilOp(current.fail, current.zfail, current.zpass);
      this.stats.stateChanges++;
    }
  }

  /**
   * 设置裁剪区域
   */
  setScissor(config: Partial<ScissorConfig>): void {
    const gl = this.gl;
    const current = this.currentScissor;

    // 启用/禁用裁剪
    if (config.enabled !== undefined && config.enabled !== current.enabled) {
      if (config.enabled) {
        gl.enable(gl.SCISSOR_TEST);
      } else {
        gl.disable(gl.SCISSOR_TEST);
      }
      current.enabled = config.enabled;
      this.stats.stateChanges++;
    }

    if (!current.enabled) {
      return;
    }

    // 裁剪区域
    let needsScissor = false;
    if (config.x !== undefined && config.x !== current.x) {
      current.x = config.x;
      needsScissor = true;
    }
    if (config.y !== undefined && config.y !== current.y) {
      current.y = config.y;
      needsScissor = true;
    }
    if (config.width !== undefined && config.width !== current.width) {
      current.width = config.width;
      needsScissor = true;
    }
    if (config.height !== undefined && config.height !== current.height) {
      current.height = config.height;
      needsScissor = true;
    }

    if (needsScissor) {
      gl.scissor(current.x, current.y, current.width, current.height);
      this.stats.stateChanges++;
    }
  }

  /**
   * 设置视口
   */
  setViewport(x: number, y: number, width: number, height: number): void {
    const current = this.currentViewport;

    if (
      x !== current.x ||
      y !== current.y ||
      width !== current.width ||
      height !== current.height
    ) {
      this.gl.viewport(x, y, width, height);
      current.x = x;
      current.y = y;
      current.width = width;
      current.height = height;
      this.stats.stateChanges++;
    }
  }

  /**
   * 设置面剔除
   */
  setCullFace(config: Partial<CullFaceConfig>): void {
    const gl = this.gl;
    const current = this.currentCullFace;

    // 启用/禁用面剔除
    if (config.enabled !== undefined && config.enabled !== current.enabled) {
      if (config.enabled) {
        gl.enable(gl.CULL_FACE);
      } else {
        gl.disable(gl.CULL_FACE);
      }
      current.enabled = config.enabled;
      this.stats.stateChanges++;
    }

    // 剔除模式
    if (config.mode !== undefined && config.mode !== current.mode) {
      gl.cullFace(config.mode);
      current.mode = config.mode;
      this.stats.stateChanges++;
    }
  }

  /**
   * 设置清除颜色
   */
  setClearColor(r: number, g: number, b: number, a: number): void {
    const current = this.currentClearColor;

    if (
      r !== current[0] ||
      g !== current[1] ||
      b !== current[2] ||
      a !== current[3]
    ) {
      this.gl.clearColor(r, g, b, a);
      current[0] = r;
      current[1] = g;
      current[2] = b;
      current[3] = a;
      this.stats.stateChanges++;
    }
  }

  /**
   * 使用着色器程序
   */
  useProgram(program: WebGLProgram | null): void {
    if (program !== this.currentProgram) {
      this.gl.useProgram(program);
      this.currentProgram = program;
      this.stats.programChanges++;
      this.stats.stateChanges++;
    }
  }

  /**
   * 绑定帧缓冲
   */
  bindFramebuffer(framebuffer: WebGLFramebuffer | null): void {
    if (framebuffer !== this.currentFramebuffer) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      this.currentFramebuffer = framebuffer;
      this.stats.framebufferBinds++;
      this.stats.stateChanges++;
    }
  }

  /**
   * 获取当前混合模式配置
   */
  getCurrentBlend(): Readonly<BlendConfig> {
    return { ...this.currentBlend };
  }

  /**
   * 获取当前深度测试配置
   */
  getCurrentDepth(): Readonly<DepthConfig> {
    return { ...this.currentDepth };
  }

  /**
   * 获取当前视口配置
   */
  getCurrentViewport(): Readonly<ViewportConfig> {
    return { ...this.currentViewport };
  }

  /**
   * 获取统计信息
   */
  getStats(): Readonly<typeof this.stats> {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats.stateChanges = 0;
    this.stats.blendModeChanges = 0;
    this.stats.programChanges = 0;
    this.stats.framebufferBinds = 0;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.reset();
    this.currentProgram = null;
    this.currentFramebuffer = null;
  }
}
