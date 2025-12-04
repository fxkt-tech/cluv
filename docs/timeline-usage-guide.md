# Timeline 使用指南

本文档介绍如何使用新实现的 Timeline 组件系统。

## 目录

- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [组件说明](#组件说明)
- [Store API](#store-api)
- [工具函数](#工具函数)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

## 快速开始

### 1. 基本使用

```tsx
import { Timeline } from '@/app/editor/components';

function EditorPage() {
  return (
    <div className="h-screen">
      <Timeline className="h-80" />
    </div>
  );
}
```

### 2. 初始化默认轨道

```tsx
import { useEffect } from 'react';
import { useTimelineStore } from '@/app/editor/stores/timelineStore';

function EditorPage() {
  const tracks = useTimelineStore((state) => state.tracks);
  const addTrack = useTimelineStore((state) => state.addTrack);

  useEffect(() => {
    if (tracks.length === 0) {
      addTrack('video');
      addTrack('audio');
    }
  }, []);

  return <Timeline />;
}
```

### 3. 添加 Clip

```tsx
import { useTimelineStore } from '@/app/editor/stores/timelineStore';

function ResourcePanel() {
  const addClip = useTimelineStore((state) => state.addClip);
  const tracks = useTimelineStore((state) => state.tracks);

  const handleAddClip = () => {
    const videoTrack = tracks.find(t => t.type === 'video');
    if (!videoTrack) return;

    addClip(videoTrack.id, {
      name: 'My Video',
      type: 'video',
      startTime: 0,
      duration: 5,
      resourceSrc: '/path/to/video.mp4',
      trimStart: 0,
      trimEnd: 5,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      opacity: 1,
      volume: 1,
    });
  };

  return <button onClick={handleAddClip}>Add Clip</button>;
}
```

## 核心概念

### Timeline 结构

```
Timeline (容器)
├── TimelineRuler (时间标尺)
├── Playhead (播放指针)
└── Tracks (轨道列表)
    ├── TrackHeader (轨道控制面板)
    └── TimelineTrack (轨道内容)
        └── TimelineClip (片段)
```

### 数据模型

#### Track (轨道)

```typescript
interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio';
  clips: Clip[];
  visible: boolean;
  locked: boolean;
  muted: boolean;
  order: number;
}
```

#### Clip (片段)

```typescript
interface Clip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  trackId: string;
  startTime: number;
  duration: number;
  resourceId?: string;
  resourceSrc?: string;
  trimStart: number;
  trimEnd: number;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;
  volume: number;
}
```

## 组件说明

### Timeline

主时间轴容器组件。

**Props:**
```typescript
interface TimelineProps {
  className?: string;
}
```

**功能:**
- 显示轨道列表
- 工具栏（添加轨道、缩放控制）
- 支持 Ctrl+滚轮缩放
- 水平滚动

### TimelineRuler

时间标尺组件，显示时间刻度。

**Props:**
```typescript
interface TimelineRulerProps {
  width: number;
}
```

**功能:**
- 动态刻度间隔
- 时间标签显示
- 总时长显示

### Playhead

播放指针组件。

**Props:**
```typescript
interface PlayheadProps {
  containerWidth: number;
  containerHeight: number;
}
```

**功能:**
- 可视化当前时间
- 拖拽调整时间
- 点击标尺跳转

### TimelineClip

片段组件。

**Props:**
```typescript
interface TimelineClipProps {
  clip: Clip;
  isSelected: boolean;
}
```

**功能:**
- 显示片段信息
- 单选/多选支持
- 媒体类型颜色区分
- 边缘调整手柄

### TimelineTrack

轨道组件。

**Props:**
```typescript
interface TimelineTrackProps {
  track: Track;
  index: number;
}
```

**功能:**
- 显示轨道内的片段
- 背景网格
- 锁定/隐藏状态

### TrackHeader

轨道控制面板。

**Props:**
```typescript
interface TrackHeaderProps {
  track: Track;
  index: number;
}
```

**功能:**
- 轨道名称编辑
- 可见性控制
- 锁定控制
- 静音控制
- 删除轨道

## Store API

### 轨道操作

```typescript
// 添加轨道
const addTrack = useTimelineStore((state) => state.addTrack);
addTrack('video'); // 或 'audio'

// 删除轨道
const removeTrack = useTimelineStore((state) => state.removeTrack);
removeTrack('track_id');

// 更新轨道
const updateTrack = useTimelineStore((state) => state.updateTrack);
updateTrack('track_id', { visible: false, locked: true });

// 重新排序轨道
const reorderTracks = useTimelineStore((state) => state.reorderTracks);
reorderTracks(['track_2', 'track_1', 'track_3']);
```

### Clip 操作

```typescript
// 添加片段
const addClip = useTimelineStore((state) => state.addClip);
addClip('track_id', {
  name: 'Clip Name',
  type: 'video',
  startTime: 2,
  duration: 5,
  // ... 其他属性
});

// 删除片段
const removeClip = useTimelineStore((state) => state.removeClip);
removeClip('clip_id');

// 更新片段
const updateClip = useTimelineStore((state) => state.updateClip);
updateClip('clip_id', { startTime: 3, duration: 4 });

// 移动片段到其他轨道
const moveClip = useTimelineStore((state) => state.moveClip);
moveClip('clip_id', 'target_track_id', 5); // 5 是新的开始时间

// 复制片段
const duplicateClip = useTimelineStore((state) => state.duplicateClip);
duplicateClip('clip_id');
```

### 选择操作

```typescript
// 选择片段
const selectClip = useTimelineStore((state) => state.selectClip);
selectClip('clip_id'); // 单选
selectClip('clip_id', true); // 添加到选择

// 取消选择
const deselectClip = useTimelineStore((state) => state.deselectClip);
deselectClip('clip_id');

// 清除所有选择
const clearSelection = useTimelineStore((state) => state.clearSelection);
clearSelection();

// 选择轨道
const selectTrack = useTimelineStore((state) => state.selectTrack);
selectTrack('track_id');
```

### 时间轴操作

```typescript
// 设置当前时间
const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
setCurrentTime(5.5);

// 设置总时长
const setDuration = useTimelineStore((state) => state.setDuration);
setDuration(60);

// 缩放
const zoomIn = useTimelineStore((state) => state.zoomIn);
const zoomOut = useTimelineStore((state) => state.zoomOut);
zoomIn();
zoomOut();

// 设置缩放级别
const setZoomLevel = useTimelineStore((state) => state.setZoomLevel);
setZoomLevel(1.5);

// 设置滚动位置
const setScrollLeft = useTimelineStore((state) => state.setScrollLeft);
setScrollLeft(100);
```

### 查询方法

```typescript
// 根据 ID 获取片段
const getClipById = useTimelineStore((state) => state.getClipById);
const clip = getClipById('clip_id');

// 根据 ID 获取轨道
const getTrackById = useTimelineStore((state) => state.getTrackById);
const track = getTrackById('track_id');

// 获取指定时间的所有片段
const getClipsAtTime = useTimelineStore((state) => state.getClipsAtTime);
const clips = getClipsAtTime(5.5);
```

### 批量操作

```typescript
// 删除所有选中的片段
const deleteSelectedClips = useTimelineStore((state) => state.deleteSelectedClips);
deleteSelectedClips();

// 重置所有状态
const reset = useTimelineStore((state) => state.reset);
reset();
```

## 工具函数

```typescript
import {
  timeToPixels,
  pixelsToTime,
  formatTime,
  formatTimeSimple,
  snapTime,
  calculateTimeMarks,
  detectClipCollision,
  clamp,
  generateId,
  secondsToFrames,
  framesToSeconds,
  getClipEndTime,
  timeRangesOverlap,
  getTrackDuration,
  roundTo,
} from '@/app/editor/utils/timeline';

// 时间转像素
const pixels = timeToPixels(5, 50); // 5 秒，50 像素/秒

// 像素转时间
const time = pixelsToTime(250, 50); // 250 像素，50 像素/秒

// 格式化时间
const formatted = formatTime(65.5); // "00:01:05.500"
const simple = formatTimeSimple(65.5); // "01:05"

// 吸附
const snapped = snapTime(5.1, [0, 5, 10], 5, 50);

// 检测碰撞
const hasCollision = detectClipCollision(clip, otherClips);

// 限制范围
const clamped = clamp(15, 0, 10); // 返回 10

// 生成 ID
const id = generateId('clip'); // "clip_1234567890_abc123"
```

## 使用示例

### 示例 1: 完整的编辑器页面

```tsx
import { useEffect } from 'react';
import { Timeline } from '@/app/editor/components';
import { useTimelineStore } from '@/app/editor/stores/timelineStore';

export default function EditorPage() {
  const tracks = useTimelineStore((state) => state.tracks);
  const addTrack = useTimelineStore((state) => state.addTrack);

  useEffect(() => {
    if (tracks.length === 0) {
      addTrack('video');
      addTrack('audio');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 bg-gray-800">
        {/* Header */}
      </header>
      <main className="flex-1 flex">
        <aside className="w-64 bg-gray-900">
          {/* Resource Panel */}
        </aside>
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            {/* Player Area */}
          </div>
          <Timeline className="h-80" />
        </div>
      </main>
    </div>
  );
}
```

### 示例 2: 监听状态变化

```tsx
import { useTimelineStore } from '@/app/editor/stores/timelineStore';

function StatusBar() {
  const currentTime = useTimelineStore((state) => state.currentTime);
  const duration = useTimelineStore((state) => state.duration);
  const selectedCount = useTimelineStore((state) => state.selectedClipIds.length);

  return (
    <div className="flex gap-4 text-sm">
      <span>Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
      <span>Selected: {selectedCount}</span>
    </div>
  );
}
```

### 示例 3: 自定义工具栏

```tsx
import { useTimelineStore } from '@/app/editor/stores/timelineStore';

function CustomToolbar() {
  const addTrack = useTimelineStore((state) => state.addTrack);
  const zoomIn = useTimelineStore((state) => state.zoomIn);
  const zoomOut = useTimelineStore((state) => state.zoomOut);
  const deleteSelectedClips = useTimelineStore((state) => state.deleteSelectedClips);

  return (
    <div className="flex gap-2 p-2">
      <button onClick={() => addTrack('video')}>Add Video</button>
      <button onClick={() => addTrack('audio')}>Add Audio</button>
      <button onClick={zoomIn}>Zoom In</button>
      <button onClick={zoomOut}>Zoom Out</button>
      <button onClick={deleteSelectedClips}>Delete</button>
    </div>
  );
}
```

### 示例 4: 程序化添加片段

```tsx
function importVideo(filePath: string, duration: number) {
  const tracks = useTimelineStore.getState().tracks;
  const addClip = useTimelineStore.getState().addClip;

  const videoTrack = tracks.find(t => t.type === 'video');
  if (!videoTrack) {
    console.error('No video track found');
    return;
  }

  addClip(videoTrack.id, {
    name: filePath.split('/').pop() || 'Video',
    type: 'video',
    startTime: 0,
    duration: duration,
    resourceSrc: filePath,
    trimStart: 0,
    trimEnd: duration,
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    opacity: 1,
    volume: 1,
  });
}
```

## 最佳实践

### 1. 使用选择器优化性能

```tsx
// ❌ 不好 - 会导致不必要的重渲染
const state = useTimelineStore();

// ✅ 好 - 只在需要的数据变化时重渲染
const currentTime = useTimelineStore((state) => state.currentTime);
const tracks = useTimelineStore((state) => state.tracks);
```

### 2. 批量操作使用 Store 的 get

```tsx
// ❌ 不好 - 多次调用 Hook
function Component() {
  const addTrack = useTimelineStore((state) => state.addTrack);
  const addClip = useTimelineStore((state) => state.addClip);
  
  // ...
}

// ✅ 好 - 在事件处理中使用 getState
function handleImport() {
  const { addTrack, addClip, tracks } = useTimelineStore.getState();
  
  // 批量操作
  if (tracks.length === 0) {
    addTrack('video');
  }
  const videoTrack = tracks.find(t => t.type === 'video');
  if (videoTrack) {
    addClip(videoTrack.id, clipData);
  }
}
```

### 3. 类型安全

```tsx
import { Clip, Track, MediaType } from '@/app/editor/types/timeline';

// 使用定义的类型
function processClip(clip: Clip) {
  // TypeScript 会提供完整的类型检查
}

function addMediaClip(trackId: string, type: MediaType) {
  // type 只能是 'video' | 'audio' | 'image' | 'text'
}
```

### 4. 错误处理

```tsx
function safeAddClip(trackId: string, clipData: Omit<Clip, 'id' | 'trackId'>) {
  const { tracks, addClip } = useTimelineStore.getState();
  
  const track = tracks.find(t => t.id === trackId);
  if (!track) {
    console.error(`Track ${trackId} not found`);
    return;
  }
  
  if (track.locked) {
    console.warn('Cannot add clip to locked track');
    return;
  }
  
  addClip(trackId, clipData);
}
```

### 5. 清理资源

```tsx
function EditorPage() {
  const reset = useTimelineStore((state) => state.reset);
  
  useEffect(() => {
    // 组件卸载时清理
    return () => {
      reset();
    };
  }, [reset]);
  
  return <Timeline />;
}
```

## 配置

### 自定义配置

可以修改 `TIMELINE_CONFIG` 来自定义 Timeline 的行为：

```typescript
// app/editor/types/timeline.ts
export const TIMELINE_CONFIG = {
  TRACK_HEIGHT: 80,              // 轨道高度
  TRACK_HEADER_WIDTH: 180,       // 轨道头部宽度
  MIN_CLIP_WIDTH: 10,            // 最小片段宽度
  BASE_PIXELS_PER_SECOND: 50,    // 基础缩放级别
  MIN_ZOOM: 0.1,                 // 最小缩放倍数
  MAX_ZOOM: 10,                  // 最大缩放倍数
  SNAP_THRESHOLD: 5,             // 吸附阈值（像素）
  RULER_HEIGHT: 30,              // 标尺高度
  MAJOR_TICK_INTERVAL: 1,        // 主刻度间隔（秒）
  MINOR_TICK_COUNT: 5,           // 次刻度数量
} as const;
```

## 键盘快捷键（待实现 - Phase 4）

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放/暂停 |
| `Delete` | 删除选中片段 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + Shift + Z` | 重做 |
| `Cmd/Ctrl + C` | 复制 |
| `Cmd/Ctrl + V` | 粘贴 |
| `Cmd/Ctrl + D` | 复制片段 |
| `←` `→` | 移动播放头 |
| `Cmd/Ctrl + +` | 放大 |
| `Cmd/Ctrl + -` | 缩小 |

## 故障排除

### 问题 1: Timeline 不显示

**原因**: 容器高度未设置

**解决**:
```tsx
<Timeline className="h-80" /> // 设置固定高度
```

### 问题 2: Clip 添加后看不见

**原因**: 轨道被锁定或隐藏

**解决**:
```tsx
const updateTrack = useTimelineStore((state) => state.updateTrack);
updateTrack(trackId, { visible: true, locked: false });
```

### 问题 3: 性能问题

**原因**: 不恰当的状态订阅

**解决**:
```tsx
// 使用选择器只订阅需要的数据
const currentTime = useTimelineStore((state) => state.currentTime);
// 而不是
const state = useTimelineStore();
```

## 下一步

- 查看 [timeline-implementation-plan.md](./timeline-implementation-plan.md) 了解完整的实现计划
- 查看 [phase1-implementation-summary.md](./phase1-implementation-summary.md) 了解已实现的功能
- 开始实现 Phase 2: 拖拽功能

## 参考资料

- [Zustand 文档](https://github.com/pmndrs/zustand)
- [Immer 文档](https://immerjs.github.io/immer/)
- [DnD Kit 文档](https://docs.dndkit.com/)
- [Framer Motion 文档](https://www.framer.com/motion/)