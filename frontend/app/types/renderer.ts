/**
 * Renderer Types
 *
 * 渲染器相关的类型定义
 */

/**
 * 渲染器初始化选项
 */
export interface RendererOptions {
  /** Canvas 元素 */
  canvas: HTMLCanvasElement;
  /** 舞台尺寸 */
  stage: {
    width: number;
    height: number;
  };
  /** 背景颜色 (CSS 格式) */
  backgroundColor?: string;
  /** WebGL 上下文选项 */
  contextOptions?: {
    alpha?: boolean;
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    powerPreference?: "default" | "high-performance" | "low-power";
  };
  /** 是否启用性能监控 */
  enableStats?: boolean;
  /** 像素比 */
  pixelRatio?: number;
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  /** 帧率 */
  fps: number;
  /** 绘制调用次数 */
  drawCalls: number;
  /** 三角形数量 */
  triangles: number;
  /** 纹理数量 */
  textures: number;
  /** 渲染时间 (ms) */
  renderTime: number;
  /** 内存使用 (估算) */
  memoryUsage?: number;
}

/**
 * 视口配置
 */
export interface Viewport {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 渲染目标
 */
export interface RenderTarget {
  /** 目标 ID */
  id: string;
  /** 帧缓冲对象 */
  framebuffer: WebGLFramebuffer | null;
  /** 纹理 */
  texture: WebGLTexture | null;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 是否有深度附件 */
  hasDepth?: boolean;
  /** 是否有模板附件 */
  hasStencil?: boolean;
}

/**
 * 渲染通道
 */
export interface RenderPass {
  /** 通道名称 */
  name: string;
  /** 渲染目标 */
  target: RenderTarget | null;
  /** 清除颜色 */
  clearColor?: [number, number, number, number];
  /** 是否清除深度 */
  clearDepth?: boolean;
  /** 是否清除模板 */
  clearStencil?: boolean;
  /** 视口 */
  viewport?: Viewport;
}

/**
 * 渲染状态
 */
export interface RenderState {
  /** 是否启用混合 */
  blend: boolean;
  /** 混合函数 */
  blendFunc?: {
    src: number;
    dst: number;
  };
  /** 是否启用深度测试 */
  depthTest: boolean;
  /** 深度写入 */
  depthWrite: boolean;
  /** 深度函数 */
  depthFunc?: number;
  /** 是否启用剔除 */
  cull: boolean;
  /** 剔除面 */
  cullFace?: number;
  /** 前面方向 */
  frontFace?: number;
  /** 视口 */
  viewport: Viewport;
  /** 裁剪测试 */
  scissorTest?: boolean;
  /** 裁剪区域 */
  scissor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 渲染命令
 */
export interface RenderCommand {
  /** 命令类型 */
  type: "draw" | "clear" | "setTarget" | "setViewport";
  /** 命令数据 */
  data: unknown;
  /** 优先级 */
  priority?: number;
}

/**
 * 材质属性
 */
export interface MaterialProperties {
  /** 漫反射颜色 */
  color?: [number, number, number, number];
  /** 透明度 */
  opacity?: number;
  /** 混合模式 */
  blendMode?: "normal" | "add" | "multiply" | "screen" | "overlay";
  /** 是否双面渲染 */
  doubleSided?: boolean;
  /** 是否透明 */
  transparent?: boolean;
}

/**
 * 渲染器事件类型
 */
export type RendererEventType =
  | "initialized"
  | "resize"
  | "contextLost"
  | "contextRestored"
  | "beforeRender"
  | "afterRender"
  | "error";

/**
 * 渲染器事件
 */
export interface RendererEvent {
  /** 事件类型 */
  type: RendererEventType;
  /** 事件数据 */
  data?: unknown;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 渲染器能力
 */
export interface RendererCapabilities {
  /** WebGL 版本 */
  webglVersion: 1 | 2;
  /** 最大纹理大小 */
  maxTextureSize: number;
  /** 最大纹理单元数 */
  maxTextureUnits: number;
  /** 最大顶点属性数 */
  maxVertexAttribs: number;
  /** 最大 Uniform 向量数 */
  maxUniformVectors: number;
  /** 最大 Varying 向量数 */
  maxVaryingVectors: number;
  /** 是否支持浮点纹理 */
  floatTextures: boolean;
  /** 是否支持半浮点纹理 */
  halfFloatTextures: boolean;
  /** 是否支持深度纹理 */
  depthTextures: boolean;
  /** 是否支持 VAO */
  vertexArrayObjects: boolean;
  /** 是否支持实例化 */
  instancedArrays: boolean;
  /** 各向异性过滤最大值 */
  maxAnisotropy: number;
}
