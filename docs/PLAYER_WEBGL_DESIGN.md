# Player WebGL 渲染引擎详细设计方案

## 文档信息

- **项目名称**: CLUV 非线性编辑软件
- **模块**: Player 播放器
- **技术方案**: WebGL 渲染引擎
- **版本**: v1.0
- **日期**: 2024
- **作者**: AI Assistant

---

## 目录

1. [概述](#1-概述)
2. [整体架构](#2-整体架构)
3. [核心模块设计](#3-核心模块设计)
4. [渲染管线](#4-渲染管线)
5. [Shader 系统](#5-shader-系统)
6. [纹理管理](#6-纹理管理)
7. [音频系统](#7-音频系统)
8. [时间同步机制](#8-时间同步机制)
9. [数据流设计](#9-数据流设计)
10. [性能优化策略](#10-性能优化策略)
11. [实现路线图](#11-实现路线图)
12. [技术风险与应对](#12-技术风险与应对)

---

## 1. 概述

### 1.1 设计目标

- **极致性能**: 利用 GPU 加速，支持大量片段同时渲染
- **Shader 支持**: 内置可扩展的 Shader 系统，支持各种视频特效
- **实时渲染**: 60fps 流畅播放，帧级精确控制
- **专业级功能**: 支持色彩校正、混合模式、3D 变换等

### 1.2 技术选型

- **渲染引擎**: WebGL 2.0 (降级支持 WebGL 1.0)
- **数学库**: glMatrix (矩阵和向量运算)
- **音频处理**: Web Audio API
- **视频解码**: HTMLVideoElement + VideoTexture
- **状态管理**: 与现有 Zustand Timeline Store 集成

### 1.3 核心特性

- GPU 加速的视频/图片合成
- 自定义 GLSL Shader 支持
- 实时特效处理（模糊、色彩、变形等）
- 多层混合模式（Normal, Multiply, Screen, Overlay 等）
- 3D 空间变换（位移、旋转、缩放、透视）
- 高效的纹理缓存和管理
- 帧精确的时间同步

---

## 2. 整体架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Player Component                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  WebGL Renderer                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │   Scene     │  │   Camera     │  │   Viewport   │ │  │
│  │  │   Manager   │  │   System     │  │   Controller │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Render Pipeline                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  Geometry   │→ │   Shader     │→ │  Framebuffer │ │  │
│  │  │  Generator  │  │   Processor  │  │   Composer   │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Resource Management                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  Texture    │  │   Shader     │  │   Geometry   │ │  │
│  │  │  Manager    │  │   Manager    │  │   Pool       │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Audio System                             │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ AudioContext  │  │ AudioMixer   │  │ SyncController   │ │
│  └───────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Timeline Store (Zustand)                   │
│     Tracks | Clips | CurrentTime | PlayState                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

#### WebGL Renderer
- 管理 WebGL 上下文生命周期
- 协调渲染管线各个阶段
- 处理渲染循环和帧同步

#### Scene Manager
- 管理场景中的所有可渲染对象（Layer）
- 维护场景图（Scene Graph）
- 处理层级排序和裁剪

#### Render Pipeline
- 几何生成：创建渲染所需的顶点数据
- Shader 处理：应用材质和特效
- 帧缓冲合成：多层混合和后处理

#### Resource Management
- 纹理管理：加载、缓存、更新视频/图片纹理
- Shader 管理：编译、链接、缓存 Shader 程序
- 几何池：复用常用几何体（四边形、全屏三角形）

#### Audio System
- 音频解码和播放
- 多轨音频混合
- 与视频时间同步

---

## 3. 核心模块设计

### 3.1 WebGL Renderer

#### 职责
- 初始化和管理 WebGL 上下文
- 执行渲染循环
- 管理渲染状态

#### 关键组件

**Context Manager**
- WebGL 上下文创建和配置
- 扩展功能检测和启用
- 上下文丢失恢复机制

**Render Loop**
- requestAnimationFrame 驱动
- 帧时间计算和同步
- 自适应帧率控制

**State Manager**
- WebGL 状态缓存（避免重复设置）
- 混合模式管理
- 深度测试、模板测试控制

#### 配置参数

```
Context Options:
- alpha: true (支持透明背景)
- antialias: true (抗锯齿)
- depth: true (深度缓冲)
- stencil: false (暂不需要模板)
- preserveDrawingBuffer: false (性能优化)
- powerPreference: "high-performance" (高性能模式)
```

### 3.2 Scene Manager

#### 场景图结构

```
Scene
├── Stage (根节点，对应 CutProtocol.stage)
│   ├── Layer 1 (Track 1, order=0, z-index highest)
│   │   ├── VideoClip 1
│   │   └── ImageClip 1
│   ├── Layer 2 (Track 2, order=1)
│   │   └── VideoClip 2
│   └── Layer N (Track N, order=N, z-index lowest)
│       └── ClipN
```

#### Layer（图层）

每个 Timeline Track 对应一个 Layer：

**属性**
- id: Layer 唯一标识
- trackId: 对应的 Track ID
- order: 渲染顺序（从 Track.order 映射）
- visible: 是否可见
- locked: 是否锁定
- clips: 当前时间点活跃的 Clip 列表

**方法**
- addClip(): 添加 Clip 到 Layer
- removeClip(): 移除 Clip
- update(): 更新 Layer 状态
- render(): 渲染 Layer

#### Clip（片段）

每个 Timeline Clip 对应一个可渲染对象：

**属性**
- id: Clip 唯一标识
- type: 类型（video/image/text）
- layerId: 所属 Layer
- transform: 变换矩阵（4x4）
- material: 材质（纹理+Shader）
- visible: 是否可见
- blendMode: 混合模式

**变换属性**
- position: {x, y, z}
- scale: {x, y, z}
- rotation: {x, y, z} (欧拉角)
- opacity: 0-1

**时间属性**
- startTime: Clip 在 Timeline 上的起始时间
- duration: Clip 持续时间
- trimStart: 原始媒体的裁剪起点
- trimEnd: 原始媒体的裁剪终点

#### 可见性裁剪

**时间裁剪**
- 只渲染 currentTime 在 [startTime, startTime + duration] 范围内的 Clip
- 提前预加载即将可见的 Clip（预加载窗口：currentTime + 2 秒）

**空间裁剪**
- 视锥剔除：Clip 完全在视口外时跳过渲染
- 遮挡剔除：被完全遮挡的不透明 Clip 跳过渲染

### 3.3 Render Pipeline

#### 渲染流程

```
1. Update Phase (更新阶段)
   ├── 从 Timeline Store 获取 currentTime
   ├── 计算可见 Clip 列表
   ├── 更新视频纹理（从 video 元素上传到 GPU）
   └── 更新变换矩阵

2. Culling Phase (裁剪阶段)
   ├── 时间裁剪
   ├── 视锥裁剪
   └── 遮挡裁剪

3. Sort Phase (排序阶段)
   ├── 按 Layer.order 排序（远到近）
   └── 同 Layer 内按 Clip 添加顺序

4. Render Phase (渲染阶段)
   ├── Clear Framebuffer (清空帧缓冲)
   ├── For each Layer (按顺序渲染)
   │   ├── For each Clip in Layer
   │   │   ├── Bind Texture (绑定纹理)
   │   │   ├── Bind Shader (绑定 Shader)
   │   │   ├── Set Uniforms (设置 Uniform 变量)
   │   │   ├── Bind Geometry (绑定几何体)
   │   │   └── Draw Call (绘制)
   │   └── Apply Layer Effects (应用图层特效)
   └── Post-Processing (后处理)

5. Present Phase (呈现阶段)
   └── Swap Buffers (交换缓冲区)
```

#### Geometry Generator

**四边形生成器**
- 为每个 Clip 生成一个四边形（2 个三角形）
- 顶点数据：位置、UV 坐标、法线
- 支持 9-slice scaling（九宫格缩放，用于 UI）

**顶点数据格式**
```
Vertex {
  position: vec3 (x, y, z)
  uv: vec2 (u, v)
  normal: vec3 (nx, ny, nz)  // 可选，用于光照
}
```

**顶点缓冲复用**
- 所有 Clip 共享同一个单位四边形（-0.5 到 0.5）
- 通过 Model Matrix 变换到实际位置和大小

#### Shader Processor

**Shader 类型**
- Base Shader: 基础渲染（纹理映射 + 变换）
- Effect Shader: 特效 Shader（模糊、色彩调整等）
- Blend Shader: 混合模式 Shader

**Uniform 变量**
```
// 变换矩阵
uniform mat4 u_ModelMatrix;        // 模型矩阵
uniform mat4 u_ViewMatrix;         // 视图矩阵
uniform mat4 u_ProjectionMatrix;   // 投影矩阵

// 纹理
uniform sampler2D u_Texture;       // 主纹理
uniform vec2 u_TextureSize;        // 纹理尺寸

// 材质属性
uniform float u_Opacity;           // 不透明度
uniform vec4 u_Tint;               // 色调

// 时间
uniform float u_Time;              // 全局时间（用于动画）
uniform float u_ClipTime;          // Clip 内部时间

// 特效参数（可扩展）
uniform float u_EffectParam1;
uniform float u_EffectParam2;
...
```

#### Framebuffer Composer

**多 Pass 渲染**
- Pass 1: 渲染所有 Clip 到离屏 Framebuffer
- Pass 2: 应用后处理效果
- Pass 3: 渲染到屏幕

**混合模式实现**
- 在 Fragment Shader 中实现各种混合算法
- 支持：Normal, Multiply, Screen, Overlay, Add, Subtract 等
- 通过 gl.blendFunc 和 gl.blendEquation 组合实现

**后处理效果**
- Bloom（辉光）
- Color Grading（色彩分级）
- Vignette（暗角）
- Sharpen（锐化）
- 可链式组合多个效果

### 3.4 Camera System

#### 相机类型

**正交相机（Orthographic Camera）**
- 用于 2D 合成（主要使用）
- 投影矩阵：保持物体大小不随距离变化
- 视口范围：[0, stage.width] × [0, stage.height]

**透视相机（Perspective Camera）**
- 用于 3D 效果（可选）
- 投影矩阵：模拟真实相机透视
- FOV、Aspect Ratio、Near/Far Plane 配置

#### 坐标系统

**世界坐标系**
- 原点：Stage 左下角 (0, 0)
- X 轴：向右为正
- Y 轴：向上为正
- Z 轴：向外（朝向观察者）为正

**屏幕坐标系**
- 原点：Canvas 左上角 (0, 0)
- 需要在 Vertex Shader 中转换

**归一化设备坐标（NDC）**
- WebGL 最终坐标系：[-1, 1] × [-1, 1] × [-1, 1]

#### 坐标变换链

```
Local Space (Clip 本地坐标)
    ↓ Model Matrix (位移、旋转、缩放)
World Space (世界坐标)
    ↓ View Matrix (相机变换)
View Space (观察空间)
    ↓ Projection Matrix (投影)
Clip Space (裁剪空间)
    ↓ Perspective Division (透视除法)
NDC (归一化设备坐标)
    ↓ Viewport Transform (视口变换)
Screen Space (屏幕坐标)
```

### 3.5 Viewport Controller

#### 自适应缩放

**Contain 模式（默认）**
- Stage 完整显示在 Viewport 内
- 保持宽高比
- 可能有黑边（Letterbox 或 Pillarbox）

**Cover 模式**
- Stage 填满 Viewport
- 保持宽高比
- 可能裁剪内容

**Fill 模式**
- Stage 拉伸填满 Viewport
- 不保持宽高比

#### 响应式处理

**Canvas 尺寸管理**
- 监听窗口 resize 事件
- 更新 Canvas width/height（物理像素）
- 更新 Canvas CSS size（显示尺寸）
- 支持 HiDPI/Retina 显示（devicePixelRatio）

**投影矩阵更新**
- Viewport 尺寸改变时重新计算投影矩阵
- 保持 Stage 宽高比不变

---

## 4. 渲染管线

### 4.1 初始化流程

```
1. 创建 Canvas 元素
2. 获取 WebGL 上下文
   - 尝试 WebGL 2.0
   - 降级到 WebGL 1.0
   - 失败则显示错误提示
3. 检测和启用扩展
   - OES_texture_float (浮点纹理)
   - WEBGL_lose_context (上下文丢失测试)
   - EXT_color_buffer_float (浮点颜色缓冲)
4. 初始化资源管理器
   - Texture Manager
   - Shader Manager
   - Geometry Pool
5. 编译和链接内置 Shader
6. 创建共享几何体（单位四边形）
7. 设置默认渲染状态
8. 启动渲染循环
```

### 4.2 主渲染循环

```
function renderLoop(timestamp) {
  // 1. 计算帧时间
  deltaTime = timestamp - lastTimestamp
  lastTimestamp = timestamp
  
  // 2. 同步 Timeline 时间
  currentTime = timelineStore.getCurrentTime()
  isPlaying = timelineStore.isPlaying()
  
  // 3. 更新场景
  sceneManager.update(currentTime, deltaTime)
  
  // 4. 裁剪不可见对象
  visibleClips = sceneManager.cullClips()
  
  // 5. 排序渲染队列
  renderQueue = sceneManager.sortClips(visibleClips)
  
  // 6. 更新纹理
  textureManager.updateVideoTextures()
  
  // 7. 渲染
  renderer.render(renderQueue)
  
  // 8. 统计和调试
  stats.update(deltaTime)
  
  // 9. 下一帧
  requestAnimationFrame(renderLoop)
}
```

### 4.3 渲染状态管理

#### 状态缓存策略

**问题**
- WebGL 状态切换开销大
- 频繁的 gl.useProgram, gl.bindTexture 等调用影响性能

**解决方案**
- 缓存当前绑定的 Shader、Texture、Buffer
- 只在状态实际改变时才调用 WebGL API
- 批量处理相同状态的 Draw Call

**状态对象**
```
RenderState {
  program: WebGLProgram | null
  texture: WebGLTexture | null
  vertexBuffer: WebGLBuffer | null
  indexBuffer: WebGLBuffer | null
  blendMode: BlendMode
  depthTest: boolean
  cullFace: boolean
}
```

#### 批处理（Batching）

**静态批处理**
- 合并使用相同 Shader 和 Texture 的 Clip
- 减少 Draw Call 数量
- 适用于图片等静态内容

**动态批处理**
- 运行时动态合并
- 适用于少量顶点的对象
- 视频由于纹理频繁更新，不适合批处理

### 4.4 多 Pass 渲染

#### Pass 结构

**Base Pass（基础渲染 Pass）**
- 目标：离屏 FBO
- 渲染所有 Clip 的基础内容
- 输出：RGB + Alpha 纹理

**Effect Pass（特效 Pass）**
- 目标：离屏 FBO
- 应用特效 Shader
- 可以有多个串联的特效 Pass
- 输出：处理后的纹理

**Composite Pass（合成 Pass）**
- 目标：屏幕
- 合成所有 Layer
- 应用最终的后处理
- 输出到 Canvas

#### Framebuffer 管理

**FBO 池**
- 预创建多个相同尺寸的 FBO
- 复用 FBO，减少创建销毁开销
- Ping-Pong 技术：在两个 FBO 间交替渲染

**纹理附件**
- Color Attachment：RGBA 纹理
- Depth Attachment：深度纹理（可选）
- Stencil Attachment：模板纹理（可选）

---

## 5. Shader 系统

### 5.1 Shader 架构

#### Shader 分类

**内置 Shader（Built-in Shaders）**
- Base Shader：基础纹理渲染
- Video Shader：视频纹理特殊处理（YUV 转 RGB 等）
- Image Shader：图片渲染
- Blend Shader：混合模式
- Effect Shader：基础特效库

**用户 Shader（Custom Shaders）**
- 用户上传的 GLSL 代码
- 动态编译和加载
- 参数可通过 UI 调整

#### Shader 管理器

**职责**
- 编译 Vertex Shader 和 Fragment Shader
- 链接 Shader Program
- 缓存编译结果
- 管理 Uniform 变量
- 错误处理和日志

**Shader 生命周期**
```
1. 加载 GLSL 源码（字符串或文件）
2. 预处理（宏展开、Include）
3. 编译 Vertex Shader
4. 编译 Fragment Shader
5. 链接 Program
6. 提取 Uniform 和 Attribute 位置
7. 缓存到 Shader Manager
8. 使用 Shader
9. （可选）热重载
10. 销毁 Shader
```

### 5.2 Base Shader

#### Vertex Shader 功能

**职责**
- 变换顶点到裁剪空间
- 传递 UV 坐标给 Fragment Shader
- 计算顶点相关的 Varying 变量

**输入（Attributes）**
```
attribute vec3 a_Position;  // 顶点位置
attribute vec2 a_UV;        // UV 坐标
attribute vec3 a_Normal;    // 法线（可选）
```

**输出（Varyings）**
```
varying vec2 v_UV;          // 插值后的 UV
varying vec3 v_Normal;      // 插值后的法线
varying vec3 v_WorldPos;    // 世界坐标
```

**Uniforms**
```
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;  // 法线变换矩阵
```

#### Fragment Shader 功能

**职责**
- 纹理采样
- 计算最终颜色
- 应用材质属性（opacity, tint）

**输入（Varyings）**
```
varying vec2 v_UV;
```

**输出**
```
gl_FragColor: vec4  // RGBA 颜色
```

**Uniforms**
```
uniform sampler2D u_Texture;
uniform float u_Opacity;
uniform vec4 u_Tint;
```

**核心逻辑**
```
1. 从纹理采样：color = texture2D(u_Texture, v_UV)
2. 应用色调：color *= u_Tint
3. 应用不透明度：color.a *= u_Opacity
4. 输出最终颜色：gl_FragColor = color
```

### 5.3 视频 Shader

#### 视频纹理处理

**问题**
- 浏览器视频解码可能输出 YUV 格式
- 需要 YUV 到 RGB 转换

**解决方案 1：浏览器自动转换**
- 使用 HTMLVideoElement 作为纹理源
- gl.texImage2D 会自动转换为 RGB
- 简单但性能稍差

**解决方案 2：手动 YUV 转换**
- 使用 Y、U、V 三个纹理
- 在 Fragment Shader 中转换
- 性能更好但实现复杂

**色彩空间**
- BT.709（HDTV 标准）
- BT.601（SDTV 标准）
- 需要根据视频元数据选择正确的转换矩阵

#### 视频特殊处理

**Alpha 通道处理**
- 某些视频有 Alpha 通道（WebM VP8/VP9）
- 需要正确处理透明度

**HDR 视频**
- 支持 HDR10、HLG 等 HDR 格式
- 色调映射（Tone Mapping）

### 5.4 Effect Shader 库

#### 基础特效

**1. 亮度/对比度/饱和度**
- Brightness: color.rgb += brightness
- Contrast: color.rgb = (color.rgb - 0.5) * contrast + 0.5
- Saturation: 转换到 HSV，调整 S 通道

**2. 色相/色温**
- Hue Shift: RGB → HSV → 旋转 H → RGB
- Temperature: 调整 R/B 通道平衡

**3. 模糊（Blur）**
- Gaussian Blur: 多 Pass 高斯模糊（横向 + 纵向）
- Box Blur: 简单平均模糊
- Motion Blur: 方向性模糊

**4. 锐化（Sharpen）**
- Unsharp Mask: 原图 + (原图 - 模糊图) * 强度
- Edge Enhancement: 边缘检测 + 叠加

**5. 色彩调整**
- Levels: 调整黑点、白点、中间调
- Curves: 自定义色调曲线
- Color Matrix: 4x4 颜色矩阵变换

#### 高级特效

**6. Chroma Key（色键抠像）**
- 根据颜色范围抠除背景
- 参数：目标颜色、容差、边缘柔化

**7. 扭曲（Distortion）**
- Barrel Distortion: 桶形畸变
- Pincushion Distortion: 枕形畸变
- Wave Distortion: 波浪扭曲

**8. 粒子效果**
- Noise: Perlin/Simplex 噪声
- Grain: 胶片颗粒效果
- Glitch: 故障艺术效果

**9. 光照效果**
- Bloom: 辉光/泛光
- Lens Flare: 镜头光晕
- God Rays: 光线散射

**10. 时间特效**
- Echo: 残影效果
- Time Displacement: 时间扭曲

### 5.5 混合模式

#### 混合公式

**Normal（正常）**
```
result = src
```

**Multiply（正片叠底）**
```
result = src * dst
```

**Screen（滤色）**
```
result = 1 - (1 - src) * (1 - dst)
```

**Overlay（叠加）**
```
if (dst < 0.5)
  result = 2 * src * dst
else
  result = 1 - 2 * (1 - src) * (1 - dst)
```

**Add（相加）**
```
result = clamp(src + dst, 0, 1)
```

**Subtract（相减）**
```
result = clamp(dst - src, 0, 1)
```

**Difference（差值）**
```
result = abs(src - dst)
```

#### 实现方式

**Shader 实现**
- 在 Fragment Shader 中采样下层纹理
- 应用混合公式
- 需要多 Pass 渲染

**硬件混合**
- 使用 gl.blendFunc 和 gl.blendEquation
- 性能更好但功能受限
- 只能实现部分混合模式

### 5.6 Shader 参数系统

#### 参数类型

- **float**: 标量（如 opacity, strength）
- **vec2**: 二维向量（如 position, scale）
- **vec3**: 三维向量（如 color RGB）
- **vec4**: 四维向量（如 color RGBA）
- **sampler2D**: 纹理采样器
- **mat4**: 4x4 矩阵（如变换矩阵）

#### 参数绑定

**Uniform Location 缓存**
- 编译后立即获取所有 Uniform 位置
- 缓存到 Map<string, WebGLUniformLocation>
- 避免每帧调用 gl.getUniformLocation

**批量设置**
- 按类型分组设置 Uniform
- 减少 WebGL API 调用次数

**动画支持**
- 参数可以随时间变化
- 支持缓动函数（Easing）
- 关键帧插值

---

## 6. 纹理管理

### 6.1 纹理类型

#### 视频纹理（Video Texture）

**特点**
- 动态更新（每帧或部分帧）
- 需要持续上传到 GPU
- 可能需要 YUV 转换

**创建流程**
```
1. 创建隐藏的 HTMLVideoElement
2. 设置 video.src
3. 监听 canplay 事件
4. 创建 WebGL Texture
5. 设置纹理参数（wrap, filter）
6. 在渲染循环中更新纹理
   - 调用 gl.texImage2D(video)
   - 或 gl.texSubImage2D(video)
```

**更新策略**
- **每帧更新**: 最准确但性能开销大
- **按需更新**: 检测 video.readyState 和当前时间
- **双缓冲**: 交替使用两个纹理，减少撕裂

#### 图片纹理（Image Texture）

**特点**
- 静态内容
- 一次加载，长期缓存
- 可以使用 Mipmap

**创建流程**
```
1. 创建 Image 对象
2. 设置 img.src
3. 监听 load 事件
4. 创建 WebGL Texture
5. 上传图片数据 gl.texImage2D(img)
6. 生成 Mipmap（可选）
```

**优化**
- 预加载：提前加载即将使用的图片
- 压缩纹理：使用 JPEG/WebP 减少内存
- 纹理图集（Atlas）：合并小图片

#### 渲染纹理（Render Texture）

**特点**
- 用于离屏渲染
- 作为 Framebuffer 的 Color Attachment
- 可以作为下一个 Pass 的输入

**用途**
- 多 Pass 特效
- 后处理
- 动态合成

### 6.2 纹理池（Texture Pool）

#### 池化策略

**问题**
- 频繁创建销毁纹理导致内存碎片
- WebGL 纹理创建有一定开销

**解决方案**
- 预创建一批常用尺寸的纹理
- 使用时从池中获取，释放时归还
- 定期清理长时间未使用的纹理

**池管理**
```
TexturePool {
  textures: Map<string, Texture[]>  // 按尺寸分组
  
  acquire(width, height):
    - 查找匹配尺寸的空闲纹理
    - 如果没有，创建新纹理
    - 标记为使用中
    - 返回纹理
  
  release(texture):
    - 标记为空闲
    - 加入池中
  
  gc():
    - 清理超时未使用的纹理
}
```

### 6.3 视频纹理同步

#### 时间同步问题

**挑战**
- 视频解码和 WebGL 渲染在不同线程
- video.currentTime 可能不准确（浮点误差）
- 需要处理 seeking、buffering 等状态

**同步策略**

**1. 主动同步（Active Sync）**
```
每帧检查：
if (abs(video.currentTime - targetTime) > threshold) {
  video.currentTime = targetTime
}
```

**2. 被动同步（Passive Sync）**
```
监听 timeupdate 事件：
video.addEventListener('timeupdate', () => {
  markTextureNeedsUpdate()
})
```

**3. 预测同步（Predictive Sync）**
```
根据播放速度和上一帧时间，预测当前帧：
predictedTime = lastTime + deltaTime * playbackRate
```

#### 视频状态机

```
States:
- UNLOADED: 未加载
- LOADING: 加载中
- READY: 就绪（canplay）
- PLAYING: 播放中
- PAUSED: 暂停
- SEEKING: 跳转中
- STALLED: 缓冲中
- ERROR: 错误

Transitions:
UNLOADED → LOADING (调用 load())
LOADING → READY (canplay 事件)
READY → PLAYING (调用 play())
PLAYING → PAUSED (调用 pause())
PLAYING → SEEKING (设置 currentTime)
...
```

### 6.4 纹理压缩

#### GPU 压缩格式

**优势**
- 减少显存占用
- 提高加载速度
- 保持实时解压

**格式支持**
- S3TC/DXT (桌面)
- ETC1/ETC2 (移动)
- PVRTC (iOS)
- ASTC (现代移动设备)

**检测和使用**
```
检测扩展：
const ext = gl.getExtension('WEBGL_compressed_texture_s3tc')
if (ext) {
  // 使用压缩纹理
  gl.compressedTexImage2D(...)
}
```

#### 运行时压缩

**场景**
- 用户上传的未压缩图片
- 动态生成的纹理

**策略**
- 使用 Canvas 2D API 调整尺寸
- 转换为 WebGL 友好格式（RGBA, POT 尺寸）
- 考虑 Web Worker 离线处理

### 6.5 纹理内存管理

#### 内存预算

**限制**
- 移动设备：256-512 MB 显存
- 桌面设备：2-8 GB 显存
- 需要根据设备动态调整

**策略**
- 设置最大纹理总内存
- 超出时卸载最久未使用的纹理（LRU）
- 降级策略：降低纹理分辨率

#### 分辨率适配

**问题**
- 4K 视频纹理占用大量内存
- 小 Clip 不需要全分辨率

**解决方案**
- 根据 Clip 屏幕尺寸动态选择 Mipmap Level
- 预先缩放大纹理
- 流式加载：先低分辨率，后高分辨率

---

## 7. 音频系统

### 7.1 Web Audio API 架构

#### Audio Graph

```
AudioContext
├── MediaElementSource (Video1 Audio)
├── MediaElementSource (Video2 Audio)
├── MediaElementSource (Audio Clip1)
├── MediaElementSource (Audio Clip2)
│
├── GainNode (Volume Control for each clip)
│   └── Connected to Mixer
│
├── AnalyserNode (Visualizer, optional)
│
└── AudioDestination (Speakers)
```

#### 节点类型

**Source Nodes**
- MediaElementAudioSourceNode: 从 video/audio 元素
- AudioBufferSourceNode: 从预加载的 Buffer
- OscillatorNode: 生成音调（用于音效）

**Processing Nodes**
- GainNode: 音量控制
- BiquadFilterNode: EQ 均衡器
- DelayNode: 延迟效果
- ConvolverNode: 混响效果

**Destination Node**
- AudioDestinationNode: 输出到扬声器

### 7.2 多轨音频混合

#### 混合策略

**自动混合**
- 所有音频 Track 的 Clip 同时播放
- 通过 GainNode 控制各自音量
- AudioContext 自动混合所有连接到 destination 的节点

**音量归一化**
- 防止多个音频叠加导致削波（Clipping）
- 自动降低每个 Clip 的音量：volume / sqrt(clipCount)
- 或使用 Limiter 动态压缩

#### 同步机制

**挑战**
- 音频和视频需要精确同步
- AudioContext 有自己的时间线（currentTime）
- HTMLMediaElement 也有自己的时间线

**解决方案**

**1. Timeline 驱动（推荐）**
```
所有音频的播放由 Timeline.currentTime 驱动：
- 计算每个 Audio Clip 应该播放的位置
- 设置 audioElement.currentTime
- 根据 isPlaying 状态控制 play/pause
```

**2. AudioContext 时钟同步**
```
- 使用 AudioContext.currentTime 作为主时钟
- 同步 Timeline.currentTime 到 AudioContext.currentTime
- 更精确但实现复杂
```

### 7.3 音频 Clip 生命周期

#### 状态管理

```
1. 创建阶段
   - 创建 audio/video 元素
   - 创建 MediaElementSource
   - 创建 GainNode
   - 连接节点

2. 激活阶段
   - Clip 进入可见时间范围
   - 计算 Clip 内部播放时间
   - 设置 element.currentTime
   - 调用 element.play()

3. 播放阶段
   - 持续更新 currentTime（如果有偏差）
   - 监听 ended 事件（循环播放处理）
   - 监听 error 事件

4. 休眠阶段
   - Clip 离开可见时间范围
   - 调用 element.pause()
   - 保持节点连接（快速恢复）

5. 销毁阶段
   - Clip 从 Timeline 删除
   - 断开所有节点连接
   - 释放 audio/video 元素
```

#### 性能优化

**音频预加载**
- 提前 2-3 秒加载即将播放的音频
- 避免播放时才加载导致延迟

**Audio Buffer 缓存**
- 短音频（<30 秒）使用 AudioBuffer
- 预解码并缓存
- 播放时使用 AudioBufferSourceNode（性能更好）

**音频元素复用**
- 维护一个 audio 元素池
- 相同资源复用同一个元素（注意并发限制）

### 7.4 音频可视化（可选）

#### 波形显示

**数据来源**
- AnalyserNode.getByteTimeDomainData()
- 获取时域数据（波形）

**渲染**
- 使用 Canvas 2D API 绘制波形
- 或在 WebGL 中使用 Line Geometry
- 实时更新（requestAnimationFrame）

#### 频谱显示

**数据来源**
- AnalyserNode.getByteFrequencyData()
- 获取频域数据（FFT）

**渲染**
- 柱状图（Bar Chart）
- 实时频谱分析器

---

## 8. 时间同步机制

### 8.1 时间系统架构

#### 时间来源

**主时钟（Master Clock）**
- Timeline.currentTime（存储在 Zustand）
- 单一时间源，所有模块同步到此

**从时钟（Slave Clocks）**
- video.currentTime
- audio.currentTime
- AudioContext.currentTime
- WebGL 渲染时间

#### 时间精度

**要求**
- 帧级精确：误差 < 1 帧（约 33ms @ 30fps）
- 音视频同步：误差 < 40ms（人耳察觉阈值）

**实现**
- 使用高精度时间戳（performance.now()）
- 帧时间补偿
- 播放速度微调

### 8.2 播放控制

#### 播放状态机

```
States:
- STOPPED: 停止（currentTime = 0）
- PLAYING: 播放中
- PAUSED: 暂停
- SEEKING: 跳转中

Events:
- play(): STOPPED/PAUSED → PLAYING
- pause(): PLAYING → PAUSED
- stop(): ANY → STOPPED
- seek(time): ANY → SEEKING → PAUSED/PLAYING
```

#### 播放循环

**驱动方式**

**1. requestAnimationFrame 驱动（推荐）**
```
优势：
- 与浏览器刷新率同步
- 自动节流（标签页不可见时暂停）
- 流畅的动画

流程：
function playLoop(timestamp) {
  if (!isPlaying) return
  
  deltaTime = timestamp - lastTimestamp
  currentTime += deltaTime / 1000
  
  // 更新 Timeline
  timelineStore.setCurrentTime(currentTime)
  
  // 同步媒体元素
  syncMediaElements(currentTime)
  
  // 渲染
  renderer.render()
  
  requestAnimationFrame(playLoop)
}
```

**2. setInterval 驱动**
```
劣势：
- 不精确（可能被阻塞）
- 不与刷新率同步
- 性能较差

不推荐使用
```

### 8.3 视频时间同步

#### 同步算法

**目标**
- 保持 video.currentTime 与 Timeline.currentTime 同步
- 处理 seeking、buffering 等异常情况

**算法**

```
每帧执行：

1. 计算目标时间
   targetTime = (currentTime - clip.startTime) + clip.trimStart

2. 检查偏差
   offset = video.currentTime - targetTime
   
3. 判断是否需要同步
   if (abs(offset) > SYNC_THRESHOLD) {
     // 大偏差：直接跳转
     video.currentTime = targetTime
   } else if (abs(offset) > ADJUST_THRESHOLD) {
     // 小偏差：微调播放速度
     video.playbackRate = 1.0 + offset * ADJUST_FACTOR
   } else {
     // 在容差范围内：正常播放
     video.playbackRate = 1.0
   }
```

**参数**
- SYNC_THRESHOLD: 0.5 秒（大偏差阈值）
- ADJUST_THRESHOLD: 0.1 秒（微调阈值）
- ADJUST_FACTOR: 0.1（播放速度调整系数）

#### 处理特殊情况

**Seeking（跳转）**
```
- 用户拖动 Playhead
- 暂停播放
- 更新所有 video.currentTime
- 等待 seeked 事件
- 恢复播放（如果之前在播放）
```

**Buffering（缓冲）**
```
- 监听 waiting 事件
- 暂停 Timeline 播放
- 显示加载指示器
- 监听 canplay 事件
- 恢复播放
```

**Ended（播放结束）**
```
- 监听 ended 事件
- 如果 clip.loop: 重新播放
- 否则：隐藏 clip
```

### 8.4 音频时间同步

#### 延迟补偿

**问题**
- Web Audio API 有固有延迟（通常 20-100ms）
- 需要补偿以保持音视频同步

**解决方案**

**1. 测量延迟**
```
- 使用 AudioContext.outputLatency（如果可用）
- 或测试法：播放测试音并测量延迟
```

**2. 提前播放**
```
- 计算音频应该播放的时间
- 减去延迟
- 设置 audio.currentTime
```

#### 时间拉伸（Time Stretching）

**场景**
- 用户调整播放速度（0.5x, 2x 等）
- 需要音频保持音高不变

**技术**
- 使用 audio.playbackRate（会改变音高）
- 或使用专门的音频处理库（如 SoundTouch.js）
- Web Audio API 的 PitchShift 节点（实验性）

---

## 9. 数据流设计

### 9.1 数据流向

```
Timeline Store (Zustand)
    │
    ├─→ currentTime ──────────────┐
    │                              │
    ├─→ tracks ───────────────────┤
    │                              │
    ├─→ clips ────────────────────┤
    │                              ▼
    └─→ isPlaying ──→ Player Component
                            │
                            ├─→ Scene Manager
                            │   ├─→ Layer 1
                            │   │   └─→ Clip Nodes
                            │   ├─→ Layer 2
                            │   └─→ Layer N
                            │
                            ├─→ WebGL Renderer
                            │   ├─→ Texture Manager
                            │   ├─→ Shader Manager
                            │   └─→ Render Loop
                            │
                            └─→ Audio System
                                ├─→ Audio Mixer
                                └─→ Audio Nodes
```

### 9.2 状态订阅

#### Zustand Store 集成

**订阅 Timeline 变化**
```
useEffect(() => {
  const unsubscribe = timelineStore.subscribe(
    (state) => ({
      tracks: state.tracks,
      currentTime: state.currentTime,
      isPlaying: state.isPlaying,
    }),
    (newState, prevState) => {
      // 检测变化
      if (newState.tracks !== prevState.tracks) {
        sceneManager.rebuildScene(newState.tracks)
      }
      if (newState.currentTime !== prevState.currentTime) {
        sceneManager.update(newState.currentTime)
      }
      if (newState.isPlaying !== prevState.isPlaying) {
        audioSystem.setPlaying(newState.isPlaying)
      }
    }
  )
  
  return unsubscribe
})
```

**性能优化**
- 使用 shallow compare 避免不必要的更新
- 分别订阅不同的状态切片
- 使用 useSyncExternalStore（React 18+）

### 9.3 Props 传递

#### Player 组件接口

```
interface PlayerProps {
  // 基础配置
  stage: StageConfig           // 来自 Protocol
  
  // 可选配置
  backgroundColor?: string     // 背景色
  fitMode?: 'contain' | 'cover' | 'fill'  // 适配模式
  
  // 回调
  onReady?: () => void        // 渲染器初始化完成
  onError?: (error: Error) => void  // 错误回调
  onTimeUpdate?: (time: number) => void  // 时间更新（用于同步）
  
  // 调试
  debug?: boolean             // 显示调试信息
  stats?: boolean             // 显示性能统计
}
```

#### 暴露的 API（通过 ref）

```
interface PlayerRef {
  // 播放控制
  play(): void
  pause(): void
  seek(time: number): void
  
  // 渲染控制
  render(): void              // 手动触发渲染
  resize(): void              // 手动触发尺寸更新
  
  // 状态查询
  isReady(): boolean
  getCurrentTime(): number
  
  // 截图/导出
  captureFrame(): Blob        // 截取当前帧
  startRecording(): void      // 开始录制
  stopRecording(): Blob       // 停止录制，返回视频
  
  // 调试
  getStats(): RenderStats     // 获取性能统计
  toggleDebug(): void         // 切换调试模式
}
```

### 9.4 事件系统

#### 内部事件

**Scene Events**
- scene:ready - 场景初始化完成
- scene:update - 场景更新
- scene:clipAdded - Clip 添加
- scene:clipRemoved - Clip 移除

**Render Events**
- render:start - 渲染开始
- render:end - 渲染结束
- render:error - 渲染错误

**Texture Events**
- texture:loaded - 纹理加载完成
- texture:updated - 纹理更新
- texture:error - 纹理加载失败

#### 事件总线

**实现**
```
使用 EventEmitter 或自定义事件系统：

class EventBus {
  listeners: Map<string, Function[]>
  
  on(event, callback)
  off(event, callback)
  emit(event, data)
  once(event, callback)
}
```

**用途**
- 模块间解耦
- 调试和日志
- 插件扩展

---

## 10. 性能优化策略

### 10.1 渲染优化

#### 裁剪（Culling）

**时间裁剪**
- 只渲染当前时间可见的 Clip
- 提前预加载即将可见的 Clip（2 秒窗口）
- 卸载已经不可见的 Clip（保留 2 秒）

**视锥裁剪（Frustum Culling）**
- 计算 Clip 的边界框（Bounding Box）
- 判断是否与视锥相交
- 完全在视口外的跳过渲染

**遮挡裁剪（Occlusion Culling）**
- 检测被完全遮挡的不透明 Clip
- 跳过这些 Clip 的渲染
- 使用 Z-buffer 或手动计算

#### 批处理（Batching）

**静态批处理**
- 合并使用相同 Shader 和 Texture 的图片 Clip
- 生成一个大的 Vertex Buffer
- 一次 Draw Call 渲染多个 Clip

**动态批处理**
- 运行时动态合并相邻的 Clip
- 适用于少量顶点的对象

**Instance Rendering**
- 使用 WebGL 的 Instanced Drawing
- 适合渲染大量相同 Clip（如粒子）

#### Draw Call 优化

**目标**
- 减少 Draw Call 数量（目标：< 100 per frame）
- 减少状态切换（Shader, Texture）

**策略**
- 按 Shader 分组
- 按 Texture 分组
- 按渲染状态分组
- 使用 Texture Atlas 减少纹理切换

#### GPU 优化

**Shader 优化**
- 避免 Fragment Shader 中的复杂计算
- 预计算常量
- 使用查找表（LUT）代替实时计算

**纹理优化**
- 使用 Mipmap（减少 Cache Miss）
- 压缩纹理格式
- 合理选择纹理过滤模式

**几何优化**
- 减少顶点数量
- 使用 Index Buffer（减少重复顶点）
- 顶点数据紧凑排列

### 10.2 内存优化

#### 纹理内存

**问题**
- 纹理是主要内存占用
- 4K 视频纹理：3840 × 2160 × 4 bytes = 33 MB
- 多个视频快速占满显存

**优化**

**1. 动态分辨率**
```
根据 Clip 屏幕尺寸选择合适的纹理分辨率：
- 屏幕尺寸 < 256px → 512px 纹理
- 屏幕尺寸 < 512px → 1024px 纹理
- 屏幕尺寸 < 1024px → 2048px 纹理
- 屏幕尺寸 >= 1024px → 原始分辨率
```

**2. LRU 缓存**
```
- 设置最大纹理内存（如 512 MB）
- 超出时卸载最久未使用的纹理
- 需要时重新加载
```

**3. 纹理压缩**
- 使用 GPU 压缩格式（DXT, ETC, ASTC）
- 减少 50-75% 内存占用

#### 对象池

**池化对象**
- Texture
- FrameBuffer
- Buffer（VBO, IBO）
- Matrix（变换矩阵）

**策略**
- 预创建常用对象
- 复用代替创建销毁
- 定期清理（GC）

#### 内存泄漏防护

**常见泄漏**
- WebGL 资源未释放（Texture, Buffer, Shader）
- 事件监听器未移除
- 定时器未清除
- 闭包引用

**预防措施**
- 使用 WeakMap 存储临时引用
- 组件卸载时清理所有资源
- 定期内存分析（Chrome DevTools）

### 10.3 加载优化

#### 预加载策略

**时间窗口预加载**
```
当前时间：10 秒
预加载窗口：[10 - 2, 10 + 5] = [8, 15]
预加载该窗口内所有 Clip 的资源
```

**优先级队列**
```
优先级：
1. 当前可见的 Clip（立即加载）
2. 2 秒内将可见的 Clip（高优先级）
3. 5 秒内将可见的 Clip（中优先级）
4. 其他 Clip（低优先级，后台加载）
```

**懒加载**
- 只加载视口内的资源
- 滚动时动态加载
- 使用占位符（低分辨率预览）

#### 网络优化

**资源 CDN**
- 视频/图片托管在 CDN
- 就近访问，减少延迟

**Range Request**
- HTTP Range 请求
- 只下载需要的视频片段
- 适用于大视频文件

**Progressive Loading**
- 渐进式加载
- 先低质量，后高质量
- 用户体验更好

### 10.4 帧率优化

#### 自适应渲染

**目标帧率**
- 桌面：60 fps
- 移动：30 fps（节省电量）

**帧率检测**
```
连续 10 帧计算平均帧率：
if (avgFPS < targetFPS * 0.8) {
  // 帧率过低，降级
  reduceQuality()
}
```

**降级策略**
- 降低渲染分辨率（如 80%）
- 减少特效复杂度
- 禁用抗锯齿
- 减少 Clip 数量（只渲染关键 Clip）

#### 时间切片

**问题**
- 大量 
