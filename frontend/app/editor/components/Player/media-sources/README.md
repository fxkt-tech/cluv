# 媒体源抽象层 (Media Source Abstraction Layer)

## 概述

媒体源抽象层是一个统一的接口系统，用于管理 WebGPU 播放器中的多种媒体类型（视频、静态图片、动态图片等）。通过这个抽象层，播放器可以用相同的方式处理不同类型的媒体资源。

## 架构设计

```
IMediaSource (接口)
    ├── VideoSource (视频)
    ├── StaticImageSource (静态图片)
    ├── AnimatedImageSource (动态图片 GIF/APNG)
    └── AudioSource (音频 - 待实现)
```

## 核心接口

### IMediaSource

所有媒体源必须实现的接口：

```typescript
interface IMediaSource {
  readonly id: string;
  readonly type: MediaType; // 'video' | 'image' | 'animated-image' | 'audio'
  readonly duration: number; // 媒体本身的固有时长
  readonly isLoaded: boolean;
  readonly width: number;
  readonly height: number;

  load(url: string): Promise<void>;
  getTexture(device: GPUDevice, time: number): TextureResult | null;
  play?(): void;   // 可选：视频/音频需要
  pause?(): void;  // 可选：视频/音频需要
  seek?(time: number): void; // 可选：视频/音频需要
  dispose(): void;
}
```

### TextureResult

纹理返回类型：

```typescript
interface TextureResult {
  type: 'external' | '2d';
  texture: GPUExternalTexture | GPUTexture;
}
```

- **external**: 用于视频，使用 `GPUExternalTexture` (texture_external)
- **2d**: 用于图片，使用 `GPUTexture` (texture_2d)

## 媒体类型实现

### 1. VideoSource (视频)

**特点**：
- 使用 `HTMLVideoElement` 作为底层
- 返回 `GPUExternalTexture` 类型
- 支持播放控制 (play/pause/seek)
- 视频时长由视频文件决定

**用法**：
```typescript
const videoSource = new VideoSource('video-1');
await videoSource.load('path/to/video.mp4');

// 在渲染循环中
const texture = videoSource.getTexture(device, currentTime);
if (texture && texture.type === 'external') {
  // 使用 texture_external shader
}
```

### 2. StaticImageSource (静态图片)

**特点**：
- 使用 `ImageBitmap` 加载图片
- 首次调用时创建 `GPUTexture` 并永久缓存
- 返回 `GPUTexture` 类型
- duration = Infinity (无固有时长)

**用法**：
```typescript
const imageSource = new StaticImageSource('image-1');
await imageSource.load('path/to/image.png');

const texture = imageSource.getTexture(device, currentTime);
if (texture && texture.type === '2d') {
  // 使用 texture_2d shader
}
```

### 3. AnimatedImageSource (动态图片)

**特点**：
- 使用 `ImageDecoder API` 解码 GIF/APNG
- 自动计算帧时长并循环播放
- LRU 缓存策略（最多缓存 20 帧）
- 降级支持：如果浏览器不支持 ImageDecoder，作为静态图片加载首帧

**用法**：
```typescript
const animatedSource = new AnimatedImageSource('gif-1');
await animatedSource.load('path/to/animation.gif');

// 动图会根据时间自动循环播放
const texture = animatedSource.getTexture(device, localTime);
```

**循环逻辑**：
```
假设动图总时长 2 秒，clip 时长 5 秒
时间 0s-2s: 播放第 1 轮
时间 2s-4s: 播放第 2 轮
时间 4s-5s: 播放第 3 轮（部分）
```

## MediaSourceFactory (工厂类)

自动检测媒体类型并创建对应的媒体源：

```typescript
// 自动检测
const source = await MediaSourceFactory.createAndLoad('id-1', 'video.mp4');
// 返回 VideoSource

const source2 = await MediaSourceFactory.createAndLoad('id-2', 'image.png');
// 返回 StaticImageSource

const source3 = await MediaSourceFactory.createAndLoad('id-3', 'animation.gif');
// 返回 AnimatedImageSource

// 手动指定类型
const source4 = MediaSourceFactory.createMediaSource('id-4', 'file.dat', 'video');
await source4.load('file.dat');
```

**支持的扩展名**：
- 视频: mp4, webm, ogg, mov, avi, mkv, m4v
- 静态图片: png, jpg, jpeg, webp, bmp, svg
- 动图: gif, apng
- 音频: mp3, wav, ogg, aac, m4a, flac (待实现)

## 在 WebGPUPlayer 中使用

### MediaLayer 接口

```typescript
interface MediaLayer {
  id: string;
  name: string;
  source: IMediaSource;  // 统一的媒体源
  zIndex: number;
  posX: number;
  posY: number;
  scale: number;
  startTime: number;
  clipDuration: number;  // 在时间轴上的显示时长（不是媒体本身的时长）
  baseScaleX: number;
  baseScaleY: number;
  uniformBuffer?: GPUBuffer;
  opacity?: number;
  rotation?: number;
}
```

### 添加媒体图层

```typescript
// 新方法：通用媒体图层
await player.addMediaLayer(
  'path/to/media.png',  // 媒体路径
  5.0,                   // 开始时间
  10.0,                  // 显示时长
  'My Image'             // 名称（可选）
);

// 旧方法：仍然支持（向后兼容）
await player.addVideoLayer(
  'path/to/video.mp4',
  5.0,
  'My Video'
);
```

### 渲染循环逻辑

```typescript
for (const layer of sortedLayers) {
  const localTime = newTime - layer.startTime;
  const isVisible = localTime >= 0 && localTime <= layer.clipDuration;
  
  if (!isVisible) continue;
  
  // 获取纹理（统一接口）
  const textureResult = layer.source.getTexture(device, localTime);
  if (!textureResult) continue;
  
  // 根据纹理类型选择管线
  const pipeline = textureResult.type === 'external' 
    ? pipelineExternal  // 视频
    : pipeline2D;        // 图片
  
  renderPass.setPipeline(pipeline);
  
  // 创建 bindGroup
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { 
        binding: 2, 
        resource: textureResult.type === 'external'
          ? textureResult.texture  // GPUExternalTexture
          : textureResult.texture.createView()  // GPUTextureView
      },
    ],
  });
  
  renderPass.setBindGroup(0, bindGroup);
  renderPass.draw(4);
}
```

## Shader 支持

需要两套 shader 来支持不同的纹理类型：

### SHADER_EXTERNAL (视频)

```wgsl
@group(0) @binding(2) var myTexture: texture_external;

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSampleBaseClampToEdge(myTexture, mySampler, uv);
}
```

### SHADER_2D (图片)

```wgsl
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(myTexture, mySampler, uv);
}
```

## 时间轴集成

### Timeline Clip 类型扩展

```typescript
interface Clip {
  id: string;
  type: 'video' | 'image';  // 新增 'image' 类型
  resourceSrc: string;
  startTime: number;
  duration: number;  // clip 在时间轴上的时长
  // ... 其他属性
}
```

### syncTracksToLayers 逻辑

```typescript
const mediaClips = tracks.flatMap(track =>
  track.clips
    .filter(clip => 
      (clip.type === 'video' || clip.type === 'image') && 
      clip.resourceSrc
    )
    .map(clip => ({
      id: clip.id,
      type: clip.type,
      src: clip.resourceSrc,
      startTime: clip.startTime,
      duration: clip.duration,  // 这是 clip 的时长，不是媒体本身的时长
      // ...
    }))
);

for (const clip of mediaClips) {
  const mediaUrl = convertFileSrc(clip.src);
  await addMediaLayer(
    mediaUrl,
    clip.startTime,
    clip.duration,  // 传递 clip 时长
    clip.name,
    clip.id,
    clip.transform
  );
}
```

## 性能优化

### 静态图片
- ✅ 一次加载，永久缓存
- ✅ GPU 纹理复用
- ✅ 无运行时开销

### 动态图片
- ✅ LRU 缓存策略（最多 20 帧）
- ✅ 按需创建纹理
- ⚠️ 大 GIF 可能占用较多内存

### 视频
- ✅ 使用 GPU 硬件解码
- ✅ 零拷贝纹理导入

## 浏览器兼容性

| 特性 | Chrome | Edge | Safari | Firefox |
|------|--------|------|--------|---------|
| WebGPU | ✅ | ✅ | ✅ (preview) | ⚠️ (Nightly) |
| ImageDecoder API | ✅ | ✅ | ❌ | ❌ |
| ImageBitmap | ✅ | ✅ | ✅ | ✅ |

**降级策略**：
- Safari/Firefox: AnimatedImageSource 自动降级为加载首帧作为静态图片
- 建议：使用 ImageBitmap 作为最低兼容标准

## 扩展指南

### 添加新媒体类型

1. **创建实现类**：
```typescript
export class AudioSource implements IMediaSource {
  readonly type = 'audio';
  private audioContext: AudioContext;
  
  async load(url: string): Promise<void> {
    // 实现音频加载逻辑
  }
  
  getTexture(device: GPUDevice, time: number): TextureResult | null {
    // 音频不需要纹理，返回 null
    return null;
  }
  
  dispose(): void {
    // 释放音频资源
  }
}
```

2. **更新工厂类**：
```typescript
case 'audio':
  return new AudioSource(id);
```

3. **更新类型定义**：
```typescript
export type MediaType = 'video' | 'image' | 'animated-image' | 'audio';
```

## 故障排查

### 图片无法显示
1. 检查文件格式是否支持
2. 检查 CORS 设置
3. 查看控制台是否有纹理创建错误

### 动图不循环
1. 确认 ImageDecoder API 是否可用
2. 检查 `clipDuration` 是否正确设置
3. 查看帧时长计算逻辑

### 视频黑屏
1. 确认视频编码格式浏览器支持
2. 检查 `readyState` 是否 >= 2
3. 确认没有 CORS 问题

### 性能问题
1. 限制同时播放的动图数量
2. 降低动图分辨率
3. 调整 LRU 缓存大小

## 示例代码

### 完整示例：添加混合媒体

```typescript
// 1. 添加视频
await player.addMediaLayer(
  '/videos/background.mp4',
  0,      // 从 0 秒开始
  10,     // 播放 10 秒
  'Background Video'
);

// 2. 添加静态 Logo
await player.addMediaLayer(
  '/images/logo.png',
  2,      // 2 秒后出现
  8,      // 显示 8 秒
  'Logo'
);

// 3. 添加动态贴纸
await player.addMediaLayer(
  '/stickers/fire.gif',
  5,      // 5 秒后出现
  5,      // 播放 5 秒
  'Fire Sticker'
);

// 开始播放
player.play();
```

### 手动控制示例

```typescript
// 创建媒体源
const source = new AnimatedImageSource('gif-1');
await source.load('/animations/loading.gif');

console.log('Duration:', source.duration);  // 例如: 1.5 秒
console.log('Size:', source.width, 'x', source.height);

// 获取特定时间的帧
const texture1 = source.getTexture(device, 0);     // 第一帧
const texture2 = source.getTexture(device, 0.75);  // 中间帧
const texture3 = source.getTexture(device, 3.0);   // 循环第 2 轮

// 清理
source.dispose();
```

## 未来规划

- [ ] 音频源实现
- [ ] LUT (Look-Up Table) 支持
- [ ] 特效层 (Effects Layer)
- [ ] 文字层 (Text Layer)
- [ ] Worker 多线程解码
- [ ] 预加载策略优化
- [ ] 内存占用监控

## 贡献指南

欢迎提交 PR 改进媒体源系统！请遵循以下规范：

1. 新增媒体类型必须实现 `IMediaSource` 接口
2. 添加完整的错误处理和资源释放逻辑
3. 编写单元测试
4. 更新本文档

## 许可证

与项目主仓库保持一致