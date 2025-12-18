# WebGPU + WebCodecs 极简多媒体播放器实现方案

## 项目概述

在 `frontend/app/player/page.tsx` 中实现一个单文件的 WebGPU + WebCodecs 多媒体播放器。

## 核心要求

1. ✅ **所有代码写在一个文件** - `page.tsx`
2. ✅ **使用 Web API 加载文件** - `<input type="file">`
3. ✅ **WebGPU 渲染** - 视频帧合成
4. ✅ **WebCodecs 解码** - 视频解码
5. ✅ **层级管理** - 上下按钮调整顺序
6. ✅ **位置调整** - 输入框设置 x, y 坐标

## 极简架构

```
frontend/app/player/
└── page.tsx  (约 500-800 行代码)
```

## 数据结构

```typescript
interface VideoTrack {
  id: string;
  name: string;
  file: File;
  x: number;        // 位置 x
  y: number;        // 位置 y
  width: number;    // 显示宽度
  height: number;   // 显示高度
  zIndex: number;   // 层级
  decoder: VideoDecoder | null;
  currentFrame: VideoFrame | null;
}
```

## 核心功能模块

### 1. 文件加载 (Web API)

```typescript
<input 
  type="file" 
  accept="video/*" 
  multiple 
  onChange={handleFileSelect}
/>

const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  for (const file of files) {
    const track: VideoTrack = {
      id: Date.now().toString(),
      name: file.name,
      file,
      x: 0,
      y: 0,
      width: 640,
      height: 360,
      zIndex: tracks.length,
      decoder: null,
      currentFrame: null,
    };
    await initDecoder(track);
    setTracks(prev => [...prev, track]);
  }
};
```

### 2. WebCodecs 视频解码 (简化版)

```typescript
const initDecoder = async (track: VideoTrack) => {
  // 读取文件
  const buffer = await track.file.arrayBuffer();
  
  // 简单的 MP4 解析 (使用 mp4box.js)
  const mp4boxfile = MP4Box.createFile();
  mp4boxfile.onReady = (info) => {
    const videoTrack = info.videoTracks[0];
    
    // 配置解码器
    track.decoder = new VideoDecoder({
      output: (frame) => {
        // 关闭旧帧
        if (track.currentFrame) {
          track.currentFrame.close();
        }
        track.currentFrame = frame;
      },
      error: (e) => console.error('Decode error:', e),
    });
    
    track.decoder.configure({
      codec: videoTrack.codec,
      codedWidth: videoTrack.video.width,
      codedHeight: videoTrack.video.height,
    });
    
    // 开始解码
    mp4boxfile.setExtractionOptions(videoTrack.id, null, {nbSamples: 100});
    mp4boxfile.start();
  };
  
  mp4boxfile.onSamples = (track_id, ref, samples) => {
    for (const sample of samples) {
      const chunk = new EncodedVideoChunk({
        type: sample.is_sync ? 'key' : 'delta',
        timestamp: sample.cts,
        duration: sample.duration,
        data: sample.data,
      });
      track.decoder.decode(chunk);
    }
  };
  
  mp4boxfile.appendBuffer(buffer);
  mp4boxfile.flush();
};
```

### 3. WebGPU 渲染 (简化版)

```typescript
const initWebGPU = async () => {
  const canvas = canvasRef.current!;
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter!.requestDevice();
  
  const context = canvas.getContext('webgpu')!;
  context.configure({
    device,
    format: 'bgra8unorm',
  });
  
  // 简单的着色器
  const shaderCode = `
    @vertex
    fn vs_main(@location(0) pos: vec2f) -> @builtin(position) vec4f {
      return vec4f(pos, 0.0, 1.0);
    }
    
    @group(0) @binding(0) var myTexture: texture_2d<f32>;
    @group(0) @binding(1) var mySampler: sampler;
    
    @fragment
    fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
      let texCoord = pos.xy / vec2f(1920.0, 1080.0);
      return textureSample(myTexture, mySampler, texCoord);
    }
  `;
  
  const shaderModule = device.createShaderModule({ code: shaderCode });
  
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format: 'bgra8unorm' }],
    },
  });
  
  return { device, context, pipeline };
};
```

### 4. 渲染循环

```typescript
const render = () => {
  if (!gpu) return;
  
  const commandEncoder = gpu.device.createCommandEncoder();
  const textureView = gpu.context.getCurrentTexture().createView();
  
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: textureView,
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
    }],
  });
  
  // 按 zIndex 排序
  const sortedTracks = [...tracks].sort((a, b) => a.zIndex - b.zIndex);
  
  for (const track of sortedTracks) {
    if (!track.currentFrame) continue;
    
    // 将 VideoFrame 转为 GPU 纹理
    const texture = gpu.device.importExternalTexture({
      source: track.currentFrame,
    });
    
    // 绘制
    renderPass.setPipeline(gpu.pipeline);
    // ... 设置位置和绘制
    renderPass.draw(6);
  }
  
  renderPass.end();
  gpu.device.queue.submit([commandEncoder.finish()]);
  
  requestAnimationFrame(render);
};
```

### 5. UI 布局

```typescript
return (
  <div className="flex h-screen">
    {/* 左侧：视频列表 */}
    <div className="w-64 bg-gray-100 p-4">
      <input type="file" accept="video/*" multiple onChange={handleFileSelect} />
      
      <div className="mt-4 space-y-2">
        {tracks.map((track, index) => (
          <div key={track.id} className="bg-white p-2 rounded">
            <div>{track.name}</div>
            <div className="flex gap-1 mt-1">
              <button onClick={() => moveUp(index)}>↑</button>
              <button onClick={() => moveDown(index)}>↓</button>
              <button onClick={() => removeTrack(index)}>删除</button>
            </div>
            <div className="mt-1">
              <input 
                type="number" 
                placeholder="X" 
                value={track.x}
                onChange={(e) => updatePosition(index, 'x', Number(e.target.value))}
              />
              <input 
                type="number" 
                placeholder="Y" 
                value={track.y}
                onChange={(e) => updatePosition(index, 'y', Number(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
    
    {/* 右侧：画布 */}
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <canvas ref={canvasRef} width={1920} height={1080} />
    </div>
  </div>
);
```

## 完整实现步骤

### Step 1: 基础框架 (30 分钟)
- 创建 page.tsx
- 添加基本的 React 状态和 UI 布局
- 实现文件选择功能

### Step 2: WebCodecs 解码 (1-2 小时)
- 添加 mp4box.js 依赖
- 实现视频解码器初始化
- 获取第一帧显示

### Step 3: WebGPU 渲染 (2-3 小时)
- 初始化 WebGPU
- 编写简单的着色器
- 实现单个视频渲染

### Step 4: 多视频合成 (1 小时)
- 实现多层渲染
- 添加位置偏移计算

### Step 5: 交互功能 (1 小时)
- 层级调整（上下移动）
- 位置输入框
- 删除功能

## 依赖库

```json
{
  "dependencies": {
    "mp4box": "^0.5.2"
  },
  "devDependencies": {
    "@webgpu/types": "^0.1.38"
  }
}
```

## 代码文件结构

```typescript
// page.tsx 完整结构

'use client';

import { useState, useRef, useEffect } from 'react';

// 1. 类型定义 (20 行)
interface VideoTrack { ... }

// 2. 主组件 (500 行)
export default function PlayerPage() {
  // 状态
  const [tracks, setTracks] = useState<VideoTrack[]>([]);
  const [gpu, setGpu] = useState<any>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // WebGPU 初始化 (50 行)
  useEffect(() => { ... }, []);
  
  // 渲染循环 (50 行)
  useEffect(() => { ... }, [tracks, gpu]);
  
  // 文件处理函数 (100 行)
  const handleFileSelect = async () => { ... };
  const initDecoder = async () => { ... };
  
  // 交互函数 (50 行)
  const moveUp = () => { ... };
  const moveDown = () => { ... };
  const updatePosition = () => { ... };
  const removeTrack = () => { ... };
  
  // UI 渲染 (100 行)
  return ( ... );
}
```

## 简化点

1. **不实现音频** - 只做视频渲染
2. **不做时间同步** - 简单的帧循环
3. **不做复杂变换** - 只支持 x, y 平移
4. **不做缩放旋转** - 固定大小
5. **不做播放控制** - 自动循环播放
6. **不做进度条** - 简化时间轴
7. **使用 mp4box.js** - 不手写 demuxer
8. **固定画布大小** - 1920x1080

## 核心代码示例 (最小实现)

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import * as MP4Box from 'mp4box';

interface VideoTrack {
  id: string;
  name: string;
  x: number;
  y: number;
  zIndex: number;
  frame: VideoFrame | null;
}

export default function PlayerPage() {
  const [tracks, setTracks] = useState<VideoTrack[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 简化：直接在这里实现所有逻辑
  
  return (
    <div className="flex h-screen">
      <aside className="w-64 p-4 bg-gray-100">
        <input type="file" accept="video/*" multiple />
        {/* 视频列表 */}
      </aside>
      <main className="flex-1 flex items-center justify-center bg-black">
        <canvas ref={canvasRef} width={1920} height={1080} />
      </main>
    </div>
  );
}
```

## 预计开发时间

- **总计**: 6-8 小时
- **代码量**: 500-800 行（单文件）
- **难度**: 中等（需要理解 WebGPU 和 WebCodecs API）

## 浏览器要求

- Chrome 113+ (WebGPU)
- Chrome 94+ (WebCodecs)
- 需要 HTTPS 或 localhost

## 总结

这是一个极简版本，所有代码都在 `page.tsx` 中，使用最基本的 Web API，实现核心功能：

✅ 加载多个视频  
✅ WebGPU 渲染  
✅ WebCodecs 解码  
✅ 层级调整  
✅ 位置调整  

去掉了所有复杂的功能，适合快速实现和理解原理。