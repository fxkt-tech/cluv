# WebGL Player - Implementation Status

## 概览

本目录包含 WebGL 播放器的核心实现，采用模块化设计，支持视频编辑器的实时渲染需求。

---

## Phase 1: 基础设施 ✅

Phase 1 已完成，包含以下模块：

### M1: 基础设施
- ✅ **math.ts** - 数学工具库
  - Mat4 类：4x4 矩阵运算
  - Vec3 类：3D 向量运算
  - 工具函数：角度转换、插值、限制等

- ✅ **webgl-utils.ts** - WebGL 工具函数
  - Shader 创建和编译
  - Program 创建和链接
  - Buffer 管理
  - Texture 创建和更新
  - Framebuffer 创建
  - 错误检查和日志
  - 扩展管理

### M2: WebGL Context 管理
- ✅ **WebGLContext.ts** - WebGL 上下文管理器
  - 自动检测 WebGL 2.0/1.0
  - 扩展初始化和管理
  - 上下文丢失/恢复处理
  - 事件系统
  - 参数查询

### M12: 类型定义
- ✅ **types/webgl.ts** - WebGL 相关类型
- ✅ **types/renderer.ts** - 渲染器相关类型
- ✅ **types/scene.ts** - 场景相关类型
- ✅ **types/index.ts** - 类型导出

---

## Phase 2: 资源管理 ✅

Phase 2 已完成，包含以下模块：

### M3: Shader 系统
- ✅ **ShaderProgram.ts** - 着色器程序封装
  - 编译和链接
  - Uniform/Attribute 管理
  - 自动类型检测
  - 错误处理

- ✅ **ShaderManager.ts** - 着色器管理器
  - 着色器注册和缓存
  - 延迟编译
  - 热重载支持
  - 生命周期管理

- ✅ **内置着色器**
  - base.vert.glsl / base.frag.glsl - 基础着色器
  - video.vert.glsl / video.frag.glsl - 视频着色器（支持颜色调整、绿幕抠图）

### M4: 纹理管理
- ✅ **Texture.ts** - 纹理基类
  - 纹理创建和配置
  - 多种格式和类型支持
  - Mipmap 生成
  - 各向异性过滤

- ✅ **ImageTexture.ts** - 图片纹理
  - URL 加载
  - 多种图片源支持
  - 异步加载
  - 占位纹理

- ✅ **VideoTexture.ts** - 视频纹理
  - 视频加载和播放控制
  - 自动更新
  - 播放状态管理
  - 时间控制

- ✅ **TextureCache.ts** - 纹理缓存
  - LRU 淘汰策略
  - 引用计数
  - 内存限制
  - 统计信息

- ✅ **TextureManager.ts** - 纹理管理器
  - 统一创建接口
  - 自动缓存管理
  - 批量更新
  - 内存监控

### M5: 几何体管理
- ✅ **QuadGeometry.ts** - 四边形几何体
  - 可配置尺寸
  - 中心对齐/左下角对齐
  - 纹理坐标翻转
  - 动态更新支持

- ✅ **GeometryManager.ts** - 几何体管理器
  - 几何体缓存
  - 引用计数
  - 单位 Quad 单例
  - 资源清理

---

## Phase 3: 场景管理 ✅

Phase 3 已完成，包含以下模块：

### M6: Camera 系统
- ✅ **Camera.ts** - 相机系统
  - 正交投影和透视投影
  - 视图矩阵计算（Look-at）
  - 视口管理
  - 屏幕坐标与世界坐标转换
  - 相机控制（平移、缩放、旋转）
  - 2D/3D 相机工厂方法

### M7: RenderNode 系统
- ✅ **RenderNode.ts** - 渲染节点
  - 场景图层次结构（父子关系）
  - 变换管理（位置、旋转、缩放、锚点）
  - 可见性和透明度（支持层次继承）
  - 混合模式支持（normal, add, multiply, screen, overlay）
  - 包围盒计算（局部空间和世界空间）
  - 时间轴支持（开始时间、持续时间、裁剪）
  - 资源绑定（纹理、几何体）
  - 序列化/反序列化

### M8: Layer 系统
- ✅ **Layer.ts** - 图层管理
  - Z-order 管理
  - 图层级别的可见性和透明度
  - 锁定状态
  - 节点集合管理
  - 基于时间的节点查询
  - 批量操作
  - 序列化/反序列化

### M9: Scene Manager
- ✅ **SceneManager.ts** - 场景管理器
  - 场景图管理
  - 图层创建、删除、排序
  - 节点注册表（快速查找）
  - 场景遍历和更新
  - 可见性剔除
  - 事件系统（场景变更通知）
  - 拾取系统（鼠标/触摸交互）
  - 场景序列化/反序列化
  - 统计信息跟踪

### M10: 数学工具增强
- ✅ **math-oop.ts** - 面向对象数学工具
  - Vec3 类（向量运算）
  - Mat4 类（矩阵运算）
  - 与函数式 math.ts 无缝集成

---

## Phase 4: 渲染器核心 ✅

Phase 4 已完成，包含以下模块：

### M11: WebGL Renderer
- ✅ **WebGLRenderer.ts** - WebGL 渲染器
  - 场景渲染管理
  - 相机集成
  - 资源管理器集成（Shader、Texture、Geometry）
  - 批量渲染优化
  - 视锥剔除支持
  - 渲染统计信息

### M12: Render Loop
- ✅ **RenderLoop.ts** - 渲染循环
  - 帧时序管理
  - FPS 控制和监控
  - 更新/渲染周期分离
  - 固定/可变时间步长
  - 性能统计

### M13: Render State
- ✅ **RenderState.ts** - 渲染状态
  - WebGL 状态缓存（避免冗余切换）
  - 混合模式管理（normal、add、multiply、screen、overlay）
  - 深度测试管理
  - 模板测试管理
  - 裁剪和视口管理
  - 面剔除管理

---

## 目录结构

```
webgl/
├── core/                    # 核心模块
│   └── WebGLContext.ts     # WebGL 上下文管理
├── shader/                  # Shader 系统
│   ├── ShaderProgram.ts    # 着色器程序
│   ├── ShaderManager.ts    # 着色器管理器
│   ├── shaders/            # 内置着色器
│   │   ├── base.vert.glsl
│   │   ├── base.frag.glsl
│   │   ├── video.vert.glsl
│   │   └── video.frag.glsl
│   └── index.ts            # Shader 模块导出
├── texture/                 # 纹理管理
│   ├── Texture.ts          # 纹理基类
│   ├── ImageTexture.ts     # 图片纹理
│   ├── VideoTexture.ts     # 视频纹理
│   ├── TextureCache.ts     # 纹理缓存
│   ├── TextureManager.ts   # 纹理管理器
│   └── index.ts            # Texture 模块导出
├── geometry/                # 几何体管理
│   ├── QuadGeometry.ts     # 四边形几何体
│   ├── GeometryManager.ts  # 几何体管理器
│   └── index.ts            # Geometry 模块导出
├── scene/                   # 场景管理
│   ├── Camera.ts           # 相机系统
│   ├── RenderNode.ts       # 渲染节点
│   ├── Layer.ts            # 图层系统
│   ├── SceneManager.ts     # 场景管理器
│   └── index.ts            # Scene 模块导出
├── renderer/                # 渲染器核心
│   ├── WebGLRenderer.ts    # WebGL 渲染器
│   ├── RenderLoop.ts       # 渲染循环
│   ├── RenderState.ts      # 渲染状态
│   ├── example.ts          # 使用示例
│   └── index.ts            # Renderer 模块导出
├── utils/                   # 工具函数
│   ├── math.ts             # 数学工具
│   ├── math-oop.ts         # OOP 数学工具
│   └── webgl-utils.ts      # WebGL 工具
├── __tests__/              # 测试文件
│   ├── math.test.ts        # 数学工具测试
│   ├── geometry/
│   │   └── QuadGeometry.test.ts
│   ├── texture/
│   └── shader/
└── README.md               # 本文档
```

---

## 使用示例

### 1. 初始化 WebGL 上下文

```typescript
import { WebGLContext } from './webgl/core/WebGLContext';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const contextWrapper = new WebGLContext(canvas, {
  alpha: false,
  antialias: true,
  powerPreference: 'high-performance'
});

const gl = contextWrapper.getContext();
```

### 2. 使用 Shader 系统

```typescript
import { ShaderManager, BUILTIN_SHADERS } from './webgl/shader';

// 创建管理器
const shaderManager = new ShaderManager(contextWrapper);

// 注册内置着色器
shaderManager.register(BUILTIN_SHADERS.BASE);
shaderManager.register(BUILTIN_SHADERS.VIDEO);

// 获取并使用着色器
const shader = shaderManager.get('base');
shader?.use();
shader?.setUniforms({
  u_opacity: 1.0,
  u_tintColor: [1, 1, 1, 1],
});
```

### 3. 使用 Texture 管理

```typescript
import { TextureManager, VideoTexture } from './webgl/texture';

// 创建管理器
const textureManager = new TextureManager(contextWrapper);

// 加载图片纹理
const imgResult = await textureManager.createImageFromURL('/image.png');

// 加载视频纹理
const videoResult = await textureManager.createVideoFromURL('/video.mp4', {
  autoUpdate: true,
  loop: true,
});

const videoTexture = videoResult.texture as VideoTexture;
await videoTexture.play();

// 渲染循环中更新
function render() {
  textureManager.updateVideoTextures();
  // ... 渲染代码
  requestAnimationFrame(render);
}
```

### 4. 使用 Geometry 管理

```typescript
import { GeometryManager } from './webgl/geometry';

// 创建管理器
const geometryManager = new GeometryManager(contextWrapper);

// 获取单例 unit quad
const unitQuad = geometryManager.getUnitQuad();

// 创建自定义 quad
const customQuad = geometryManager.createCustomQuad(1920, 1080, true, false);

// 使用几何体
const posLoc = shader.getAttributeLocation('a_position');
const texLoc = shader.getAttributeLocation('a_texCoord');
customQuad.bindAttributes(posLoc, texLoc);
customQuad.draw();
```

### 5. 使用 Renderer（Phase 4）

```typescript
import { WebGLContextManager } from './webgl/core/WebGLContext';
import { ShaderManager, BUILTIN_SHADERS } from './webgl/shader';
import { TextureManager } from './webgl/texture';
import { GeometryManager } from './webgl/geometry';
import { Camera } from './webgl/scene/Camera';
import { SceneManager } from './webgl/scene/SceneManager';
import { RenderNode, BlendMode, NodeType } from './webgl/scene/RenderNode';
import { WebGLRenderer, RenderLoop } from './webgl/renderer';

async function setupPlayer() {
  // Initialize context and managers
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const contextWrapper = new WebGLContextManager(canvas);
  const shaderManager = new ShaderManager(contextWrapper);
  const textureManager = new TextureManager(contextWrapper);
  const geometryManager = new GeometryManager(contextWrapper);
  
  // Register shaders
  shaderManager.register(BUILTIN_SHADERS.BASE);
  shaderManager.register(BUILTIN_SHADERS.VIDEO);
  
  // Create scene and camera
  const sceneManager = new SceneManager();
  const layer = sceneManager.createLayer('main', 0);
  const camera = Camera.createOrthographic2D(canvas.width, canvas.height);
  
  // Create renderer
  const renderer = new WebGLRenderer(
    contextWrapper,
    shaderManager,
    textureManager,
    geometryManager,
    {
      clearColor: [0.1, 0.1, 0.1, 1.0],
      enableBatching: true,
      autoUpdateTextures: true,
    }
  );
  
  // Add video node
  const videoNode = new RenderNode({
    type: NodeType.VIDEO,
    position: { x: 640, y: 360 },
    scale: { x: 1920, y: 1080 },
    blendMode: BlendMode.NORMAL,
  });
  videoNode.setShaderName('video');
  videoNode.setTiming(0, 10); // 0-10 seconds
  layer.addNode(videoNode);
  
  // Load video texture
  const videoResult = await textureManager.createVideoFromURL('/video.mp4');
  if (videoResult.success) {
    videoNode.setTexture(videoResult.texture);
    videoNode.setTextureId('video-1');
    await videoResult.texture.play();
  }
  
  // Create render loop
  let currentTime = 0;
  const renderLoop = new RenderLoop(
    {
      onUpdate: (deltaTime, totalTime) => {
        currentTime = totalTime;
      },
      onRender: () => {
        renderer.render(sceneManager, camera, currentTime);
      },
    },
    { targetFPS: 60, autoStart: true }
  );
  
  // Performance monitoring
  setInterval(() => {
    const stats = renderLoop.getStats();
    const renderStats = renderer.getStats();
    console.log({
      fps: stats.fps.toFixed(2),
      drawCalls: renderStats.drawCalls,
      nodesRendered: renderStats.nodesRendered,
    });
  }, 1000);
}
```

### 6. 完整渲染示例（Phase 1-2）

```typescript
import { WebGLContext } from './webgl/core/WebGLContext';
import { ShaderManager, BUILTIN_SHADERS } from './webgl/shader';
import { TextureManager, VideoTexture } from './webgl/texture';
import { GeometryManager } from './webgl/geometry';
import { Mat4 } from './webgl/utils/math';

async function setupRenderer() {
  // 初始化
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const contextWrapper = new WebGLContext(canvas);
  const gl = contextWrapper.getContext();
  
  // 创建管理器
  const shaderManager = new ShaderManager(contextWrapper);
  const textureManager = new TextureManager(contextWrapper);
  const geometryManager = new GeometryManager(contextWrapper);
  
  // 准备资源
  shaderManager.register(BUILTIN_SHADERS.VIDEO);
  const shader = shaderManager.get('video');
  
  const videoResult = await textureManager.createVideoFromURL('/video.mp4');
  const videoTexture = videoResult.texture as VideoTexture;
  await videoTexture.play();
  
  const quad = geometryManager.getUnitQuad();
  
  // 渲染循环
  function render() {
    textureManager.updateVideoTextures();
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    shader?.use();
    shader?.setUniforms({
      u_modelMatrix: Mat4.identity(),
      u_viewMatrix: Mat4.identity(),
      u_projectionMatrix: Mat4.ortho(0, canvas.width, canvas.height, 0, -1, 1),
      u_texture: 0,
      u_opacity: 1.0,
      u_tintColor: [1, 1, 1, 1],
      u_brightness: 0.0,
      u_contrast: 1.0,
      u_saturation: 1.0,
      u_hue: 0.0,
    });
    
    videoTexture.bind(0);
    quad.bindAttributes(
      shader!.getAttributeLocation('a_position'),
      shader!.getAttributeLocation('a_texCoord')
    );
    quad.draw();
    
    requestAnimationFrame(render);
  }
  
  render();
}
```

---

## 验收标准

### Phase 1 ✅
- ✅ WebGL Context 成功创建
- ✅ 数学工具函数正确运行
- ✅ 类型系统完整
- ✅ 上下文丢失/恢复机制

### Phase 2 ✅
- ✅ Shader 编译和管理
- ✅ 纹理加载和更新
- ✅ 视频纹理播放
- ✅ 几何体创建和绘制
- ✅ 资源缓存和重用
- ✅ 内存管理

### Phase 3 ✅
- ✅ Camera 系统（正交/透视投影）
- ✅ RenderNode 场景图节点
- ✅ Layer 图层管理
- ✅ SceneManager 场景管理器
- ✅ 变换层次结构
- ✅ 可见性剔除
- ✅ 拾取系统
- ✅ 场景序列化

### Phase 4 ✅
- ✅ WebGLRenderer 核心渲染器
- ✅ RenderLoop 渲染循环
- ✅ RenderState 状态管理
- ✅ 批量渲染优化
- ✅ 性能监控
- ✅ 完整集成

---

## 性能优化

1. **Shader 系统**
   - 位置缓存避免重复查询
   - 延迟编译节省启动时间
   - 自动类型检测提高效率

2. **Texture 管理**
   - LRU 缓存策略
   - 引用计数避免重复加载
   - 智能视频更新（仅在帧变化时）
   - 批量更新减少调用开销

3. **Geometry 管理**
   - 单例 Unit Quad 共享
   - 缓存重用避免重复创建
   - 索引绘制减少数据传输

4. **内存管理**
   - 可配置缓存限制
   - 自动淘汰策略
   - 引用计数防止误删
   - 实时内存监控

---

## 测试

运行单元测试：

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- webgl/__tests__/math.test.ts
npm test -- webgl/__tests__/geometry/QuadGeometry.test.ts
```

测试覆盖：
- ✅ Mat4 所有方法
- ✅ Vec3 所有方法
- ✅ QuadGeometry 完整测试
- ⏳ WebGL Context（需要 WebGL mock）
- ⏳ Shader 系统（需要 WebGL mock）
- ⏳ Texture 系统（需要 WebGL mock）

---

## 下一步：优化与扩展

### 性能优化
- 实现真正的视锥剔除（使用包围盒相交测试）
- 添加空间分区（Quadtree/R-tree）用于快速拾取和剔除
- 实现遮挡剔除
- 优化状态排序（减少状态切换）
- WebGL 实例化渲染（对于大量相同几何体）

### 功能扩展
- 后处理效果系统（Bloom、SSAO、DOF 等）
- 粒子系统
- 文本渲染
- 多 pass 渲染
- Shadow mapping
- PBR 材质系统
- 动画系统（关键帧、缓动）

### 工具与调试
- 性能分析工具
- 场景编辑器集成
- 实时调试面板
- 录制/回放系统

---

## 依赖关系

```
Phase 1: 基础设施
├── WebGLContext
├── math utils
├── webgl-utils
└── types

Phase 2: 资源管理 (依赖 Phase 1)
├── Shader System
│   ├── ShaderProgram → WebGLContext
│   └── ShaderManager → ShaderProgram
├── Texture System
│   ├── Texture → WebGLContext
│   ├── ImageTexture → Texture
│   ├── VideoTexture → Texture
│   ├── TextureCache → Texture
│   └── TextureManager → TextureCache, ImageTexture, VideoTexture
└── Geometry System
    ├── QuadGeometry → WebGLContext
    └── GeometryManager → QuadGeometry
```

---

## 注意事项

1. **浏览器兼容性**
   - 优先使用 WebGL 2.0，自动降级到 1.0
   - 扩展检测处理不支持的特性
   - 提供浏览器支持检查函数

2. **错误处理**
   - 所有 WebGL 操作都进行错误检查
   - 详细的错误日志包含调用栈
   - 优雅降级而非崩溃

3. **内存管理**
   - 及时清理不用的 WebGL 资源
   - 上下文丢失时自动清理
   - 提供 dispose 方法供手动清理

4. **资源加载**
   - 异步加载避免阻塞
   - 支持占位纹理
   - 处理 CORS 问题

---

## 文档

- [Phase 1 Completion Report](../../../docs/PHASE1_COMPLETION_REPORT.md)
- [Phase 1 Quick Start](../../../docs/PHASE1_QUICKSTART.md)
- [Phase 2 Completion Report](../../../docs/PHASE2_COMPLETION_REPORT.md)
- [Phase 2 Quick Start](../../../docs/PHASE2_QUICKSTART.md)
- [Player Implementation Plan](../../../docs/PLAYER_IMPLEMENTATION_PLAN.md)

**外部资源**:
- [TypeScript Docs](https://www.typescriptlang.org/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)

---

## 贡献者

本模块基于 [PLAYER_IMPLEMENTATION_PLAN.md](../../../docs/PLAYER_IMPLEMENTATION_PLAN.md) 实现。

---

**更新日期**: 2024  
**当前版本**: Phase 4 完成（所有核心功能就绪）  
**下一阶段**: 性能优化与功能扩展