# Phase 1 快速开始指南

本指南帮助你快速上手使用 Phase 1 完成的基础设施模块。

## 目录

- [安装和设置](#安装和设置)
- [基础用法](#基础用法)
- [常见场景](#常见场景)
- [API 参考](#api-参考)
- [故障排查](#故障排查)

## 安装和设置

### 前置条件

- Node.js 16+
- 支持 WebGL 的浏览器
- TypeScript 5+

### 导入模块

```typescript
// 导入类型
import type {
  WebGLContextOptions,
  RenderNodeData,
  LayerData,
} from '@/app/types'

// 导入 WebGL 上下文管理器
import { WebGLContextManager } from '@/app/webgl/core/WebGLContext'

// 导入数学工具
import { Mat4, Vec3, degToRad } from '@/app/webgl/utils/math'

// 导入 WebGL 工具函数
import {
  createProgramFromSource,
  createBuffer,
  createTextureFromImage,
} from '@/app/webgl/utils/webgl-utils'
```

## 基础用法

### 1. 创建 WebGL 上下文

```typescript
// 获取 Canvas 元素
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement

// 创建上下文管理器
const contextManager = new WebGLContextManager(canvas, {
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
})

// 获取 WebGL 上下文
const gl = contextManager.getContext()
if (!gl) {
  throw new Error('无法创建 WebGL 上下文')
}

console.log(`WebGL 版本: ${contextManager.isWebGL2() ? '2.0' : '1.0'}`)
```

### 2. 监听上下文事件

```typescript
// 监听上下文丢失
contextManager.on('contextlost', () => {
  console.log('WebGL 上下文丢失，正在清理资源...')
  // 清理你的资源
})

// 监听上下文恢复
contextManager.on('contextrestored', () => {
  console.log('WebGL 上下文已恢复，正在重新初始化...')
  // 重新创建资源
})

// 监听错误
contextManager.on('error', (error) => {
  console.error('WebGL 错误:', error)
})
```

### 3. 使用数学工具

```typescript
// 创建投影矩阵（正交投影）
const width = canvas.width
const height = canvas.height
const projection = Mat4.ortho(0, width, height, 0, -1, 1)

// 创建模型矩阵
const position = { x: 100, y: 100, z: 0 }
const rotation = { x: 0, y: 0, z: degToRad(45) } // 旋转 45 度
const scale = { x: 2, y: 2, z: 1 } // 放大 2 倍

const model = Mat4.fromTransform(position, rotation, scale)

// 合并矩阵
const mvp = Mat4.multiply(projection, model)

// 向量运算
const v1 = Vec3.create(1, 0, 0)
const v2 = Vec3.create(0, 1, 0)
const cross = Vec3.cross(v1, v2) // 叉积
const dot = Vec3.dot(v1, v2) // 点积
```

### 4. 创建 Shader Program

```typescript
const vertexShader = `
  attribute vec2 a_position;
  uniform mat4 u_matrix;
  
  void main() {
    gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision mediump float;
  uniform vec4 u_color;
  
  void main() {
    gl_FragColor = u_color;
  }
`

const program = createProgramFromSource(gl, vertexShader, fragmentShader)
if (!program) {
  throw new Error('无法创建 shader program')
}
```

### 5. 创建 Buffer

```typescript
// 创建顶点数据
const vertices = new Float32Array([
  0, 0,
  100, 0,
  100, 100,
  0, 100,
])

// 创建 buffer
const vertexBuffer = createBuffer(gl, vertices, gl.STATIC_DRAW)
if (!vertexBuffer) {
  throw new Error('无法创建 buffer')
}
```

### 6. 创建纹理

```typescript
// 从图像创建纹理
const image = new Image()
image.onload = () => {
  const texture = createTextureFromImage(gl, image, {
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    flipY: true,
  })
  
  if (!texture) {
    console.error('无法创建纹理')
    return
  }
  
  console.log('纹理创建成功')
}
image.src = 'path/to/image.png'
```

## 常见场景

### 场景 1: 初始化 WebGL 渲染器

```typescript
import { WebGLContextManager, isWebGLSupported } from '@/app/webgl/core/WebGLContext'

function initRenderer(canvas: HTMLCanvasElement) {
  // 检查浏览器支持
  if (!isWebGLSupported()) {
    alert('你的浏览器不支持 WebGL')
    return null
  }
  
  // 创建上下文
  const contextManager = new WebGLContextManager(canvas, {
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  
  const gl = contextManager.getContext()
  if (!gl) {
    console.error('无法创建 WebGL 上下文')
    return null
  }
  
  // 设置视口
  gl.viewport(0, 0, canvas.width, canvas.height)
  
  // 启用混合
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  
  // 设置清除颜色
  gl.clearColor(0, 0, 0, 1)
  
  return { gl, contextManager }
}
```

### 场景 2: 创建可复用的 Shader

```typescript
import { createProgramFromSource } from '@/app/webgl/utils/webgl-utils'

class ShaderCache {
  private programs = new Map<string, WebGLProgram>()
  
  constructor(private gl: WebGLRenderingContext | WebGL2RenderingContext) {}
  
  getProgram(
    name: string,
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null {
    // 检查缓存
    if (this.programs.has(name)) {
      return this.programs.get(name)!
    }
    
    // 创建新的 program
    const program = createProgramFromSource(
      this.gl,
      vertexSource,
      fragmentSource
    )
    
    if (program) {
      this.programs.set(name, program)
    }
    
    return program
  }
  
  dispose() {
    this.programs.forEach(program => {
      this.gl.deleteProgram(program)
    })
    this.programs.clear()
  }
}
```

### 场景 3: 矩阵变换动画

```typescript
import { Mat4, degToRad, lerp } from '@/app/webgl/utils/math'

class TransformAnimation {
  private startTime = 0
  private duration = 1000 // 1 秒
  
  constructor(
    private from: { x: number; y: number; rotation: number },
    private to: { x: number; y: number; rotation: number }
  ) {}
  
  start() {
    this.startTime = Date.now()
  }
  
  getMatrix(): Float32Array {
    const elapsed = Date.now() - this.startTime
    const t = Math.min(elapsed / this.duration, 1)
    
    // 插值位置
    const x = lerp(this.from.x, this.to.x, t)
    const y = lerp(this.from.y, this.to.y, t)
    
    // 插值旋转
    const rotation = lerp(this.from.rotation, this.to.rotation, t)
    
    // 创建变换矩阵
    return Mat4.fromTransform(
      { x, y, z: 0 },
      { x: 0, y: 0, z: degToRad(rotation) },
      { x: 1, y: 1, z: 1 }
    )
  }
  
  isComplete(): boolean {
    return Date.now() - this.startTime >= this.duration
  }
}
```

### 场景 4: 检查 WebGL 能力

```typescript
import { WebGLContextManager } from '@/app/webgl/core/WebGLContext'

function checkCapabilities(contextManager: WebGLContextManager) {
  const capabilities = {
    version: contextManager.isWebGL2() ? '2.0' : '1.0',
    maxTextureSize: contextManager.getMaxTextureSize(),
    maxTextureUnits: contextManager.getMaxTextureUnits(),
    maxVertexAttribs: contextManager.getMaxVertexAttribs(),
    maxAnisotropy: contextManager.getMaxAnisotropy(),
    extensions: contextManager.getLoadedExtensions(),
  }
  
  console.log('WebGL 能力:', capabilities)
  
  // 检查特定扩展
  if (contextManager.hasExtension('OES_texture_float')) {
    console.log('支持浮点纹理')
  }
  
  return capabilities
}
```

## API 参考

### WebGLContextManager

```typescript
class WebGLContextManager {
  constructor(canvas: HTMLCanvasElement, options?: WebGLContextOptions)
  
  // 上下文访问
  getContext(): WebGLRenderingContext | WebGL2RenderingContext | null
  getCanvas(): HTMLCanvasElement
  isWebGL2(): boolean
  getVersion(): WebGLVersion
  isContextLost(): boolean
  
  // 扩展管理
  getExtension<T>(name: string): T | null
  hasExtension(name: string): boolean
  getLoadedExtensions(): string[]
  getExtensions(): Partial<WebGLExtensions>
  
  // 能力查询
  getMaxTextureSize(): number
  getMaxTextureUnits(): number
  getMaxVertexAttribs(): number
  getMaxAnisotropy(): number
  getParameters(): Record<string, unknown>
  
  // 事件
  on(event: 'contextlost' | 'contextrestored' | 'error', callback: Function): void
  off(event: 'contextlost' | 'contextrestored' | 'error', callback: Function): void
  
  // 清理
  destroy(): void
}
```

### Mat4

```typescript
class Mat4 {
  static identity(): Float32Array
  static multiply(a: Float32Array, b: Float32Array): Float32Array
  static translate(x: number, y: number, z: number): Float32Array
  static scale(x: number, y: number, z: number): Float32Array
  static rotateX(angle: number): Float32Array
  static rotateY(angle: number): Float32Array
  static rotateZ(angle: number): Float32Array
  static ortho(left, right, bottom, top, near, far): Float32Array
  static perspective(fov, aspect, near, far): Float32Array
  static invert(m: Float32Array): Float32Array | null
  static transpose(m: Float32Array): Float32Array
  static fromTransform(position, rotation, scale): Float32Array
  static clone(m: Float32Array): Float32Array
}
```

### Vec3

```typescript
class Vec3 {
  static create(x: number, y: number, z: number): Float32Array
  static normalize(v: Float32Array): Float32Array
  static dot(a: Float32Array, b: Float32Array): number
  static cross(a: Float32Array, b: Float32Array): Float32Array
  static add(a: Float32Array, b: Float32Array): Float32Array
  static subtract(a: Float32Array, b: Float32Array): Float32Array
  static scale(v: Float32Array, s: number): Float32Array
  static magnitude(v: Float32Array): number
  static distance(a: Float32Array, b: Float32Array): number
  static lerp(a: Float32Array, b: Float32Array, t: number): Float32Array
  static clone(v: Float32Array): Float32Array
}
```

## 故障排查

### 问题 1: WebGL 上下文创建失败

**症状**: `getContext()` 返回 `null`

**解决方案**:
1. 检查浏览器是否支持 WebGL
   ```typescript
   if (!isWebGLSupported()) {
     console.error('浏览器不支持 WebGL')
   }
   ```

2. 检查 Canvas 元素是否有效
   ```typescript
   if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
     console.error('无效的 Canvas 元素')
   }
   ```

3. 检查是否已经创建了太多上下文（浏览器限制）

### 问题 2: Shader 编译失败

**症状**: `createShader()` 返回 `null`

**解决方案**:
1. 检查控制台的错误信息
2. 验证 shader 语法
3. 确保版本声明正确（WebGL 1.0 vs 2.0）

```typescript
// WebGL 1.0
const shader = `
  precision mediump float;
  // ...
`

// WebGL 2.0
const shader = `
  #version 300 es
  precision mediump float;
  // ...
`
```

### 问题 3: 纹理显示为黑色

**症状**: 纹理创建成功但显示为黑色

**解决方案**:
1. 确保图像已加载
   ```typescript
   image.onload = () => {
     // 在这里创建纹理
   }
   ```

2. 检查纹理坐标
3. 检查纹理参数设置
4. 确保纹理尺寸为 2 的幂（如果需要 mipmap）

### 问题 4: 矩阵计算结果不正确

**症状**: 对象位置/旋转/缩放不符合预期

**解决方案**:
1. 检查矩阵乘法顺序（列优先）
2. 确保角度单位正确（弧度 vs 角度）
   ```typescript
   const angleRad = degToRad(45) // 将角度转换为弧度
   ```

3. 验证变换顺序（通常是 TRS: Translate-Rotate-Scale）

### 问题 5: 性能问题

**症状**: 帧率低，渲染卡顿

**解决方案**:
1. 避免频繁创建新的 TypedArray
   ```typescript
   // 不好
   function render() {
     const matrix = Mat4.identity() // 每帧创建新数组
   }
   
   // 好
   const matrix = Mat4.identity() // 创建一次
   function render() {
     // 复用 matrix
   }
   ```

2. 使用批处理减少绘制调用
3. 启用扩展优化（如各向异性过滤）
4. 检查是否有内存泄漏

## 下一步

完成基础设施的学习后，你可以：

1. 继续学习 Phase 2: 渲染基础
2. 查看完整的 [实施方案](./PLAYER_IMPLEMENTATION_PLAN.md)
3. 阅读 [WebGL 模块文档](../frontend/app/webgl/README.md)
4. 参考 [Phase 1 完成报告](./PHASE1_COMPLETION_REPORT.md)

## 资源链接

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [MDN WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 获取帮助

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 检查本文档的故障排查部分
3. 参考完整的 API 文档
4. 查看测试用例中的示例代码

---

**最后更新**: 2024年  
**版本**: Phase 1  
**状态**: 稳定