# Phase 2 快速入门指南

本指南帮助你快速上手使用 Phase 2 实现的 Shader、Texture 和 Geometry 管理系统。

---

## 目录

1. [环境准备](#环境准备)
2. [Shader 系统使用](#shader-系统使用)
3. [Texture 管理使用](#texture-管理使用)
4. [Geometry 管理使用](#geometry-管理使用)
5. [完整示例](#完整示例)
6. [常见问题](#常见问题)

---

## 环境准备

### 1. 导入依赖

```typescript
import { WebGLContext } from './webgl/core/WebGLContext';
import { ShaderManager, BUILTIN_SHADERS } from './webgl/shader';
import { TextureManager, TextureFilter } from './webgl/texture';
import { GeometryManager } from './webgl/geometry';
```

### 2. 初始化 WebGL 上下文

```typescript
// 获取 canvas 元素
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// 创建 WebGL 上下文
const contextWrapper = new WebGLContext(canvas, {
  alpha: false,
  antialias: true,
  preserveDrawingBuffer: false,
});

// 检查是否成功初始化
if (contextWrapper.isContextLost()) {
  console.error('Failed to initialize WebGL context');
}
```

---

## Shader 系统使用

### 基础用法

```typescript
// 1. 创建 ShaderManager
const shaderManager = new ShaderManager(contextWrapper);

// 2. 注册内置着色器
shaderManager.register(BUILTIN_SHADERS.BASE);
shaderManager.register(BUILTIN_SHADERS.VIDEO);

// 3. 获取着色器（首次获取时自动编译）
const baseShader = shaderManager.get('base');

if (!baseShader) {
  console.error('Failed to load base shader');
  return;
}

// 4. 使用着色器
baseShader.use();

// 5. 设置 uniforms
baseShader.setUniform('u_opacity', 1.0);
baseShader.setUniform('u_tintColor', [1.0, 1.0, 1.0, 1.0]);

// 或批量设置
baseShader.setUniforms({
  u_opacity: 1.0,
  u_tintColor: [1.0, 1.0, 1.0, 1.0],
  u_modelMatrix: modelMatrix,
  u_viewMatrix: viewMatrix,
  u_projectionMatrix: projectionMatrix,
});
```

### 创建自定义着色器

```typescript
// 顶点着色器源码
const vertexSource = `
  attribute vec3 a_position;
  uniform mat4 u_matrix;
  
  void main() {
    gl_Position = u_matrix * vec4(a_position, 1.0);
  }
`;

// 片段着色器源码
const fragmentSource = `
  precision mediump float;
  uniform vec4 u_color;
  
  void main() {
    gl_FragColor = u_color;
  }
`;

// 注册自定义着色器
shaderManager.register({
  name: 'custom',
  vertexSource,
  fragmentSource,
  attributes: ['a_position'],
  uniforms: ['u_matrix', 'u_color'],
});

// 使用自定义着色器
const customShader = shaderManager.get('custom');
customShader?.use();
```

### 视频着色器高级功能

```typescript
const videoShader = shaderManager.get('video');

if (videoShader) {
  videoShader.use();
  
  // 颜色调整
  videoShader.setUniforms({
    u_brightness: 0.1,      // -1.0 到 1.0
    u_contrast: 1.2,        // 0.0 到 2.0
    u_saturation: 1.1,      // 0.0 到 2.0
    u_hue: 15.0,            // -180 到 180 度
  });
  
  // 绿幕抠图
  videoShader.setUniforms({
    u_useChromaKey: true,
    u_chromaKeyColor: [0.0, 1.0, 0.0],  // 绿色
    u_chromaKeyThreshold: 0.4,
    u_chromaKeySmoothness: 0.1,
  });
}
```

---

## Texture 管理使用

### 图片纹理

```typescript
// 1. 创建 TextureManager
const textureManager = new TextureManager(contextWrapper, {
  maxSize: 512 * 1024 * 1024,  // 512MB 缓存
  maxEntries: 100,              // 最多 100 个纹理
  ttl: 0,                       // 不过期
});

// 2. 加载图片纹理
const imageResult = await textureManager.createImageFromURL(
  '/assets/logo.png',
  {
    minFilter: TextureFilter.LINEAR,
    magFilter: TextureFilter.LINEAR,
    wrapS: TextureWrap.CLAMP_TO_EDGE,
    wrapT: TextureWrap.CLAMP_TO_EDGE,
    generateMipmaps: false,
    flipY: true,
  },
  true  // 使用缓存
);

const imageTexture = imageResult.texture;

// 3. 使用纹理
imageTexture.bind(0);  // 绑定到纹理单元 0
shader.setUniform('u_texture', 0);

// 绘制...

imageTexture.unbind();
```

### 视频纹理

```typescript
// 1. 加载视频纹理
const videoResult = await textureManager.createVideoFromURL(
  '/assets/video.mp4',
  {
    autoUpdate: true,     // 自动更新
    loop: true,           // 循环播放
    muted: true,          // 静音
    playbackRate: 1.0,    // 播放速度
    onVideoReady: (texture) => {
      console.log('Video ready:', texture.getDuration());
    },
    onVideoEnded: (texture) => {
      console.log('Video ended');
    },
  },
  true  // 使用缓存
);

const videoTexture = videoResult.texture as VideoTexture;

// 2. 控制视频播放
await videoTexture.play();
videoTexture.pause();
videoTexture.seek(10.0);  // 跳转到 10 秒

// 3. 调整播放参数
videoTexture.setPlaybackRate(2.0);  // 2x 速度
videoTexture.setVolume(0.5);        // 50% 音量
videoTexture.setLoop(true);         // 循环播放

// 4. 在渲染循环中更新视频纹理
function renderLoop() {
  // 更新所有正在播放的视频纹理
  textureManager.updateVideoTextures();
  
  // 或更新单个纹理
  if (videoTexture.needsUpdate()) {
    videoTexture.update();
  }
  
  // 渲染...
  
  requestAnimationFrame(renderLoop);
}
```

### 从 DOM 元素创建纹理

```typescript
// 从 Image 元素
const img = document.getElementById('myImage') as HTMLImageElement;
const imgResult = textureManager.createImageFromSource(img, {}, 'my-image-key');

// 从 Canvas 元素
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const canvasResult = textureManager.createImageFromSource(canvas, {}, 'my-canvas-key');

// 从 Video 元素
const video = document.getElementById('myVideo') as HTMLVideoElement;
const videoResult = textureManager.createVideoFromElement(video, {
  autoUpdate: true,
}, 'my-video-key');
```

### 纹理缓存管理

```typescript
// 获取缓存统计
const stats = textureManager.getCacheStats();
console.log('Cache stats:', {
  entries: stats.totalEntries,
  size: stats.totalSize / (1024 * 1024) + 'MB',
  hitRate: textureManager.getCache().getHitRate(),
});

// 清理过期纹理
const pruned = textureManager.pruneCache();
console.log(`Pruned ${pruned} expired textures`);

// 清空缓存
textureManager.clearCache();

// 释放特定纹理
textureManager.dispose('image:logo.png');

// 释放所有纹理
textureManager.disposeAll();
```

---

## Geometry 管理使用

### 基础用法

```typescript
// 1. 创建 GeometryManager
const geometryManager = new GeometryManager(contextWrapper);

// 2. 获取单例 unit quad (1x1, centered)
const unitQuad = geometryManager.getUnitQuad();

// 3. 创建自定义尺寸 quad
const customQuad = geometryManager.createCustomQuad(
  1920,  // width
  1080,  // height
  true,  // centered
  false  // flipY
);

// 4. 绑定顶点属性
const posLoc = shader.getAttributeLocation('a_position');
const texLoc = shader.getAttributeLocation('a_texCoord');

customQuad.bindAttributes(posLoc, texLoc);

// 5. 绘制
customQuad.draw();  // 使用索引绘制
// 或
customQuad.drawArrays();  // 使用数组绘制
```

### 动态更新几何体

```typescript
const quad = geometryManager.createQuad({
  width: 100,
  height: 100,
  centered: true,
});

// 更新尺寸
quad.updateDimensions(200, 150);

// 更新纹理坐标（裁剪纹理）
const croppedCoords = new Float32Array([
  0.25, 0.25,  // 左下
  0.75, 0.25,  // 右下
  0.75, 0.75,  // 右上
  0.25, 0.75,  // 左上
]);
quad.updateTexCoords(croppedCoords);
```

### 几何体缓存管理

```typescript
// 获取统计信息
const stats = geometryManager.getStats();
console.log('Geometry stats:', {
  total: stats.totalGeometries,
  references: stats.totalReferences,
  hitRate: geometryManager.getHitRate(),
});

// 清理未使用的几何体
const pruned = geometryManager.pruneUnused();
console.log(`Pruned ${pruned} unused geometries`);

// 释放特定几何体
geometryManager.dispose('quad:1920x1080:true:false');

// 释放所有几何体
geometryManager.disposeAll();
```

---

## 完整示例

### 渲染单张图片

```typescript
import { WebGLContext } from './webgl/core/WebGLContext';
import { ShaderManager, BUILTIN_SHADERS } from './webgl/shader';
import { TextureManager, TextureFilter, TextureWrap } from './webgl/texture';
import { GeometryManager } from './webgl/geometry';
import { Mat4 } from './webgl/utils/math';

async function renderImage() {
  // 1. 初始化
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const contextWrapper = new WebGLContext(canvas);
  const gl = contextWrapper.getContext();
  
  // 2. 创建管理器
  const shaderManager = new ShaderManager(contextWrapper);
  const textureManager = new TextureManager(contextWrapper);
  const geometryManager = new GeometryManager(contextWrapper);
  
  // 3. 准备资源
  shaderManager.register(BUILTIN_SHADERS.BASE);
  const shader = shaderManager.get('base');
  if (!shader) return;
  
  const imageResult = await textureManager.createImageFromURL('/image.png');
  const texture = imageResult.texture;
  
  const quad = geometryManager.getUnitQuad();
  
  // 4. 设置矩阵
  const modelMatrix = Mat4.identity();
  const viewMatrix = Mat4.identity();
  const projectionMatrix = Mat4.ortho(0, canvas.width, canvas.height, 0, -1, 1);
  
  // 5. 渲染
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  shader.use();
  shader.setUniforms({
    u_modelMatrix: modelMatrix,
    u_viewMatrix: viewMatrix,
    u_projectionMatrix: projectionMatrix,
    u_texture: 0,
    u_opacity: 1.0,
    u_tintColor: [1, 1, 1, 1],
  });
  
  texture.bind(0);
  
  const posLoc = shader.getAttributeLocation('a_position');
  const texLoc = shader.getAttributeLocation('a_texCoord');
  quad.bindAttributes(posLoc, texLoc);
  quad.draw();
  
  texture.unbind();
}

renderImage().catch(console.error);
```

### 渲染视频（带颜色调整）

```typescript
async function renderVideo() {
  // 1-2. 初始化（同上）
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const contextWrapper = new WebGLContext(canvas);
  const gl = contextWrapper.getContext();
  
  const shaderManager = new ShaderManager(contextWrapper);
  const textureManager = new TextureManager(contextWrapper);
  const geometryManager = new GeometryManager(contextWrapper);
  
  // 3. 准备资源（使用视频着色器）
  shaderManager.register(BUILTIN_SHADERS.VIDEO);
  const shader = shaderManager.get('video');
  if (!shader) return;
  
  const videoResult = await textureManager.createVideoFromURL('/video.mp4', {
    autoUpdate: true,
    loop: true,
    muted: true,
  });
  const videoTexture = videoResult.texture as VideoTexture;
  
  const quad = geometryManager.createCustomQuad(
    videoTexture.width,
    videoTexture.height,
    true,
    false
  );
  
  // 4. 播放视频
  await videoTexture.play();
  
  // 5. 渲染循环
  function render() {
    // 更新视频纹理
    textureManager.updateVideoTextures();
    
    // 清屏
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // 设置着色器
    shader.use();
    
    // 设置变换矩阵
    const modelMatrix = Mat4.identity();
    const viewMatrix = Mat4.identity();
    const projectionMatrix = Mat4.ortho(0, canvas.width, canvas.height, 0, -1, 1);
    
    // 设置 uniforms
    shader.setUniforms({
      u_modelMatrix: modelMatrix,
      u_viewMatrix: viewMatrix,
      u_projectionMatrix: projectionMatrix,
      u_texture: 0,
      u_opacity: 1.0,
      u_tintColor: [1, 1, 1, 1],
      // 纹理坐标变换
      u_texCoordMatrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      u_texCoordOffset: [0, 0],
      u_texCoordScale: [1, 1],
      // 颜色调整
      u_brightness: 0.1,
      u_contrast: 1.2,
      u_saturation: 1.0,
      u_hue: 0.0,
      // 绿幕
      u_useChromaKey: false,
      u_chromaKeyColor: [0, 1, 0],
      u_chromaKeyThreshold: 0.4,
      u_chromaKeySmoothness: 0.1,
    });
    
    // 绘制
    videoTexture.bind(0);
    const posLoc = shader.getAttributeLocation('a_position');
    const texLoc = shader.getAttributeLocation('a_texCoord');
    quad.bindAttributes(posLoc, texLoc);
    quad.draw();
    videoTexture.unbind();
    
    requestAnimationFrame(render);
  }
  
  render();
}

renderVideo().catch(console.error);
```

---

## 常见问题

### Q1: 着色器编译失败怎么办？

```typescript
const shader = shaderManager.get('myShader');
if (!shader) {
  console.error('Shader compilation failed');
  // 检查着色器定义是否正确
  // 查看浏览器控制台的详细错误信息
}

// 或使用 getError 方法
const shader = shaderManager.createDirect(config);
if (!shader?.isReady()) {
  console.error('Shader error:', shader?.getError());
}
```

### Q2: 图片加载失败？

```typescript
try {
  const result = await textureManager.createImageFromURL('/image.png', {
    crossOrigin: 'anonymous',  // 确保设置 CORS
    onError: (error) => {
      console.error('Image load error:', error);
    },
  });
} catch (error) {
  console.error('Failed to load image:', error);
}
```

### Q3: 视频纹理不更新？

确保在渲染循环中调用更新：

```typescript
function render() {
  // 方法 1: 更新所有视频纹理
  textureManager.updateVideoTextures();
  
  // 方法 2: 手动更新特定纹理
  if (videoTexture.isPlaying()) {
    videoTexture.update();
  }
  
  // 渲染代码...
  
  requestAnimationFrame(render);
}
```

### Q4: 如何优化内存使用？

```typescript
// 1. 设置合理的缓存限制
const textureManager = new TextureManager(contextWrapper, {
  maxSize: 256 * 1024 * 1024,  // 256MB
  maxEntries: 50,
  ttl: 60000,  // 60秒后过期
});

// 2. 定期清理
setInterval(() => {
  textureManager.pruneCache();
  geometryManager.pruneUnused();
}, 60000);

// 3. 及时释放不用的资源
textureManager.release('texture-key');
geometryManager.release('geometry-key');

// 4. 监控内存使用
console.log('Memory usage:', textureManager.getMemoryUsage() / (1024 * 1024), 'MB');
```

### Q5: WebGL 上下文丢失怎么办？

```typescript
contextWrapper.on('contextlost', () => {
  console.warn('WebGL context lost');
  // 停止渲染循环
});

contextWrapper.on('contextrestored', () => {
  console.log('WebGL context restored');
  // 重新初始化资源
  shaderManager.reloadAll();
  // 重新加载纹理...
  // 重新创建几何体...
  // 恢复渲染循环
});
```

---

## 下一步

完成 Phase 2 的学习后，你可以：

1. **学习 Phase 3**: 场景管理系统（SceneManager, Layer, RenderNode）
2. **学习 Phase 4**: 渲染器核心（WebGLRenderer, RenderLoop）
3. **实践项目**: 创建一个简单的图片/视频播放器

查看完整文档：
- [Phase 2 完成报告](./PHASE2_COMPLETION_REPORT.md)
- [Phase 1 快速入门](./PHASE1_QUICKSTART.md)
- [实现计划](./PLAYER_IMPLEMENTATION_PLAN.md)

---

**更新日期**: 2024  
**版本**: 1.0.0