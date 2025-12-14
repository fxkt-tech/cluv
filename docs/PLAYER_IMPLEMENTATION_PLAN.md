# Player WebGL 实施方案 - 模块化开发计划

## 文档信息

- **项目**: CLUV 非线性编辑软件
- **模块**: Player WebGL 渲染引擎
- **范围**: 视频和音频处理（暂不包含高级 Shader）
- **版本**: v1.0
- **开发周期**: 预计 6-8 周

---

## 目录

1. [总体架构](#1-总体架构)
2. [模块划分](#2-模块划分)
3. [文件结构](#3-文件结构)
4. [模块详细设计](#4-模块详细设计)
5. [开发顺序](#5-开发顺序)
6. [接口定义](#6-接口定义)
7. [测试策略](#7-测试策略)

---

## 1. 总体架构

### 1.1 架构层次

```
┌─────────────────────────────────────────────────────────┐
│                   Player Component                       │  ← React 组件层
│                  (PlayerCanvas.tsx)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              WebGL Renderer Core                         │  ← 渲染核心层
│           (WebGLRenderer.ts)                             │
└────┬─────────────┬─────────────┬────────────────────────┘
     │             │             │
     ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────────┐
│ Scene   │  │ Texture │  │   Shader    │                  ← 管理层
│ Manager │  │ Manager │  │   Manager   │
└─────────┘  └─────────┘  └─────────────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
    ┌─────────┐         ┌──────────┐
    │  Video  │         │  Audio   │                        ← 媒体层
    │  Sync   │         │  Mixer   │
    └─────────┘         └──────────┘
         │                    │
         └────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌────────────────┐   ┌────────────────┐
│ Timeline Store │   │ CutProtocol    │                    ← 数据层
└────────────────┘   └────────────────┘
```

### 1.2 核心功能范围

**包含功能**
- ✅ WebGL 基础渲染（视频、图片纹理）
- ✅ 多层视频合成
- ✅ 基础变换（位移、缩放、旋转、透明度）
- ✅ 多轨音频混合
- ✅ 音视频精确同步
- ✅ 时间轴集成

**不包含功能（后续 Phase）**
- ❌ 高级 Shader 特效
- ❌ 色彩校正
- ❌ 混合模式
- ❌ 3D 变换
- ❌ 后处理效果

---

## 2. 模块划分

### 2.1 模块概览

| 模块编号 | 模块名称 | 优先级 | 预计工期 | 依赖关系 |
|---------|---------|-------|---------|---------|
| M1 | 基础设施 | P0 | 2-3天 | 无 |
| M2 | WebGL Context 管理 | P0 | 2-3天 | M1 |
| M3 | 基础 Shader 系统 | P0 | 3-4天 | M2 |
| M4 | 纹理管理器 | P0 | 3-4天 | M2 |
| M5 | 几何体管理器 | P0 | 1-2天 | M2 |
| M6 | WebGL 渲染器核心 | P1 | 4-5天 | M2,M3,M4,M5 |
| M7 | 场景管理器 | P1 | 3-4天 | M6 |
| M8 | 视频同步系统 | P1 | 4-5天 | M4,M7 |
| M9 | 音频混合系统 | P1 | 4-5天 | 无 |
| M10 | Player 组件 | P2 | 3-4天 | M6,M7,M8,M9 |
| M11 | Timeline 集成 | P2 | 2-3天 | M10 |

**优先级说明**
- P0: 基础依赖，必须最先完成
- P1: 核心功能，依赖 P0
- P2: 集成层，依赖 P0 和 P1

---

## 3. 文件结构

```
frontend/app/editor/components/Player/
├── PlayerCanvas.tsx                    # M10: Player React 组件
├── webgl/
│   ├── core/
│   │   ├── WebGLContext.ts            # M2: WebGL 上下文管理
│   │   ├── WebGLRenderer.ts           # M6: 渲染器核心
│   │   ├── RenderLoop.ts              # M6: 渲染循环
│   │   └── RenderState.ts             # M6: 渲染状态管理
│   ├── shader/
│   │   ├── ShaderManager.ts           # M3: Shader 管理器
│   │   ├── ShaderProgram.ts           # M3: Shader 程序封装
│   │   ├── shaders/
│   │   │   ├── base.vert.glsl         # M3: 基础顶点着色器
│   │   │   ├── base.frag.glsl         # M3: 基础片段着色器
│   │   │   ├── video.vert.glsl        # M3: 视频顶点着色器
│   │   │   └── video.frag.glsl        # M3: 视频片段着色器
│   │   └── index.ts                   # M3: Shader 导出
│   ├── texture/
│   │   ├── TextureManager.ts          # M4: 纹理管理器
│   │   ├── VideoTexture.ts            # M4: 视频纹理
│   │   ├── ImageTexture.ts            # M4: 图片纹理
│   │   ├── TextureCache.ts            # M4: 纹理缓存
│   │   └── index.ts                   # M4: 纹理导出
│   ├── geometry/
│   │   ├── GeometryManager.ts         # M5: 几何体管理器
│   │   ├── QuadGeometry.ts            # M5: 四边形几何体
│   │   └── index.ts                   # M5: 几何体导出
│   ├── scene/
│   │   ├── SceneManager.ts            # M7: 场景管理器
│   │   ├── Layer.ts                   # M7: 图层
│   │   ├── RenderNode.ts              # M7: 渲染节点
│   │   ├── Camera.ts                  # M7: 相机
│   │   └── index.ts                   # M7: 场景导出
│   ├── sync/
│   │   ├── VideoSyncManager.ts        # M8: 视频同步管理器
│   │   ├── TimeController.ts          # M8: 时间控制器
│   │   └── index.ts                   # M8: 同步导出
│   └── utils/
│       ├── math.ts                    # M1: 数学工具（矩阵、向量）
│       ├── webgl-utils.ts             # M1: WebGL 工具函数
│       └── index.ts                   # M1: 工具导出
├── audio/
│   ├── AudioMixer.ts                  # M9: 音频混合器
│   ├── AudioNode.ts                   # M9: 音频节点
│   ├── AudioSyncController.ts         # M9: 音频同步控制
│   └── index.ts                       # M9: 音频导出
├── types/
│   ├── webgl.ts                       # 类型定义：WebGL 相关
│   ├── renderer.ts                    # 类型定义：渲染器相关
│   ├── scene.ts                       # 类型定义：场景相关
│   └── index.ts                       # 类型导出
└── hooks/
    ├── useWebGLRenderer.ts            # M10: WebGL 渲染器 Hook
    ├── usePlayerSync.ts               # M11: 播放器同步 Hook
    └── index.ts                       # Hooks 导出
```

---

## 4. 模块详细设计

### M1: 基础设施

#### 文件：`webgl/utils/math.ts`

**职责**
- 提供 4x4 矩阵运算
- 提供向量运算
- 提供坐标变换工具

**核心功能**
- 创建单位矩阵
- 矩阵乘法
- 创建平移、旋转、缩放矩阵
- 创建正交投影矩阵
- 矩阵逆运算
- 向量归一化、点乘、叉乘

**对外接口**
```typescript
export class Mat4 {
  static identity(): Float32Array
  static multiply(a: Float32Array, b: Float32Array): Float32Array
  static translate(x: number, y: number, z: number): Float32Array
  static scale(x: number, y: number, z: number): Float32Array
  static rotateZ(angle: number): Float32Array
  static ortho(left, right, bottom, top, near, far): Float32Array
}

export class Vec3 {
  static create(x: number, y: number, z: number): Float32Array
  static normalize(v: Float32Array): Float32Array
  static dot(a: Float32Array, b: Float32Array): number
  static cross(a: Float32Array, b: Float32Array): Float32Array
}
```

**实现要点**
- 使用 Float32Array 存储矩阵（列优先）
- 性能优化：避免频繁创建新数组
- 可考虑使用 glMatrix 库或自己实现

**测试建议**
- 单元测试矩阵运算正确性
- 验证投影矩阵的坐标转换

---

#### 文件：`webgl/utils/webgl-utils.ts`

**职责**
- 提供 WebGL 常用工具函数
- 错误处理和日志

**核心功能**
- 创建 Shader
- 创建 Program
- 创建 Buffer
- 创建 Texture
- 获取 WebGL 扩展
- 错误检查和日志

**对外接口**
```typescript
export function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null

export function createBuffer(
  gl: WebGLRenderingContext,
  data: Float32Array,
  usage: number
): WebGLBuffer | null

export function createTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number
): WebGLTexture | null

export function checkError(
  gl: WebGLRenderingContext,
  label?: string
): void
```

**实现要点**
- 统一的错误处理机制
- 详细的错误日志（包含调用栈）
- 支持 WebGL 1.0 和 2.0

**测试建议**
- 模拟 WebGL 错误情况
- 验证资源创建和清理

---

### M2: WebGL Context 管理

#### 文件：`webgl/core/WebGLContext.ts`

**职责**
- 创建和管理 WebGL 上下文
- 检测和启用扩展
- 处理上下文丢失和恢复

**核心功能**
- 初始化 WebGL Context
- 配置 Context 参数
- 检测可用扩展
- 监听 contextlost/contextrestored 事件
- 提供上下文访问接口

**对外接口**
```typescript
export interface WebGLContextOptions {
  alpha?: boolean
  antialias?: boolean
  depth?: boolean
  powerPreference?: 'default' | 'high-performance' | 'low-power'
}

export class WebGLContextManager {
  constructor(canvas: HTMLCanvasElement, options?: WebGLContextOptions)
  
  getContext(): WebGLRenderingContext | WebGL2RenderingContext | null
  getExtension(name: string): any
  isWebGL2(): boolean
  isContextLost(): boolean
  
  on(event: 'contextlost' | 'contextrestored', callback: () => void): void
  off(event: 'contextlost' | 'contextrestored', callback: () => void): void
  
  destroy(): void
}
```

**实现要点**
- 优先尝试 WebGL 2.0，降级到 1.0
- 缓存常用扩展（OES_texture_float 等）
- 上下文丢失时清理资源，恢复时重建
- 提供 Canvas resize 处理

**依赖关系**
- 依赖 M1 的工具函数

**测试建议**
- 测试 WebGL 1.0 和 2.0 初始化
- 模拟上下文丢失
- 验证扩展检测

---

### M3: 基础 Shader 系统

#### 文件：`webgl/shader/ShaderManager.ts`

**职责**
- 管理所有 Shader 程序
- 编译和链接 Shader
- 缓存 Shader 实例

**核心功能**
- 加载 Shader 源码
- 编译 Vertex/Fragment Shader
- 链接 Shader Program
- 提取和缓存 Uniform/Attribute 位置
- 提供 Shader 查询接口

**对外接口**
```typescript
export interface ShaderSource {
  vertex: string
  fragment: string
}

export class ShaderManager {
  constructor(gl: WebGLRenderingContext)
  
  createProgram(name: string, source: ShaderSource): ShaderProgram | null
  getProgram(name: string): ShaderProgram | null
  hasProgram(name: string): boolean
  
  destroy(): void
}
```

**实现要点**
- 使用 Map 缓存已编译的 Program
- 详细的编译错误日志
- 支持 Shader 源码预处理（#include、宏）
- 自动提取 uniform 和 attribute 位置

**依赖关系**
- 依赖 M2 的 WebGLContext
- 依赖 M1 的 webgl-utils

---

#### 文件：`webgl/shader/ShaderProgram.ts`

**职责**
- 封装单个 Shader Program
- 管理 Uniform 和 Attribute

**核心功能**
- 使用 Program
- 设置 Uniform 变量
- 绑定 Attribute
- 查询变量位置

**对外接口**
```typescript
export class ShaderProgram {
  constructor(
    gl: WebGLRenderingContext,
    program: WebGLProgram
  )
  
  use(): void
  
  // Uniform 设置
  setUniform1f(name: string, value: number): void
  setUniform2f(name: string, x: number, y: number): void
  setUniform3f(name: string, x: number, y: number, z: number): void
  setUniform4f(name: string, x: number, y: number, z: number, w: number): void
  setUniformMatrix4fv(name: string, matrix: Float32Array): void
  
  // Attribute 绑定
  enableAttribute(name: string): void
  bindAttribute(name: string, buffer: WebGLBuffer, size: number, type: number): void
  
  // 查询
  getUniformLocation(name: string): WebGLUniformLocation | null
  getAttributeLocation(name: string): number
  
  destroy(): void
}
```

**实现要点**
- 缓存 uniform/attribute 位置
- 避免重复的 gl 调用（状态缓存）
- 类型安全的 uniform 设置

---

#### 文件：`webgl/shader/shaders/base.vert.glsl`

**职责**
- 基础顶点着色器（用于图片）

**核心内容**
```glsl
attribute vec3 a_Position;
attribute vec2 a_TexCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec2 v_TexCoord;

void main() {
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);
  v_TexCoord = a_TexCoord;
}
```

**实现要点**
- 支持完整的 MVP 矩阵变换
- 传递 UV 坐标到 Fragment Shader

---

#### 文件：`webgl/shader/shaders/base.frag.glsl`

**职责**
- 基础片段着色器（用于图片）

**核心内容**
```glsl
precision mediump float;

uniform sampler2D u_Texture;
uniform float u_Opacity;

varying vec2 v_TexCoord;

void main() {
  vec4 color = texture2D(u_Texture, v_TexCoord);
  color.a *= u_Opacity;
  gl_FragColor = color;
}
```

**实现要点**
- 纹理采样
- 透明度控制

---

#### 文件：`webgl/shader/shaders/video.vert.glsl` 和 `video.frag.glsl`

**职责**
- 视频专用着色器（与 base 类似，但可能需要特殊处理）

**实现要点**
- 当前阶段可以与 base shader 相同
- 预留扩展点（YUV 转换等）

---

### M4: 纹理管理器

#### 文件：`webgl/texture/TextureManager.ts`

**职责**
- 管理所有纹理资源
- 创建、更新、销毁纹理
- 纹理缓存和复用

**核心功能**
- 创建视频纹理
- 创建图片纹理
- 更新视频纹理（从 video 元素）
- 纹理缓存（LRU）
- 纹理内存管理

**对外接口**
```typescript
export interface TextureOptions {
  wrapS?: number
  wrapT?: number
  minFilter?: number
  magFilter?: number
  flipY?: boolean
}

export class TextureManager {
  constructor(gl: WebGLRenderingContext)
  
  createVideoTexture(
    id: string,
    videoElement: HTMLVideoElement,
    options?: TextureOptions
  ): VideoTexture | null
  
  createImageTexture(
    id: string,
    imageElement: HTMLImageElement,
    options?: TextureOptions
  ): ImageTexture | null
  
  getTexture(id: string): VideoTexture | ImageTexture | null
  hasTexture(id: string): boolean
  removeTexture(id: string): void
  
  updateVideoTextures(): void  // 更新所有视频纹理
  
  getMemoryUsage(): number  // 获取纹理占用内存（字节）
  
  destroy(): void
}
```

**实现要点**
- 使用 Map 存储纹理：Map<id, Texture>
- 视频纹理每帧更新（在渲染循环中调用 updateVideoTextures）
- LRU 缓存策略，超出内存限制时卸载旧纹理
- 默认纹理参数：LINEAR 过滤，CLAMP_TO_EDGE 包裹

**依赖关系**
- 依赖 M2 的 WebGLContext
- 依赖 M1 的 webgl-utils

---

#### 文件：`webgl/texture/VideoTexture.ts`

**职责**
- 封装视频纹理
- 处理视频纹理更新

**核心功能**
- 从 video 元素创建纹理
- 检测视频是否需要更新
- 更新纹理数据

**对外接口**
```typescript
export class VideoTexture {
  readonly id: string
  readonly texture: WebGLTexture
  readonly videoElement: HTMLVideoElement
  
  constructor(
    gl: WebGLRenderingContext,
    id: string,
    videoElement: HTMLVideoElement,
    options?: TextureOptions
  )
  
  needsUpdate(): boolean  // 检查视频是否有新帧
  update(): void          // 更新纹理
  
  bind(unit?: number): void
  unbind(): void
  
  getWidth(): number
  getHeight(): number
  getMemoryUsage(): number
  
  destroy(): void
}
```

**实现要点**
- 使用 `gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement)`
- 检测 `video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA`
- 避免每帧都更新（检查 video 的 currentTime 变化）
- 处理视频尺寸变化

---

#### 文件：`webgl/texture/ImageTexture.ts`

**职责**
- 封装图片纹理

**核心功能**
- 从 image 元素创建纹理
- 生成 Mipmap

**对外接口**
```typescript
export class ImageTexture {
  readonly id: string
  readonly texture: WebGLTexture
  readonly imageElement: HTMLImageElement
  
  constructor(
    gl: WebGLRenderingContext,
    id: string,
    imageElement: HTMLImageElement,
    options?: TextureOptions
  )
  
  bind(unit?: number): void
  unbind(): void
  
  getWidth(): number
  getHeight(): number
  getMemoryUsage(): number
  
  destroy(): void
}
```

**实现要点**
- 使用 `gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement)`
- 图片加载完成后生成 Mipmap
- 静态纹理，不需要更新

---

#### 文件：`webgl/texture/TextureCache.ts`

**职责**
- LRU 缓存实现
- 内存管理策略

**核心功能**
- LRU 缓存
- 内存预算管理
- 自动清理

**对外接口**
```typescript
export class TextureCache {
  constructor(maxMemoryBytes: number)
  
  add(id: string, texture: VideoTexture | ImageTexture): void
  get(id: string): VideoTexture | ImageTexture | null
  remove(id: string): void
  has(id: string): boolean
  
  touch(id: string): void  // 标记为最近使用
  
  getTotalMemory(): number
  getMaxMemory(): number
  
  gc(): void  // 垃圾回收，清理超出预算的纹理
  
  clear(): void
}
```

**实现要点**
- 使用双向链表 + Map 实现 LRU
- 每次访问更新访问时间
- 超出内存预算时删除最久未使用的纹理

---

### M5: 几何体管理器

#### 文件：`webgl/geometry/GeometryManager.ts`

**职责**
- 管理几何体资源
- 提供常用几何体

**核心功能**
- 创建和缓存几何体
- 提供单位四边形

**对外接口**
```typescript
export class GeometryManager {
  constructor(gl: WebGLRenderingContext)
  
  getQuad(): QuadGeometry  // 获取单位四边形（-0.5 到 0.5）
  
  destroy(): void
}
```

**实现要点**
- 单例模式，所有 Clip 共享同一个四边形
- 预创建常用几何体

**依赖关系**
- 依赖 M2 的 WebGLContext

---

#### 文件：`webgl/geometry/QuadGeometry.ts`

**职责**
- 四边形几何体

**核心功能**
- 创建四边形顶点数据
- 绑定到 WebGL Buffer

**对外接口**
```typescript
export interface GeometryBuffers {
  position: WebGLBuffer
  texCoord: WebGLBuffer
  indices: WebGLBuffer
  indexCount: number
}

export class QuadGeometry {
  readonly buffers: GeometryBuffers
  
  constructor(gl: WebGLRenderingContext)
  
  bind(program: ShaderProgram): void
  draw(): void
  unbind(): void
  
  destroy(): void
}
```

**实现要点**
- 顶点数据：4 个顶点，6 个索引（2 个三角形）
- 位置坐标：[-0.5, -0.5] 到 [0.5, 0.5]
- UV 坐标：[0, 0] 到 [1, 1]
- 使用 Index Buffer 减少顶点数

**顶点数据示例**
```
positions: [
  -0.5, -0.5, 0.0,  // 左下
   0.5, -0.5, 0.0,  // 右下
   0.5,  0.5, 0.0,  // 右上
  -0.5,  0.5, 0.0   // 左上
]

texCoords: [
  0.0, 1.0,  // 左下
  1.0, 1.0,  // 右下
  1.0, 0.0,  // 右上
  0.0, 0.0   // 左上
]

indices: [
  0, 1, 2,  // 第一个三角形
  0, 2, 3   // 第二个三角形
]
```

---

### M6: WebGL 渲染器核心

#### 文件：`webgl/core/WebGLRenderer.ts`

**职责**
- 渲染器主类
- 协调所有渲染模块
- 提供渲染 API

**核心功能**
- 初始化渲染器
- 启动/停止渲染循环
- 执行渲染
- 管理渲染状态

**对外接口**
```typescript
export interface RendererOptions {
  canvas: HTMLCanvasElement
  stage: { width: number; height: number }
  backgroundColor?: string
}

export class WebGLRenderer {
  constructor(options: RendererOptions)
  
  // 生命周期
  initialize(): Promise<void>
  start(): void
  stop(): void
  destroy(): void
  
  // 渲染控制
  render(): void
  
  // 访问器
  getContext(): WebGLRenderingContext | null
  getSceneManager(): SceneManager
  getTextureManager(): TextureManager
  getShaderManager(): ShaderManager
  
  // 状态
  isInitialized(): boolean
  isRunning(): boolean
  
  // 事件
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
}
```

**实现要点**
- 初始化流程：
  1. 创建 WebGLContext
  2. 创建 ShaderManager 并加载基础 Shader
  3. 创建 TextureManager
  4. 创建 GeometryManager
  5. 创建 SceneManager
  6. 创建 RenderLoop
- 渲染流程：
  1. 清空画布
  2. 更新视频纹理（textureManager.updateVideoTextures()）
  3. 渲染场景（sceneManager.render()）
  4. 触发渲染事件
- 使用 EventEmitter 处理事件

**依赖关系**
- 依赖 M2、M3、M4、M5
- 被 M7 使用

---

#### 文件：`webgl/core/RenderLoop.ts`

**职责**
- 管理渲染循环
- 帧时间计算

**核心功能**
- requestAnimationFrame 循环
- FPS 计算
- 帧时间差计算

**对外接口**
```typescript
export class RenderLoop {
  constructor(callback: (deltaTime: number) => void)
  
  start(): void
  stop(): void
  
  isRunning(): boolean
  getFPS(): number
  getDeltaTime(): number
  
  destroy(): void
}
```

**实现要点**
- 使用 requestAnimationFrame
- 计算 deltaTime = currentTime - lastTime
- 平滑 FPS（移动平均）
- 处理标签页不可见（暂停循环）

---

#### 文件：`webgl/core/RenderState.ts`

**职责**
- WebGL 状态缓存
- 避免重复的 gl 调用

**核心功能**
- 缓存当前绑定的 Program、Texture、Buffer
- 只在状态改变时才调用 WebGL API

**对外接口**
```typescript
export class RenderState {
  constructor(gl: WebGLRenderingContext)
  
  useProgram(program: WebGLProgram | null): void
  bindTexture(target: number, texture: WebGLTexture | null, unit?: number): void
  bindBuffer(target: number, buffer: WebGLBuffer | null): void
  
  setBlend(enabled: boolean): void
  setDepthTest(enabled: boolean): void
  
  reset(): void  // 重置所有状态
}
```

**实现要点**
- 缓存当前状态：currentProgram, currentTexture[], currentBuffer[]
- 每次 bind 前检查是否已经绑定
- 减少不必要的 gl 调用

---

### M7: 场景管理器

#### 文件：`webgl/scene/SceneManager.ts`

**职责**
- 管理渲染场景
- 维护 Layer 和 RenderNode
- 执行渲染

**核心功能**
- 构建场景图
- 更新场景（基于 currentTime）
- 裁剪不可见节点
- 排序渲染队列
- 执行渲染

**对外接口**
```typescript
export class SceneManager {
  constructor(
    renderer: WebGLRenderer,
    stage: { width: number; height: number }
  )
  
  // 场景构建
  buildSceneFromTracks(tracks: Track[]): void
  
  // 更新
  update(currentTime: number): void
  
  // 渲染
  render(): void
  
  // Layer 管理
  addLayer(layer: Layer): void
  removeLayer(layerId: string): void
  getLayer(layerId: string): Layer | null
  getLayers(): Layer[]
  
  // 相机
  getCamera(): Camera
  
  // 清理
  clear(): void
  destroy(): void
}
```

**实现要点**
- 从 Timeline Store 的 tracks 构建场景
- 每个 Track 对应一个 Layer
- Layer 按 order 排序（order 小的先渲染，在底层）
- update() 时计算当前时间可见的 Clip
- 裁剪：startTime <= currentTime < startTime + duration
- 渲染时按 Layer 顺序渲染

**依赖关系**
- 依赖 M6 的 WebGLRenderer
- 使用 Layer 和 RenderNode

---

#### 文件：`webgl/scene/Layer.ts`

**职责**
- 表示一个渲染图层（对应 Track）

**核心功能**
- 管理 RenderNode 列表
- Layer 级别的属性（visible, opacity）

**对外接口**
```typescript
export class Layer {
  readonly id: string
  readonly trackId: string
  readonly order: number
  
  visible: boolean
  opacity: number
  
  constructor(trackId: string, order: number)
  
  // Node 管理
  addNode(node: RenderNode): void
  removeNode(nodeId: string): void
  getNode(nodeId: string): RenderNode | null
  getNodes(): RenderNode[]
  
  // 更新
  update(currentTime: number): void
  
  // 渲染
  render(renderer: WebGLRenderer): void
  
  destroy(): void
}
```

**实现要点**
- 维护 RenderNode 数组
- update() 时更新所有 Node 的可见性
- render() 时遍历可见 Node 并渲染

---

#### 文件：`webgl/scene/RenderNode.ts`

**职责**
- 表示一个可渲染对象（对应 Clip）

**核心功能**
- 存储 Clip 的渲染数据
- 计算变换矩阵
- 执行渲染

**对外接口**
```typescript
export interface RenderNodeData {
  clipId: string
  type: 'video' | 'image'
  
  // 时间信息
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  
  // 变换信息
  position: { x: number; y: number }
  scale: number
  rotation: number
  opacity: number
  
  // 资源信息
  resourceSrc: string
}

export class RenderNode {
  readonly id: string
  readonly data: RenderNodeData
  
  visible: boolean
  
  constructor(data: RenderNodeData)
  
  // 更新
  update(currentTime: number): void
  
  // 计算变换矩阵
  getModelMatrix(): Float32Array
  
  // 渲染
  render(renderer: WebGLRenderer): void
  
  // 辅助
  isVisibleAtTime(time: number): boolean
  getClipTime(currentTime: number): number  // 计算 Clip 内部播放时间
  
  destroy(): void
}
```

**实现要点**
- isVisibleAtTime()：检查 startTime <= time < startTime + duration
- getClipTime()：返回 (currentTime - startTime) + trimStart
- getModelMatrix()：计算变换矩阵
  1. 平移矩阵（position）
  2. 旋转矩阵（rotation）
  3. 缩放矩阵（scale）
  4. 组合：T * R * S
- render()：
  1. 绑定纹理
  2. 绑定 Shader
  3. 设置 Uniform（矩阵、opacity）
  4. 绑定几何体
  5. Draw Call

---

#### 文件：`webgl/scene/Camera.ts`

**职责**
- 相机系统
- 提供投影矩阵

**核心功能**
- 创建正交投影矩阵
- 处理视口变化

**对外接口**
```typescript
export class Camera {
  constructor(
    width: number,
    height: number
  )
  
  getProjectionMatrix(): Float32Array
  getViewMatrix(): Float32Array
  
  setViewport(width: number, height: number): void
  
  destroy(): void
}
```

**实现要点**
- 使用正交投影（2D）
- 投影矩阵：ortho(0, width, 0, height, -1, 1)
- 视图矩阵：单位矩阵（相机在原点）
- 坐标系：左下角为原点，X 向右，Y 向上

---

### M8: 视频同步系统

#### 文件：`webgl/sync/VideoSyncManager.ts`

**职责**
- 管理所有视频元素
- 同步视频播放时间

**核心功能**
- 创建和管理视频元素
- 同步视频时间到 Timeline
- 处理播放/暂停

**对外接口**
```typescript
export interface VideoElement {
  id: string
  element: HTMLVideoElement
  clipId: string
  resourceSrc: string
}

export class VideoSyncManager {
  constructor()
  
  // 视频管理
  createVideo(clipId: string, resourceSrc: string): HTMLVideoElement
  getVideo(clipId: string): HTMLVideoElement | null
  removeVideo(clipId: string): void
  
  // 同步
  syncVideos(currentTime: number, visibleNodes: RenderNode[]): void
  
  // 播放控制
  playAll(): void
  pauseAll(): void
  
  destroy(): void
}
```

**实现要点**
- 维护 Map<clipId, VideoElement>
- 创建隐藏的 video 元素（display: none）
- syncVideos() 逻辑：
  ```
  for each visibleNode:
    video = getVideo(node.clipId)
    targetTime = node.getClipTime(currentTime)
    
    if abs(video.currentTime - targetTime) > SYNC_THRESHOLD:
      video.currentTime = targetTime
    
    if isPlaying and video.paused:
      video.play()
    else if not isPlaying and not video.paused:
      video.pause()
  ```
- SYNC_THRESHOLD = 0.1 秒（避免频繁 seek）
- 处理 video 事件：waiting, canplay, ended

**依赖关系**
- 被 M10 使用
- 与 TimeController 配合

---

#### 文件：`webgl/sync/TimeController.ts`

**职责**
- 控制播放时间
- 与 Timeline Store 同步

**核心功能**
- 管理播放状态
- 更新当前时间
- 处理 seek 操作

**对外接口**
```typescript
export class TimeController {
  constructor()
  
  // 播放控制
  play(): void
  pause(): void
  stop(): void
  seek(time: number): void
  
  // 状态查询
  isPlaying(): boolean
  getCurrentTime(): number
  
  // 更新（在渲染循环中调用）
  update(deltaTime: number): void
  
  // 事件
  on(event: 'play' | 'pause' | 'timeupdate', callback: Function): void
  off(event: string, callback: Function): void
}
```

**实现要点**
- 播放时每帧更新 currentTime += deltaTime
- 触发 timeupdate 事件通知外部
- 与 Timeline Store 双向同步

---

### M9: 音频混合系统

#### 文件：`audio/AudioMixer.ts`

**职责**
- 管理音频上下文
- 混合多轨音频

**核心功能**
- 创建 AudioContext
- 管理音频节点
- 音频混合
- 音量控制

**对外接口**
```typescript
export class AudioMixer {
  constructor()
  
  // 初始化
  initialize(): Promise<void>
  
  // 音频管理
  addAudioClip(clipId: string, element: HTMLAudioElement | HTMLVideoElement): AudioNode
  removeAudioClip(clipId: string): void
  getAudioNode(clipId: string): AudioNode | null
  
  // 混合
  updateMix(currentTime: number, visibleNodes: RenderNode[]): void
  
  // 播放控制
  play(): void
  pause(): void
  
  // 音量
  setMasterVolume(volume: number): void
  setClipVolume(clipId: string, volume: number): void
  
  destroy(): void
}
```

**实现要点**
- 创建 AudioContext（注意用户手势激活）
- Audio Graph：
  ```
  MediaElementSource → GainNode → AudioDestination
  ```
- 每个 Clip 一个 GainNode 控制音量
- updateMix() 逻辑：
  ```
  for each visibleNode with audio:
    audioNode = getAudioNode(node.clipId)
    targetTime = node.getClipTime(currentTime)
    
    if abs(audioElement.currentTime - targetTime) > SYNC_THRESHOLD:
      audioElement.currentTime = targetTime
    
    gainNode.gain.value = node.data.volume * node.data.opacity
  ```

**依赖关系**
- 独立模块，不依赖 WebGL
- 被 M10 使用

---

#### 文件：`audio/AudioNode.ts`

**职责**
- 封装单个音频节点

**核心功能**
- 管理 AudioContext 节点
- 音量控制

**对外接口**
```typescript
export class AudioNode {
  readonly id: string
  readonly clipId: string
  readonly element: HTMLAudioElement | HTMLVideoElement
  
  constructor(
    audioContext: AudioContext,
    clipId: string,
    element: HTMLAudioElement | HTMLVideoElement
  )
  
  setVolume(volume: number): void
  getVolume(): number
  
  connect(destination: AudioNode | AudioDestinationNode): void
  disconnect(): void
  
  destroy(): void
}
```

**实现要点**
- 创建 MediaElementAudioSourceNode
- 创建 GainNode
- 连接：Source → Gain → Destination

---

#### 文件：`audio/AudioSyncController.ts`

**职责**
- 音频同步控制
- 延迟补偿

**核心功能**
- 测量音频延迟
- 补偿延迟

**对外接口**
```typescript
export class AudioSyncController {
  constructor(audioContext: AudioContext)
  
  getOutputLatency(): number
  compensateDelay(targetTime: number): number
  
  destroy(): void
}
```

**实现要点**
- 使用 AudioContext.outputLatency（如果可用）
- 或假设固定延迟（如 50ms）
- compensateDelay()：返回 targetTime - latency

---

### M10: Player 组件

#### 文件：`PlayerCanvas.tsx`

**职责**
- React 组件封装
- 集成 WebGL Renderer 和 Audio Mixer
- 与 Timeline Store 通信

**核心功能**
- 创建 Canvas 元素
- 初始化渲染器
- 响应 Timeline 状态变化
- 提供播放控制 API

**对外接口**
```typescript
export interface PlayerCanvasProps {
  stage: { width: number; height: number }
  className?: string
  onReady?: () => void
  onError?: (error: Error) => void
}

export interface PlayerCanvasRef {
  play(): void
  pause(): void
  seek(time: number): void
  captureFrame(): Blob | null
}

export const PlayerCanvas = forwardRef<PlayerCanvasRef, PlayerCanvasProps>(
  (props, ref) => {
    // 实现
  }
)
```

**实现要点**
- 使用 useRef 管理 Canvas 和 Renderer
- 使用 useWebGLRenderer Hook 初始化渲染器
- 订阅 Timeline Store 变化
- useEffect 监听 tracks/currentTime/isPlaying 变化
- 通过 useImperativeHandle 暴露 API
- 组件卸载时清理资源

**依赖关系**
- 依赖 M6 的 WebGLRenderer
- 依赖 M9 的 AudioMixer
- 依赖 Timeline Store

---

#### 文件：`hooks/useWebGLRenderer.ts`

**职责**
- WebGL Renderer 的 React Hook 封装

**核心功能**
- 初始化 Renderer
- 处理生命周期

**对外接口**
```typescript
export interface UseWebGLRendererOptions {
  canvas: HTMLCanvasElement | null
  stage: { width: number; height: number }
  onReady?: () => void
  onError?: (error: Error) => void
}

export function useWebGLRenderer(options: UseWebGLRendererOptions) {
  const [renderer, setRenderer] = useState<WebGLRenderer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // 初始化和清理逻辑
  
  return { renderer, isReady, error }
}
```

**实现要点**
- useEffect 中初始化 Renderer
- 依赖 canvas 和 stage 变化
- 清理函数中销毁 Renderer

---

### M11: Timeline 集成

#### 文件：`hooks/usePlayerSync.ts`

**职责**
- 同步 Timeline 和 Player

**核心功能**
- 监听 Timeline 状态
- 更新 Player 状态

**对外接口**
```typescript
export interface UsePlayerSyncOptions {
  renderer: WebGLRenderer | null
  audioMixer: AudioMixer | null
}

export function usePlayerSync(options: UsePlayerSyncOptions) {
  // 订阅 Timeline Store
  // 更新 Scene
  // 同步时间
  // 控制播放
}
```

**实现要点**
- 使用 Zustand 的 subscribe 监听变化
- tracks 变化时重建场景
- currentTime 变化时更新场景
- isPlaying 变化时控制播放

**依赖关系**
- 依赖 Timeline Store
- 依赖 M10 的 Renderer 和 AudioMixer

---

### M12: 类型定义

#### 文件：`types/webgl.ts`

**职责**
- WebGL 相关类型

**内容**
```typescript
export interface WebGLContextOptions {
  alpha?: boolean
  antialias?: boolean
  depth?: boolean
  stencil?: boolean
  powerPreference?: 'default' | 'high-performance' | 'low-power'
}

export interface TextureOptions {
  wrapS?: number
  wrapT?: number
  minFilter?: number
  magFilter?: number
  flipY?: boolean
}

// ... 其他类型
```

---

#### 文件：`types/renderer.ts`

**职责**
- 渲染器相关类型

**内容**
```typescript
export interface RendererOptions {
  canvas: HTMLCanvasElement
  stage: { width: number; height: number }
  backgroundColor?: string
}

export interface RenderStats {
  fps: number
  drawCalls: number
  triangles: number
  textures: number
}

// ... 其他类型
```

---

#### 文件：`types/scene.ts`

**职责**
- 场景相关类型

**内容**
```typescript
export interface LayerData {
  id: string
  trackId: string
  order: number
  visible: boolean
  opacity: number
}

export interface RenderNodeData {
  clipId: string
  type: 'video' | 'image'
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  position: { x: number; y: number }
  scale: number
  rotation: number
  opacity: number
  resourceSrc: string
}

// ... 其他类型
```

---

## 5. 开发顺序

### Phase 1: 基础设施（第 1 周）

**目标：搭建基础框架**

1. **M1: 基础设施**（2-3 天）
   - [ ] 实现 `math.ts`（矩阵和向量运算）
   - [ ] 实现 `webgl-utils.ts`（WebGL 工具函数）
   - [ ] 编写单元测试

2. **M2: WebGL Context 管理**（2-3 天）
   - [ ] 实现 `WebGLContext.ts`
   - [ ] 测试 WebGL 1.0/2.0 初始化
   - [ ] 测试扩展检测
   - [ ] 测试上下文丢失恢复

3. **M12: 类型定义**（1 天）
   - [ ] 定义所有 TypeScript 类型
   - [ ] 导出类型模块

**验收标准**
- WebGL Context 成功创建
- 数学工具函数正确运行
- 类型系统完整

---

### Phase 2: 渲染基础（第 2 周）

**目标：实现基础渲染能力**

1. **M3: 基础 Shader 系统**（3-4 天）
   - [ ] 实现 `ShaderManager.ts`
   - [ ] 实现 `ShaderProgram.ts`
   - [ ] 编写 GLSL Shader（base.vert/frag, video.vert/frag）
   - [ ] 测试 Shader 编译和链接

2. **M5: 几何体管理器**（1-2 天）
   - [ ] 实现 `GeometryManager.ts`
   - [ ] 实现 `QuadGeometry.ts`
   - [ ] 测试四边形渲染

3. **简单渲染测试**（1 天）
   - [ ] 创建测试页面
   - [ ] 渲染单色四边形
   - [ ] 验证坐标系统

**验收标准**
- 能在 Canvas 上渲染四边形
- Shader 正确工作
- 坐标变换正确

---

### Phase 3: 纹理系统（第 3 周）

**目标：实现纹理加载和渲染**

1. **M4: 纹理管理器**（3-4 天）
   - [ ] 实现 `TextureManager.ts`
   - [ ] 实现 `VideoTexture.ts`
   - [ ] 实现 `ImageTexture.ts`
   - [ ] 实现 `TextureCache.ts`
   - [ ] 测试纹理创建和更新

2. **纹理渲染测试**（2-3 天）
   - [ ] 渲染静态图片
   - [ ] 渲染视频（单个）
   - [ ] 测试纹理缓存

**验收标准**
- 能渲染图片纹理
- 能渲染视频纹理（播放流畅）
- 纹理缓存正常工作

---

### Phase 4: 渲染器核心（第 4 周）

**目标：完整的渲染管线**

1. **M6: WebGL 渲染器核心**（4-5 天）
   - [ ] 实现 `WebGLRenderer.ts`
   - [ ] 实现 `RenderLoop.ts`
   - [ ] 实现 `RenderState.ts`
   - [ ] 集成所有模块
   - [ ] 测试渲染循环

2. **多纹理渲染测试**（1-2 天）
   - [ ] 渲染多个图片
   - [ ] 渲染多个视频
   - [ ] 测试性能

**验收标准**
- 渲染循环稳定运行（60fps）
- 能同时渲染多个纹理
- 状态管理正确

---

### Phase 5: 场景管理（第 5 周）

**目标：场景图和层级管理**

1. **M7: 场景管理器**（3-4 天）
   - [ ] 实现 `SceneManager.ts`
   - [ ] 实现 `Layer.ts`
   - [ ] 实现 `RenderNode.ts`
   - [ ] 实现 `Camera.ts`
   - [ ] 测试场景构建

2. **场景渲染测试**（2-3 天）
   - [ ] 从 Timeline 数据构建场景
   - [ ] 测试层级排序
   - [ ] 测试时间裁剪
   - [ ] 测试变换（位移、缩放、旋转）

**验收标准**
- 场景正确构建
- 层级顺序正确（order 小的在底层）
- 只渲染可见 Clip
- 变换效果正确

---

### Phase 6: 时间同步（第 6 周）

**目标：音视频精确同步**

1. **M8: 视频同步系统**（4-5 天）
   - [ ] 实现 `VideoSyncManager.ts`
   - [ ] 实现 `TimeController.ts`
   - [ ] 测试视频时间同步
   - [ ] 测试播放/暂停/seek

2. **同步测试**（1-2 天）
   - [ ] 多视频同步测试
   - [ ] 精度测试（帧级）
   - [ ] 边界情况测试

**验收标准**
- 视频时间精确同步（误差 < 100ms）
- 播放/暂停响应及时
- Seek 操作流畅

---

### Phase 7: 音频系统（第 7 周）

**目标：音频混合和同步**

1. **M9: 音频混合系统**（4-5 天）
   - [ ] 实现 `AudioMixer.ts`
   - [ ] 实现 `AudioNode.ts`
   - [ ] 实现 `AudioSyncController.ts`
   - [ ] 测试音频混合
   - [ ] 测试音视频同步

2. **音频测试**（1-2 天）
   - [ ] 多轨音频混合
   - [ ] 音量控制
   - [ ] 音视频同步精度

**验收标准**
- 多轨音频正确混合
- 音视频同步（误差 < 40ms）
- 音量控制正常

---

### Phase 8: React 集成（第 8 周）

**目标：完整的 Player 组件**

1. **M10: Player 组件**（3-4 天）
   - [ ] 实现 `PlayerCanvas.tsx`
   - [ ] 实现 `useWebGLRenderer.ts`
   - [ ] 集成 Renderer 和 AudioMixer
   - [ ] 测试组件生命周期

2. **M11: Timeline 集成**（2-3 天）
   - [ ] 实现 `usePlayerSync.ts`
   - [ ] 连接 Timeline Store
   - [ ] 测试双向同步
   - [ ] 测试播放控制

3. **完整测试**（1-2 天）
   - [ ] 端到端测试
   - [ ] 性能测试
   - [ ] 兼容性测试
   - [ ] Bug 修复

**验收标准**
- Player 组件完整工作
- 与 Timeline 双向同步
- 播放控制流畅
- 性能达标（60fps，5+ 视频）

---

## 6. 接口定义

### 6.1 模块间接口

```typescript
// WebGLRenderer → SceneManager
interface RendererToScene {
  renderer: WebGLRenderer
  getTextureManager(): TextureManager
  getShaderManager(): ShaderManager
  getGeometryManager(): GeometryManager
}

// SceneManager → RenderNode
interface SceneToNode {
  currentTime: number
  camera: Camera
  renderer: WebGLRenderer
}

// RenderNode → TextureManager
interface NodeToTexture {
  getTexture(resourceSrc: string): Texture | null
}

// VideoSyncManager → RenderNode
interface SyncToNode {
  visibleNodes: RenderNode[]
  currentTime: number
  isPlaying: boolean
}

// PlayerCanvas → Timeline Store
interface PlayerToTimeline {
  tracks: Track[]
  currentTime: number
  isPlaying: boolean
}
```

### 6.2 事件接口

```typescript
// Renderer 事件
interface RendererEvents {
  'initialized': () => void
  'render:start': () => void
  'render:end': () => void
  'error': (error: Error) => void
}

// TimeController 事件
interface TimeControllerEvents {
  'play': () => void
  'pause': () => void
  'timeupdate': (time: number) => void
  'seek': (time: number) => void
}

// SceneManager 事件
interface SceneManagerEvents {
  'scene:built': (layers: Layer[]) => void
  'scene:updated': (visibleNodes: RenderNode[]) => void
}
```

---

## 7. 测试策略

### 7.1 单元测试

**测试工具**: Jest + @testing-library/react

**覆盖模块**
- M1: 数学工具函数
- M2: WebGL Context（模拟 WebGL）
- M3: Shader 编译（模拟 WebGL）
- M4: 纹理管理（模拟纹理）
- M5: 几何体

**测试用例示例**
```typescript
// math.ts
describe('Mat4', () => {
  it('should create identity matrix', () => {
    const mat = Mat4.identity()
    expect(mat).toEqual(new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 
