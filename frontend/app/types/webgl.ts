/**
 * WebGL Types
 *
 * WebGL 相关的类型定义
 */

/**
 * WebGL Context 初始化选项
 */
export interface WebGLContextOptions {
  /** 是否启用 alpha 通道 */
  alpha?: boolean
  /** 是否启用抗锯齿 */
  antialias?: boolean
  /** 是否启用深度缓冲 */
  depth?: boolean
  /** 是否启用模板缓冲 */
  stencil?: boolean
  /** 性能偏好 */
  powerPreference?: 'default' | 'high-performance' | 'low-power'
  /** 是否启用 premultipliedAlpha */
  premultipliedAlpha?: boolean
  /** 是否保留绘制缓冲区 */
  preserveDrawingBuffer?: boolean
}

/**
 * 纹理配置选项
 */
export interface TextureOptions {
  /** S 轴（水平）环绕模式 */
  wrapS?: number
  /** T 轴（垂直）环绕模式 */
  wrapT?: number
  /** 缩小过滤器 */
  minFilter?: number
  /** 放大过滤器 */
  magFilter?: number
  /** 是否翻转 Y 轴 */
  flipY?: boolean
  /** 是否生成 mipmap */
  generateMipmap?: boolean
  /** 纹理格式 */
  format?: number
  /** 内部格式 */
  internalFormat?: number
  /** 数据类型 */
  type?: number
}

/**
 * WebGL 扩展类型
 */
export interface WebGLExtensions {
  /** 各向异性过滤扩展 */
  anisotropic: EXT_texture_filter_anisotropic | null
  /** 浮点纹理扩展 */
  floatTexture: OES_texture_float | null
  /** 半浮点纹理扩展 */
  halfFloatTexture: OES_texture_half_float | null
  /** 标准导数扩展 */
  derivatives: OES_standard_derivatives | null
  /** VAO 扩展 (WebGL 1.0) */
  vao: OES_vertex_array_object | null
  /** 实例化扩展 (WebGL 1.0) */
  instanced: ANGLE_instanced_arrays | null
}

/**
 * Shader 类型
 */
export type ShaderType = 'vertex' | 'fragment'

/**
 * WebGL 版本
 */
export type WebGLVersion = 1 | 2

/**
 * 混合模式
 */
export type BlendMode = 'normal' | 'add' | 'multiply' | 'screen' | 'overlay'

/**
 * 纹理类型
 */
export type TextureType = 'video' | 'image' | 'canvas' | 'data'

/**
 * 纹理单元
 */
export type TextureUnit = number

/**
 * Buffer 使用模式
 */
export type BufferUsage = 'static' | 'dynamic' | 'stream'

/**
 * 绘制模式
 */
export type DrawMode = 'triangles' | 'triangle-strip' | 'triangle-fan' | 'points' | 'lines' | 'line-strip'
