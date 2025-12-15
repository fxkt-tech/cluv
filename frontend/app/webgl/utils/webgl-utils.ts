/**
 * WebGL Utilities
 *
 * 提供 WebGL 常用工具函数，包括 shader、program、buffer、texture 创建和错误处理
 */

/**
 * 创建 Shader
 * @param gl WebGL 上下文
 * @param type Shader 类型 (VERTEX_SHADER 或 FRAGMENT_SHADER)
 * @param source Shader 源码
 * @returns Shader 对象，失败返回 null
 */
export function createShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Failed to create shader");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const info = gl.getShaderInfoLog(shader);
    const shaderType = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    console.error(`Failed to compile ${shaderType} shader:`, info);
    console.error("Shader source:", source);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * 创建 Program
 * @param gl WebGL 上下文
 * @param vertexShader 顶点着色器
 * @param fragmentShader 片段着色器
 * @returns Program 对象，失败返回 null
 */
export function createProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create program");
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const info = gl.getProgramInfoLog(program);
    console.error("Failed to link program:", info);
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * 创建 Program 从源码
 * @param gl WebGL 上下文
 * @param vertexSource 顶点着色器源码
 * @param fragmentSource 片段着色器源码
 * @returns Program 对象，失败返回 null
 */
export function createProgramFromSource(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  if (!vertexShader) return null;

  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  const program = createProgram(gl, vertexShader, fragmentShader);

  // 清理 shader（program 已经链接，不再需要）
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * 创建 Buffer
 * @param gl WebGL 上下文
 * @param data 数据
 * @param usage 使用模式 (STATIC_DRAW, DYNAMIC_DRAW, STREAM_DRAW)
 * @param target Buffer 目标 (ARRAY_BUFFER 或 ELEMENT_ARRAY_BUFFER)
 * @returns Buffer 对象，失败返回 null
 */
export function createBuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  data: BufferSource,
  usage: number = gl.STATIC_DRAW,
  target: number = gl.ARRAY_BUFFER,
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.error("Failed to create buffer");
    return null;
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);
  gl.bindBuffer(target, null);

  return buffer;
}

/**
 * 创建空纹理
 * @param gl WebGL 上下文
 * @param width 宽度
 * @param height 高度
 * @param options 纹理选项
 * @returns Texture 对象，失败返回 null
 */
export function createTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  width: number,
  height: number,
  options: {
    format?: number;
    internalFormat?: number;
    type?: number;
    wrapS?: number;
    wrapT?: number;
    minFilter?: number;
    magFilter?: number;
  } = {},
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    console.error("Failed to create texture");
    return null;
  }

  const {
    format = gl.RGBA,
    internalFormat = gl.RGBA,
    type = gl.UNSIGNED_BYTE,
    wrapS = gl.CLAMP_TO_EDGE,
    wrapT = gl.CLAMP_TO_EDGE,
    minFilter = gl.LINEAR,
    magFilter = gl.LINEAR,
  } = options;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    width,
    height,
    0,
    format,
    type,
    null,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

/**
 * 从图像创建纹理
 * @param gl WebGL 上下文
 * @param image 图像元素
 * @param options 纹理选项
 * @returns Texture 对象，失败返回 null
 */
export function createTextureFromImage(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  image: TexImageSource,
  options: {
    wrapS?: number;
    wrapT?: number;
    minFilter?: number;
    magFilter?: number;
    flipY?: boolean;
    generateMipmap?: boolean;
  } = {},
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    console.error("Failed to create texture");
    return null;
  }

  const {
    wrapS = gl.CLAMP_TO_EDGE,
    wrapT = gl.CLAMP_TO_EDGE,
    minFilter = gl.LINEAR,
    magFilter = gl.LINEAR,
    flipY = false,
    generateMipmap = false,
  } = options;

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 设置纹理翻转
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);

  // 上传图像数据
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // 生成 mipmap（如果需要）
  if (generateMipmap) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

/**
 * 更新纹理内容
 * @param gl WebGL 上下文
 * @param texture 纹理对象
 * @param image 图像元素
 * @param flipY 是否翻转 Y 轴
 */
export function updateTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  texture: WebGLTexture,
  image: TexImageSource,
  flipY: boolean = false,
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * 创建帧缓冲
 * @param gl WebGL 上下文
 * @param width 宽度
 * @param height 高度
 * @param options 选项
 * @returns 帧缓冲对象和纹理
 */
export function createFramebuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  width: number,
  height: number,
  options: {
    hasDepth?: boolean;
    hasStencil?: boolean;
  } = {},
): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.error("Failed to create framebuffer");
    return null;
  }

  const texture = createTexture(gl, width, height);
  if (!texture) {
    gl.deleteFramebuffer(framebuffer);
    return null;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  // 添加深度/模板附件
  const { hasDepth = false, hasStencil = false } = options;
  if (hasDepth || hasStencil) {
    const renderbuffer = gl.createRenderbuffer();
    if (!renderbuffer) {
      console.error("Failed to create renderbuffer");
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      return null;
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

    let format: number = gl.DEPTH_COMPONENT16;
    let attachment: number = gl.DEPTH_ATTACHMENT;

    if (hasDepth && hasStencil) {
      format = gl.DEPTH_STENCIL;
      attachment = gl.DEPTH_STENCIL_ATTACHMENT;
    } else if (hasStencil) {
      format = gl.STENCIL_INDEX8;
      attachment = gl.STENCIL_ATTACHMENT;
    }

    gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      attachment,
      gl.RENDERBUFFER,
      renderbuffer,
    );
  }

  // 检查帧缓冲完整性
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error(
      "Framebuffer is not complete:",
      getFramebufferStatusString(gl, status),
    );
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    return null;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture };
}

/**
 * 获取帧缓冲状态字符串
 */
function getFramebufferStatusString(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  status: number,
): string {
  switch (status) {
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
    case gl.FRAMEBUFFER_UNSUPPORTED:
      return "FRAMEBUFFER_UNSUPPORTED";
    default:
      return `Unknown status: ${status}`;
  }
}

/**
 * 检查 WebGL 错误
 * @param gl WebGL 上下文
 * @param label 标签（用于日志）
 * @returns 是否有错误
 */
export function checkError(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  label?: string,
): boolean {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    const errorString = getErrorString(gl, error);
    const message = label ? `${label}: ${errorString}` : errorString;
    console.error("WebGL Error:", message);
    return true;
  }
  return false;
}

/**
 * 获取错误字符串
 */
function getErrorString(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  error: number,
): string {
  switch (error) {
    case gl.INVALID_ENUM:
      return "INVALID_ENUM";
    case gl.INVALID_VALUE:
      return "INVALID_VALUE";
    case gl.INVALID_OPERATION:
      return "INVALID_OPERATION";
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      return "INVALID_FRAMEBUFFER_OPERATION";
    case gl.OUT_OF_MEMORY:
      return "OUT_OF_MEMORY";
    case gl.CONTEXT_LOST_WEBGL:
      return "CONTEXT_LOST_WEBGL";
    default:
      return `Unknown error: ${error}`;
  }
}

/**
 * 获取 WebGL 扩展
 * @param gl WebGL 上下文
 * @param name 扩展名称
 * @returns 扩展对象，不存在返回 null
 */
export function getExtension<T>(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  name: string,
): T | null {
  const ext = gl.getExtension(name);
  if (!ext) {
    console.warn(`WebGL extension "${name}" is not supported`);
  }
  return ext as T | null;
}

/**
 * 检查 WebGL 扩展是否支持
 * @param gl WebGL 上下文
 * @param name 扩展名称
 * @returns 是否支持
 */
export function hasExtension(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  name: string,
): boolean {
  return gl.getSupportedExtensions()?.includes(name) ?? false;
}

/**
 * 获取所有支持的扩展
 * @param gl WebGL 上下文
 * @returns 扩展名称列表
 */
export function getSupportedExtensions(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): string[] {
  return gl.getSupportedExtensions() ?? [];
}

/**
 * 调整 Canvas 尺寸以匹配显示尺寸
 * @param canvas Canvas 元素
 * @param pixelRatio 像素比（默认使用 devicePixelRatio）
 * @returns 是否发生了调整
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  pixelRatio: number = window.devicePixelRatio || 1,
): boolean {
  const displayWidth = Math.floor(canvas.clientWidth * pixelRatio);
  const displayHeight = Math.floor(canvas.clientHeight * pixelRatio);

  const needResize =
    canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}

/**
 * 设置顶点属性指针
 * @param gl WebGL 上下文
 * @param location 属性位置
 * @param buffer Buffer 对象
 * @param size 每个顶点的分量数
 * @param type 数据类型
 * @param normalized 是否归一化
 * @param stride 步长
 * @param offset 偏移
 */
export function setVertexAttribute(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  location: number,
  buffer: WebGLBuffer,
  size: number,
  type: number = gl.FLOAT,
  normalized: boolean = false,
  stride: number = 0,
  offset: number = 0,
): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
}

/**
 * 判断是否为 WebGL2 上下文
 * @param gl WebGL 上下文
 * @returns 是否为 WebGL2
 */
export function isWebGL2(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): gl is WebGL2RenderingContext {
  return "texStorage2D" in gl;
}

/**
 * 获取 WebGL 参数
 * @param gl WebGL 上下文
 * @returns 参数对象
 */
export function getWebGLParameters(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): Record<string, unknown> {
  return {
    version: gl.getParameter(gl.VERSION),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
    aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
  };
}
