# Player WebGL 重构方案

## 📋 总体目标

将 `PlayerArea` 组件从 HTML5 `<video>` 元素重构为基于 WebGL 的时间线播放器，支持：
- 多轨道视频渲染
- 视频片段 trim（裁剪）
- 混合模式和特效
- 高性能渲染

---

## 🎯 实现步骤（共8步）

### **步骤 1: 创建 WebGL Player 管理器核心类**

**目标**: 封装 WebGL 初始化和生命周期管理

**文件**: `frontend/app/webgl/player/WebGLPlayerManager.ts`

**实现内容**:
```typescript
class WebGLPlayerManager {
  // 初始化所有 WebGL 组件
  constructor(canvas: HTMLCanvasElement, options?)
  
  // 生命周期方法
  initialize(): Promise<void>
  dispose(): void
  
  // 播放控制（与原 Player 接口兼容）
  play(): void
  pause(): void
  seekTo(time: number): void
  getCurrentTime(): number
  getDuration(): number
  isPlaying(): boolean
  
  // 场景更新（接收 Timeline 状态）
  updateScene(tracks: Track[], currentTime: number): void
}
```

**使用的 WebGL 封装方法**:
- ✅ `WebGLContextManager(canvas, options)` - 创建 WebGL 上下文
- ✅ `ShaderManager(contextWrapper)` - 创建 shader 管理器
- ✅ `shaderManager.register(BUILTIN_SHADERS.BASE)` - 注册基础 shader
- ✅ `shaderManager.register(BUILTIN_SHADERS.VIDEO)` - 注册视频 shader
- ✅ `TextureManager(contextWrapper)` - 创建纹理管理器
- ✅ `GeometryManager(contextWrapper)` - 创建几何体管理器
- ✅ `geometryManager.createUnitQuad()` - 创建单位矩形
- ✅ `SceneManager({ width, height, frameRate })` - 创建场景管理器
- ✅ `sceneManager.createLayer(name, order)` - 创建渲染层
- ✅ `Camera.createOrthographic2D(width, height)` - 创建 2D 正交相机

**测试验证**:
- 在空白 canvas 上渲染纯色背景
- 验证所有管理器正确初始化

---

### **步骤 2: 实现 WebGL 渲染器集成**

**目标**: 将渲染器和渲染循环集成到 Player Manager

**文件**: 继续在 `WebGLPlayerManager.ts` 中实现

**实现内容**:
```typescript
class WebGLPlayerManager {
  private renderer: WebGLRenderer
  private renderLoop: RenderLoop
  
  private initializeRenderer(): void {
    // 创建渲染器和渲染循环
  }
  
  private startRenderLoop(): void {
    // 启动渲染循环
  }
  
  private stopRenderLoop(): void {
    // 停止渲染循环
  }
}
```

**使用的 WebGL 封装方法**:
- ✅ `new WebGLRenderer(contextWrapper, shaderManager, textureManager, geometryManager, options)` - 创建渲染器
  - `options.clearColor` - 设置背景色
  - `options.enableBatching` - 启用批渲染优化
  - `options.autoUpdateTextures` - 自动更新视频纹理
- ✅ `new RenderLoop(callbacks, options)` - 创建渲染循环
  - `callbacks.onUpdate(deltaTime, totalTime)` - 更新回调
  - `callbacks.onRender(deltaTime, totalTime, interpolation)` - 渲染回调
  - `options.targetFPS` - 目标帧率（60fps）
  - `options.autoStart` - 是否自动开始
- ✅ `renderer.render(sceneManager, camera, currentTime)` - 执行渲染
- ✅ `renderLoop.start()` - 启动循环
- ✅ `renderLoop.stop()` - 停止循环
- ✅ `renderLoop.getStats()` - 获取性能统计

**测试验证**:
- 渲染循环正常运行（60fps）
- 能正确启动和停止
- 性能统计正常输出

---

### **步骤 3: 实现视频资源加载与管理**

**目标**: 加载和缓存视频纹理资源

**文件**: `frontend/app/webgl/player/ResourceLoader.ts`

**实现内容**:
```typescript
class ResourceLoader {
  private textureCache: Map<string, VideoTexture>
  
  async loadVideoTexture(resourceId: string, url: string): Promise<VideoTexture>
  getTexture(resourceId: string): VideoTexture | undefined
  unloadTexture(resourceId: string): void
  preloadResources(clips: Clip[]): Promise<void>
  dispose(): void
}
```

**使用的 WebGL 封装方法**:
- ✅ `textureManager.createVideoFromURL(url, options)` - 从 URL 加载视频纹理
  - `options.autoUpdate: true` - 自动更新纹理
  - `options.loop: false` - 不循环播放
- ✅ `videoTexture.play()` - 播放视频
- ✅ `videoTexture.pause()` - 暂停视频
- ✅ `videoTexture.seek(time)` - 跳转到指定时间
- ✅ `videoTexture.getCurrentTime()` - 获取当前播放时间
- ✅ `videoTexture.getDuration()` - 获取视频时长
- ✅ `textureManager.delete(textureId)` - 删除纹理

**测试验证**:
- 成功加载单个视频纹理
- 缓存机制正常工作（重复加载同一资源不会重新请求）
- 资源正确释放

---

### **步骤 4: 实现 Timeline 到 Scene 的转换**

**目标**: 将 Timeline 的 tracks/clips 转换为 WebGL 场景节点

**文件**: `frontend/app/webgl/player/SceneBuilder.ts`

**实现内容**:
```typescript
class SceneBuilder {
  buildScene(
    tracks: Track[], 
    currentTime: number, 
    sceneManager: SceneManager,
    resourceLoader: ResourceLoader
  ): void
  
  private createNodeForClip(clip: Clip, trackIndex: number): RenderNode
  private getVisibleClips(tracks: Track[], currentTime: number): Clip[]
}
```

**使用的 WebGL 封装方法**:
- ✅ `sceneManager.clear()` - 清空场景
- ✅ `new RenderNode({ type, position, scale, rotation, blendMode })` - 创建渲染节点
  - `type: NodeType.VIDEO` - 视频类型节点
  - `position: { x, y }` - 位置（屏幕坐标）
  - `scale: { x, y }` - 缩放（视频尺寸）
  - `blendMode: BlendMode.NORMAL` - 混合模式
- ✅ `renderNode.setShaderName('video')` - 设置使用的 shader
- ✅ `renderNode.setTexture(videoTexture)` - 设置纹理
- ✅ `renderNode.setTextureId(resourceId)` - 设置纹理 ID
- ✅ `renderNode.setTiming(startTime, endTime)` - 设置时间范围
- ✅ `renderNode.setVisible(true)` - 设置可见性
- ✅ `layer.addNode(renderNode)` - 添加节点到图层
- ✅ `layer.clear()` - 清空图层
- ✅ `sceneManager.getVisibleNodes(camera, currentTime)` - 获取当前可见节点

**测试验证**:
- 单个视频 clip 正确转换为 RenderNode
- 多个 clips 同时渲染
- 时间范围外的 clip 不渲染

---

### **步骤 5: 实现视频 Trim 支持**

**目标**: 支持视频片段的裁剪（trimStart/trimEnd）

**文件**: 在 `SceneBuilder.ts` 中扩展

**实现内容**:
```typescript
private calculateTrimUniforms(clip: Clip, videoDuration: number) {
  const trimStartNormalized = clip.trimStart / videoDuration
  const trimEndNormalized = clip.trimEnd / videoDuration
  return { u_trimStart, u_trimEnd, u_trimDuration }
}
```

**使用的 WebGL 封装方法**:
- ✅ `renderNode.setCustomUniforms({ uniformName: value })` - 设置自定义 uniform
  - `u_trimStart: number` - trim 开始时间（归一化 0-1）
  - `u_trimEnd: number` - trim 结束时间（归一化 0-1）
  - `u_videoDuration: number` - 视频总时长
  - `u_playbackTime: number` - 当前播放时间
- ✅ `renderNode.getCustomUniforms()` - 获取自定义 uniform

**Shader 修改** (可能需要):
可能需要修改 `BUILTIN_SHADERS.VIDEO` 以支持 trim，在片段着色器中根据 `u_trimStart` 和 `u_trimEnd` 调整纹理坐标采样。

**测试验证**:
- trimStart 正确裁剪视频开头
- trimEnd 正确裁剪视频结尾
- trim 区间外显示黑屏或透明

---

### **步骤 6: 实现时间同步机制**

**目标**: 同步 Timeline 时间和视频播放时间

**文件**: 在 `WebGLPlayerManager.ts` 中实现

**实现内容**:
```typescript
class WebGLPlayerManager {
  private syncVideoTime(currentTime: number): void {
    // 为每个可见的视频纹理同步播放时间
  }
  
  private handlePlaybackState(isPlaying: boolean): void {
    // 同步播放/暂停状态
  }
}
```

**使用的 WebGL 封装方法**:
- ✅ `videoTexture.seek(time)` - 跳转到指定时间
- ✅ `videoTexture.play()` - 播放视频
- ✅ `videoTexture.pause()` - 暂停视频
- ✅ `videoTexture.setPlaybackRate(rate)` - 设置播放速率
- ✅ `videoTexture.getCurrentTime()` - 获取当前时间
- ✅ `textureManager.updateVideoTextures()` - 更新所有视频纹理

**时间同步逻辑**:
```
videoPlayTime = currentTime - clip.startTime + clip.trimStart
```

**测试验证**:
- 播放时视频与 Timeline 时间同步
- seek 操作立即生效
- 暂停时视频停止播放

---

### **步骤 7: 实现多轨道渲染**

**目标**: 支持多个视频轨道叠加渲染

**文件**: 在 `SceneBuilder.ts` 中扩展

**实现内容**:
```typescript
private createLayerForTrack(track: Track, trackIndex: number): Layer {
  const layer = sceneManager.createLayer(track.id, trackIndex)
  layer.setVisible(track.visible)
  // 设置混合模式等属性
  return layer
}
```

**使用的 WebGL 封装方法**:
- ✅ `sceneManager.createLayer(id, order)` - 创建图层（order 控制渲染顺序）
- ✅ `layer.setVisible(visible)` - 设置图层可见性
- ✅ `layer.setOpacity(opacity)` - 设置图层透明度
- ✅ `layer.getNodes()` - 获取图层中的所有节点
- ✅ `sceneManager.getLayers()` - 获取所有图层
- ✅ `sceneManager.getLayer(id)` - 根据 ID 获取图层

**渲染顺序**:
- Track order 低的先渲染（在底层）
- Track order 高的后渲染（在顶层）

**测试验证**:
- 多个轨道正确叠加渲染
- 轨道可见性切换生效
- 轨道顺序调整正确

---

### **步骤 8: 集成到 PlayerArea 组件**

**目标**: 用 WebGL Player 替换现有的 HTML5 video 元素

**文件**: `frontend/app/editor/components/Player/PlayerArea.tsx`

**实现内容**:
```typescript
// 替换 videoRef 为 canvasRef 和 playerManager
const canvasRef = useRef<HTMLCanvasElement>(null)
const playerManagerRef = useRef<WebGLPlayerManager | null>(null)

// 初始化 WebGL Player
useEffect(() => {
  if (canvasRef.current) {
    const manager = new WebGLPlayerManager(canvasRef.current)
    await manager.initialize()
    playerManagerRef.current = manager
  }
}, [])

// 同步 Timeline 状态
useEffect(() => {
  if (playerManagerRef.current) {
    const tracks = useTimelineStore.getState().tracks
    playerManagerRef.current.updateScene(tracks, currentTime)
  }
}, [tracks, currentTime])
```

**JSX 修改**:
```tsx
// 原: <video ref={videoRef} ... />
// 新: <canvas ref={canvasRef} className="..." />
```

**使用的 WebGL 封装方法**:
- ✅ 所有 `WebGLPlayerManager` 的公开方法
- ✅ `renderer.getStats()` - 用于性能监控
- ✅ `renderLoop.getStats()` - 用于 FPS 监控

**测试验证**:
- PlayerArea 组件正常渲染
- ref 方法接口保持兼容
- 与 Timeline 联动正常
- 播放/暂停/跳转功能正常

---

## 📦 新增文件清单

1. `frontend/app/webgl/player/WebGLPlayerManager.ts` - 核心管理器
2. `frontend/app/webgl/player/ResourceLoader.ts` - 资源加载器
3. `frontend/app/webgl/player/SceneBuilder.ts` - 场景构建器
4. `frontend/app/webgl/player/index.ts` - 导出入口
5. `frontend/app/webgl/player/types.ts` - 类型定义（如需要）

---

## 🔄 依赖关系图

```
PlayerArea (React Component)
    ↓
WebGLPlayerManager
    ↓ 管理
    ├── WebGLContextManager (Phase 1)
    ├── ShaderManager (Phase 2)
    ├── TextureManager (Phase 2)
    ├── GeometryManager (Phase 2)
    ├── SceneManager (Phase 3)
    ├── Camera (Phase 3)
    ├── WebGLRenderer (Phase 4)
    ├── RenderLoop (Phase 4)
    ├── ResourceLoader (新建)
    └── SceneBuilder (新建)
        ↓ 创建
        RenderNode (Phase 3)
```

---

## ✅ 每步完成的验收标准

| 步骤 | 验收标准 |
|------|---------|
| 步骤1 | Canvas 显示纯色背景，无 WebGL 错误 |
| 步骤2 | 渲染循环稳定在 60fps，可启动/停止 |
| 步骤3 | 成功加载并显示单个视频纹理 |
| 步骤4 | Timeline 中的 clip 正确转换为可见节点 |
| 步骤5 | 视频 trim 正确裁剪播放区间 |
| 步骤6 | 播放时时间与 Timeline 同步（误差 < 100ms） |
| 步骤7 | 多轨道视频正确叠加显示 |
| 步骤8 | 完整的播放器功能正常，原有功能不受影响 |

---

## 🎨 可选扩展功能（后续优化）

- **特效支持**: 亮度、对比度、饱和度调整（通过 shader uniform）
- **转场效果**: 淡入淡出、擦除等（新增 transition shader）
- **性能优化**: 只加载可见区域附近的资源
- **音频同步**: 集成 Web Audio API（目前只处理视频）
- **缩略图预览**: 使用 WebGL 渲染时间线缩略图

---

## 📚 相关文档

- [WebGL Player Phase 1-4 完整文档](./PROJECT_COMPLETE.md)
- [Phase 4 快速开始指南](./PHASE4_QUICKSTART.md)
- [WebGL API 参考](../app/webgl/README.md)

---

## 🔧 开发注意事项

1. **WebGL 上下文管理**: 确保在组件卸载时正确释放 WebGL 资源
2. **内存管理**: 视频纹理占用大量内存，需要及时释放未使用的资源
3. **性能监控**: 使用 `renderer.getStats()` 监控 drawCalls 和渲染性能
4. **错误处理**: WebGL 初始化可能失败，需要提供降级方案（回退到 HTML5 video）
5. **跨浏览器兼容**: 测试 Chrome、Firefox、Safari 的 WebGL 支持
6. **移动端适配**: 考虑移动设备的 WebGL 性能限制

---

**文档版本**: 1.0  
**创建日期**: 2024  
**最后更新**: 2024  
**负责人**: Frontend Team